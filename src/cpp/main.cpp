#include "Effekseer.h"
#include "EffekseerRendererGL.h"
#include "EffekseerSoundAL.h"
#include <AL/alc.h>
#include <EffekseerRenderer/EffekseerRendererGL.MaterialLoader.h>
#include <EffekseerRenderer/EffekseerRendererGL.RendererImplemented.h>

#include <algorithm>
#include <emscripten.h>
#include <emscripten/bind.h>
#include <math.h>
#include <stdlib.h>

#include "CustomFile.h"

static void ArrayToMatrix44(const float* array, Effekseer::Matrix44& matrix)
{
	for (int i = 0; i < 4; i++)
	{
		for (int j = 0; j < 4; j++)
		{
			matrix.Values[i][j] = array[i * 4 + j];
		}
	}
}

static void ArrayToMatrix43(const float* array, Effekseer::Matrix43& matrix)
{
	for (int i = 0; i < 4; i++)
	{
		for (int j = 0; j < 3; j++)
		{
			matrix.Value[i][j] = array[i * 4 + j];
		}
	}
}

namespace EfkWebViewer
{
using namespace Effekseer;

class CustomTextureLoader : public TextureLoader
{
public:
	CustomTextureLoader() = default;
	~CustomTextureLoader() = default;

public:
	Effekseer::TextureData* Load(const EFK_CHAR* path, TextureType textureType) override
	{

		// Request to load image
		int loaded = EM_ASM_INT({ return Module._loadImage(UTF16ToString($0)) != null; }, path);
		if (!loaded)
		{
			// Loading incompleted
			return nullptr;
		}

		GLuint texture = 0;
		glGenTextures(1, &texture);

		// Load texture from image
		EM_ASM_INT(
			{
				var binding = GLctx.getParameter(GLctx.TEXTURE_BINDING_2D);

				var img = Module._loadImage(UTF16ToString($0));
				GLctx.bindTexture(GLctx.TEXTURE_2D, GL.textures[$1]);

				var pa = gl.getParameter(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL);
				GLctx.pixelStorei(GLctx.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);

				GLctx.texImage2D(GLctx.TEXTURE_2D, 0, GLctx.RGBA, GLctx.RGBA, GLctx.UNSIGNED_BYTE, img);
				if (Module._isPowerOfTwo(img))
				{
					GLctx.generateMipmap(GLctx.TEXTURE_2D);
				}

				GLctx.pixelStorei(GLctx.UNPACK_PREMULTIPLY_ALPHA_WEBGL, pa);

				GLctx.bindTexture(GLctx.TEXTURE_2D, binding);
			},
			path,
			texture);

		Effekseer::TextureData* textureData = new Effekseer::TextureData();
		textureData->UserID = texture;
		return textureData;
	}

	void Unload(Effekseer::TextureData* data) override
	{
		if (data != NULL)
		{
			auto textureData = (Effekseer::TextureData*)data;
			GLuint texture = (GLuint)textureData->UserID;
			if (texture)
			{
				glDeleteTextures(1, &texture);
			}
			delete textureData;
		}
	}
};

class CustomModelLoader : public ModelLoader
{
	FileInterface* m_fileInterface;

public:
	CustomModelLoader(FileInterface* fileInterface) : m_fileInterface(fileInterface) {}

	~CustomModelLoader() = default;

	void* Load(const EFK_CHAR* path)
	{
		std::unique_ptr<Effekseer::FileReader> reader(m_fileInterface->OpenRead(path));

		if (reader.get() != NULL)
		{
			size_t size_model = reader->GetLength();
			char* data_model = new char[size_model];
			reader->Read(data_model, size_model);

			Model* model = new EffekseerRendererGL::Model(data_model, size_model);

			delete[] data_model;

			return (void*)model;
		}

		return NULL;
	}

	void* Load(const void* data, int32_t size) override
	{
		Model* model = new EffekseerRendererGL::Model((void*)data, size);
		return (void*)model;
	}

	void Unload(void* data)
	{
		if (data != NULL)
		{
			Model* model = (Model*)data;
			delete model;
		}
	}
};

class CachedMaterialLoader : public ::Effekseer::MaterialLoader
{
private:
	struct Cached
	{
		::Effekseer::MaterialData* DataPtr;
		int32_t Count;

		Cached()
		{
			DataPtr = nullptr;
			Count = 1;
		}
	};

	::Effekseer::MaterialLoader* loader_;
	std::map<std::basic_string<EFK_CHAR>, Cached> cache_;
	std::map<void*, std::basic_string<EFK_CHAR>> data2key_;

public:
	CachedMaterialLoader(::Effekseer::MaterialLoader* loader) { this->loader_ = loader; }

	virtual ~CachedMaterialLoader() { ES_SAFE_DELETE(loader_); }

	virtual ::Effekseer::MaterialData* Load(const EFK_CHAR* path) override
	{
		auto key = std::basic_string<EFK_CHAR>(path);

		auto it = cache_.find(key);

		if (it != cache_.end())
		{
			it->second.Count++;
			return it->second.DataPtr;
		}

		Cached v;
		v.DataPtr = loader_->Load(path);

		if (v.DataPtr != nullptr)
		{
			cache_[key] = v;
			data2key_[v.DataPtr] = key;
		}

		return v.DataPtr;
	}

	virtual void Unload(::Effekseer::MaterialData* data) override
	{
		if (data == nullptr)
			return;
		auto key = data2key_[data];

		auto it = cache_.find(key);

		if (it != cache_.end())
		{
			it->second.Count--;
			if (it->second.Count == 0)
			{
				loader_->Unload(it->second.DataPtr);
				data2key_.erase(data);
				cache_.erase(key);
			}
		}
	}
};

class Context
{
public:
	Manager* manager = NULL;
	EffekseerRendererGL::Renderer* renderer = NULL;
	EffekseerSound::Sound* sound = NULL;
	float time_ = 0.0f;
	bool isFirstUpdate_ = false;
	float restDeltaTime_ = 0.0f;

	Matrix44 projectionMatrix;
	Matrix44 cameraMatrix;

	CustomFileInterface fileInterface;

	ALCdevice* alcDevice = nullptr;
	ALCcontext* alcContext = nullptr;

	//! pass strings
	std::string tempStr;

public:
	Context() = default;
	~Context() = default;

	bool Init(int instanceMaxCount, int squareMaxCount)
	{
		manager = Manager::Create(instanceMaxCount);
		renderer = EffekseerRendererGL::Renderer::Create(squareMaxCount, EffekseerRendererGL::OpenGLDeviceType::OpenGLES2);
		sound = EffekseerSound::Sound::Create(16);

		manager->SetSpriteRenderer(renderer->CreateSpriteRenderer());
		manager->SetRibbonRenderer(renderer->CreateRibbonRenderer());
		manager->SetRingRenderer(renderer->CreateRingRenderer());
		manager->SetModelRenderer(renderer->CreateModelRenderer());
		manager->SetTrackRenderer(renderer->CreateTrackRenderer());
		manager->SetTextureLoader(new CustomTextureLoader());
		manager->SetModelLoader(new CustomModelLoader(&fileInterface));

		auto r = static_cast<EffekseerRendererGL::RendererImplemented*>(renderer);
		manager->SetMaterialLoader(new CachedMaterialLoader(
			new EffekseerRendererGL::MaterialLoader(r->GetDeviceType(), r, r->GetDeviceObjectCollection(), &fileInterface, false)));
		manager->SetSoundPlayer(sound->CreateSoundPlayer());
		manager->SetSoundLoader(sound->CreateSoundLoader(&fileInterface));

		manager->SetCoordinateSystem(CoordinateSystem::RH);

		return true;
	}

	void Terminate()
	{
		manager->Destroy();
		renderer->Destroy();
		sound->Destroy();
	}

	void Update(float deltaFrames) { manager->Update(deltaFrames); }

	void Draw()
	{
		renderer->SetProjectionMatrix(projectionMatrix);
		renderer->SetCameraMatrix(cameraMatrix);

		renderer->BeginRendering();
		manager->Draw();
		renderer->EndRendering();
	}
};

//! pass strings
std::string tempStr;
} // namespace EfkWebViewer

#define EXPORT EMSCRIPTEN_KEEPALIVE

int main(int argc, char* argv[]) { return 0; }

extern "C"
{
	using namespace Effekseer;

	EfkWebViewer::Context* EXPORT EffekseerInit(int instanceMaxCount, int squareMaxCount)
	{
		auto context = new EfkWebViewer::Context();
		// Initialize OpenAL
		context->alcDevice = alcOpenDevice(NULL);
		context->alcContext = alcCreateContext(context->alcDevice, NULL);
		alcMakeContextCurrent(context->alcContext);

		// Initialize viewer
		if (!context->Init(instanceMaxCount, squareMaxCount))
		{
			delete context;
			return nullptr;
		}

		return context;
	}

	void EXPORT EffekseerTerminate(EfkWebViewer::Context* context)
	{
		context->Terminate();
		delete context;
	}

	void EXPORT EffekseerUpdate(EfkWebViewer::Context* context, float deltaFrames)
	{
		deltaFrames += context->restDeltaTime_;
		context->restDeltaTime_ = deltaFrames - int(deltaFrames);
		for(int loop = 0; loop < int(deltaFrames); loop++)
		{
			context->Update(1);
		}

		context->time_ += deltaFrames * 1.0f / 60.0f;
		context->renderer->SetTime(context->time_);
	}

	void EXPORT EffekseerBeginUpdate(EfkWebViewer::Context* context)
	{
		context->manager->BeginUpdate();
		context->isFirstUpdate_ = true;
	}

	void EXPORT EffekseerEndUpdate(EfkWebViewer::Context* context)
	{
		context->manager->EndUpdate();
		context->renderer->SetTime(context->time_);
	}

	void EXPORT EffekseerUpdateHandle(EfkWebViewer::Context* context, int handle, float deltaFrame)
	{
		context->manager->UpdateHandle(handle, deltaFrame);
		if (context->isFirstUpdate_)
		{
			context->time_ += deltaFrame * 1.0f / 60.0f;
			context->isFirstUpdate_ = false;
		}
	}

	void EXPORT EffekseerDraw(EfkWebViewer::Context* context) { context->Draw(); }

	void EXPORT EffekseerBeginDraw(EfkWebViewer::Context* context)
	{
		context->renderer->SetProjectionMatrix(context->projectionMatrix);
		context->renderer->SetCameraMatrix(context->cameraMatrix);
		context->renderer->BeginRendering();
	}

	void EXPORT EffekseerEndDraw(EfkWebViewer::Context* context) { context->renderer->EndRendering(); }

	void EXPORT EffekseerDrawHandle(EfkWebViewer::Context* context, int handle) { context->manager->DrawHandle(handle); }

	void EXPORT EffekseerSetProjectionMatrix(EfkWebViewer::Context* context, const float* matrixElements)
	{
		ArrayToMatrix44(matrixElements, context->projectionMatrix);
	}

	void EXPORT EffekseerSetProjectionPerspective(EfkWebViewer::Context* context, float fov, float aspect, float near, float far)
	{
		context->projectionMatrix.PerspectiveFovRH_OpenGL(fov * 3.1415926f / 180.0f, aspect, near, far);
	}

	void EXPORT EffekseerSetProjectionOrthographic(EfkWebViewer::Context* context, float width, float height, float near, float far)
	{
		context->projectionMatrix.OrthographicRH(width, height, near, far);
	}

	void EXPORT EffekseerSetCameraMatrix(EfkWebViewer::Context* context, const float* matrixElements)
	{
		ArrayToMatrix44(matrixElements, context->cameraMatrix);
	}

	void EXPORT EffekseerSetCameraLookAt(EfkWebViewer::Context* context,
										 float eyeX,
										 float eyeY,
										 float eyeZ,
										 float atX,
										 float atY,
										 float atZ,
										 float upX,
										 float upY,
										 float upZ)
	{
		context->cameraMatrix.LookAtRH(Vector3D(eyeX, eyeY, eyeZ), Vector3D(atX, atY, atZ), Vector3D(upX, upY, upZ));
	}

	Effect* EXPORT EffekseerLoadEffect(EfkWebViewer::Context* context, void* data, int32_t size, float magnification)
	{
		return Effect::Create(context->manager, data, size, magnification);
	}

	void EXPORT EffekseerReleaseEffect(EfkWebViewer::Context* context, Effect* effect) { effect->Release(); }

	void EXPORT EffekseerReloadResources(EfkWebViewer::Context* context, Effect* effect, void* data, int32_t size)
	{
		effect->ReloadResources(data, size);
	}

	void EXPORT EffekseerStopAllEffects(EfkWebViewer::Context* context) { context->manager->StopAllEffects(); }

	int EXPORT EffekseerPlayEffect(EfkWebViewer::Context* context, Effect* effect, float x, float y, float z)
	{
		return context->manager->Play(effect, x, y, z);
	}

	void EXPORT EffekseerStopEffect(EfkWebViewer::Context* context, int handle) { context->manager->StopEffect(handle); }

	void EXPORT EffekseerStopRoot(EfkWebViewer::Context* context, int handle) { context->manager->StopRoot(handle); }

	int EXPORT EffekseerExists(EfkWebViewer::Context* context, int handle) { return context->manager->Exists(handle) ? 1 : 0; }

	void EXPORT EffekseerSetLocation(EfkWebViewer::Context* context, int handle, float x, float y, float z)
	{
		context->manager->SetLocation(handle, x, y, z);
	}

	void EXPORT EffekseerSetRotation(EfkWebViewer::Context* context, int handle, float x, float y, float z)
	{
		context->manager->SetRotation(handle, x, y, z);
	}

	void EXPORT EffekseerSetScale(EfkWebViewer::Context* context, int handle, float x, float y, float z)
	{
		context->manager->SetScale(handle, x, y, z);
	}

	void EXPORT EffekseerSetMatrix(EfkWebViewer::Context* context, int handle, const float* matrixElements)
	{
		Matrix43 matrix43;
		ArrayToMatrix43(matrixElements, matrix43);
		context->manager->SetMatrix(handle, matrix43);
	}

	float EXPORT EffekseerGetDynamicInput(EfkWebViewer::Context* context, int handle, int32_t index)
	{
		return context->manager->GetDynamicInput(handle, index);
	}

	void EXPORT EffekseerSetDynamicInput(EfkWebViewer::Context* context, int handle, int32_t index, float value)
	{
		context->manager->SetDynamicInput(handle, index, value);
	}

	void EXPORT EffekseerSetTargetLocation(EfkWebViewer::Context* context, int handle, float x, float y, float z)
	{
		context->manager->SetTargetLocation(handle, x, y, z);
	}

	void EXPORT EffekseerSetPaused(EfkWebViewer::Context* context, int handle, int paused)
	{
		context->manager->SetPaused(handle, paused != 0);
	}

	void EXPORT EffekseerSetShown(EfkWebViewer::Context* context, int handle, int shown) { context->manager->SetShown(handle, shown != 0); }

	void EXPORT EffekseerSetSpeed(EfkWebViewer::Context* context, int handle, float speed) { context->manager->SetSpeed(handle, speed); }

	int32_t EXPORT EffekseerGetRestInstancesCount(EfkWebViewer::Context* context)
	{
		return context->manager->GetRestInstancesCount();
	}

	int EXPORT EffekseerGetUpdateTime(EfkWebViewer::Context* context) { return context->manager->GetUpdateTime(); }

	int EXPORT EffekseerGetDrawTime(EfkWebViewer::Context* context) { return context->manager->GetDrawTime(); }

	int EXPORT EffekseerIsVertexArrayObjectSupported(EfkWebViewer::Context* context)
	{
		if (context->renderer == nullptr)
			return 0;

		return context->renderer->IsVertexArrayObjectSupported() ? 1 : 0;
	}

	void EXPORT EffekseerSetRestorationOfStatesFlag(EfkWebViewer::Context* context, int flag)
	{
		if (context->renderer == nullptr)
			return;
		context->renderer->SetRestorationOfStatesFlag(flag > 0);
	}
}
