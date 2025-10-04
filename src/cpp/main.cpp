#include "Effekseer.h"
#include "EffekseerRendererGL.h"
#include "EffekseerSoundAL.h"
#include <AL/alc.h>
#include <EffekseerRendererGL/EffekseerRendererGL.MaterialLoader.h>
#include <EffekseerRendererGL/EffekseerRendererGL.RendererImplemented.h>
#include <EffekseerRendererGL/GraphicsDevice.h>

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

static bool isEffekseerLogEnabled = false;

static void PrintEffekseerLog(const std::string& message)
{
	if (isEffekseerLogEnabled)
	{
		printf("%s\n", message.c_str());
	}
}

namespace EfkWebViewer
{
using namespace Effekseer;

class CustomTextureLoader : public TextureLoader
{
private:
	::Effekseer::Backend::GraphicsDevice* graphicsDevice_ = nullptr;

public:
	CustomTextureLoader(::Effekseer::Backend::GraphicsDevice* graphicsDevice) : graphicsDevice_(graphicsDevice) {}

	~CustomTextureLoader() = default;

public:
	Effekseer::TextureRef Load(const EFK_CHAR* path, TextureType textureType) override
	{

		// Request to load image
               int loaded = EM_ASM_INT({ return Module._loadImage(Module.UTF16ToString($0)) != null; }, path);
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

                               var img = Module._loadImage(Module.UTF16ToString($0));
				GLctx.bindTexture(GLctx.TEXTURE_2D, GL.textures[$1]);

				var pa = gl.getParameter(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL);
				var oldFlipY = gl.getParameter(gl.UNPACK_FLIP_Y_WEBGL);
				GLctx.pixelStorei(GLctx.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
				GLctx.pixelStorei(GLctx.UNPACK_FLIP_Y_WEBGL, false);
				GLctx.texImage2D(GLctx.TEXTURE_2D, 0, GLctx.RGBA, GLctx.RGBA, GLctx.UNSIGNED_BYTE, img);
				if (Module._isPowerOfTwo(img))
				{
					GLctx.generateMipmap(GLctx.TEXTURE_2D);
				}

				GLctx.pixelStorei(GLctx.UNPACK_PREMULTIPLY_ALPHA_WEBGL, pa);
				GLctx.pixelStorei(GLctx.UNPACK_FLIP_Y_WEBGL, oldFlipY);
				GLctx.bindTexture(GLctx.TEXTURE_2D, binding);
			},
			path,
			texture);

		std::array<char, 260> path8;
		Effekseer::ConvertUtf16ToUtf8(path8.data(), static_cast<int32_t>(path8.size()), path);
		std::string pathStr = path8.data();

		auto backend = static_cast<EffekseerRendererGL::Backend::GraphicsDevice*>(graphicsDevice_)
						   ->CreateTexture(texture, true, [texture, pathStr]() -> void {
							   glDeleteTextures(1, &texture);
							   PrintEffekseerLog("Effekseer : Unload : " + pathStr);
						   });
		auto textureData = Effekseer::MakeRefPtr<Effekseer::Texture>();
		textureData->SetBackend(backend);

		PrintEffekseerLog("Effekseer : Load : " + pathStr);

		return textureData;
	}

	void Unload(Effekseer::TextureRef data) override {}
};

class Context
{
public:
	Effekseer::ManagerRef manager = nullptr;
	EffekseerRendererGL::RendererRef renderer = nullptr;
	EffekseerSound::SoundRef sound = nullptr;
	float time_ = 0.0f;
	bool isFirstUpdate_ = false;
	float restDeltaTime_ = 0.0f;

	Matrix44 projectionMatrix;
	Matrix44 cameraMatrix;

	Effekseer::RefPtr<CustomFileInterface> fileInterface;

	ALCdevice* alcDevice = nullptr;
	ALCcontext* alcContext = nullptr;

	GLuint backGroundTexture_ = 0;
	uint32_t backGroundTextureWidth_ = 0;
	uint32_t backGroundTextureHeight_ = 0;

	//! pass strings
	std::string tempStr;

	void CalculateCameraDirectionAndPosition(const Effekseer::Matrix44& matrix, Effekseer::Vector3D& direction, Effekseer::Vector3D& position)
	{
		const auto& mat = matrix;

		direction = -::Effekseer::Vector3D(matrix.Values[0][2], matrix.Values[1][2], matrix.Values[2][2]);

		{
			auto localPos = ::Effekseer::Vector3D(-mat.Values[3][0], -mat.Values[3][1], -mat.Values[3][2]);
			auto f = ::Effekseer::Vector3D(mat.Values[0][2], mat.Values[1][2], mat.Values[2][2]);
			auto r = ::Effekseer::Vector3D(mat.Values[0][0], mat.Values[1][0], mat.Values[2][0]);
			auto u = ::Effekseer::Vector3D(mat.Values[0][1], mat.Values[1][1], mat.Values[2][1]);

			position = r * localPos.X + u * localPos.Y + f * localPos.Z;
		}
	}

public:
	Context() = default;
	~Context() = default;

	bool Init(int instanceMaxCount, int squareMaxCount, bool isExtentionsEnabled, bool isPremultipliedAlphaEnabled)
	{
		Effekseer::SetLogger([](Effekseer::LogType type, const std::string& s) -> void { PrintEffekseerLog("EffekseerLog : " + s); });

		fileInterface = Effekseer::MakeRefPtr<CustomFileInterface>();
		manager = Manager::Create(instanceMaxCount);
		renderer =
			EffekseerRendererGL::Renderer::Create(squareMaxCount, EffekseerRendererGL::OpenGLDeviceType::OpenGLES2, isExtentionsEnabled, isPremultipliedAlphaEnabled);
		sound = EffekseerSound::Sound::Create(16);

		manager->SetSpriteRenderer(renderer->CreateSpriteRenderer());
		manager->SetRibbonRenderer(renderer->CreateRibbonRenderer());
		manager->SetRingRenderer(renderer->CreateRingRenderer());
		manager->SetModelRenderer(renderer->CreateModelRenderer());
		manager->SetTrackRenderer(renderer->CreateTrackRenderer());
		manager->SetTextureLoader(Effekseer::MakeRefPtr<CustomTextureLoader>(renderer->GetGraphicsDevice().Get()));
		manager->SetModelLoader(renderer->CreateModelLoader(fileInterface));
		manager->SetCurveLoader(Effekseer::MakeRefPtr<Effekseer::CurveLoader>(fileInterface));

		manager->SetMaterialLoader(Effekseer::MakeRefPtr<EffekseerRendererGL::MaterialLoader>(
			renderer->GetGraphicsDevice().DownCast<EffekseerRendererGL::Backend::GraphicsDevice>(), fileInterface, false));
		manager->SetSoundPlayer(sound->CreateSoundPlayer());
		manager->SetSoundLoader(sound->CreateSoundLoader(fileInterface));

		manager->SetCoordinateSystem(CoordinateSystem::RH);

		auto g = renderer->GetGraphicsDevice().DownCast<EffekseerRendererGL::Backend::GraphicsDevice>();

		PrintEffekseerLog("MaxVaryingVectors : " + std::to_string(g->GetProperty(EffekseerRendererGL::Backend::DevicePropertyType::MaxVaryingVectors)));
		return true;
	}

	void Terminate()
	{
		ResetBackground();

		manager.Reset();
		renderer.Reset();
		sound.Reset();
	}

	void Update(float deltaFrames) { manager->Update(deltaFrames); }

	void Draw()
	{
		::Effekseer::Vector3D cameraPosition;
		::Effekseer::Vector3D cameraFrontDirection;
		CalculateCameraDirectionAndPosition(cameraMatrix, cameraFrontDirection, cameraPosition);

		Effekseer::Manager::LayerParameter layerParam;
		layerParam.ViewerPosition = cameraPosition;
		manager->SetLayerParameter(0, layerParam);

		renderer->SetProjectionMatrix(projectionMatrix);
		renderer->SetCameraMatrix(cameraMatrix);

		renderer->BeginRendering();
		manager->Draw();
		renderer->EndRendering();
	}

	void CaptureBackground(int x, int y, int width, int height)
	{
		if (backGroundTextureWidth_ != width || backGroundTextureHeight_ != height)
		{
			if(backGroundTexture_ == 0)
			{
				glGenTextures(1, &backGroundTexture_);
			}
			glBindTexture(GL_TEXTURE_2D, backGroundTexture_);
			glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA, width, height, 0, GL_RGBA, GL_UNSIGNED_BYTE, 0);

			backGroundTextureWidth_ = width;
			backGroundTextureHeight_ = height;
		}

		glBindTexture(GL_TEXTURE_2D, backGroundTexture_);
		glCopyTexSubImage2D(GL_TEXTURE_2D, 0, 0, 0, x, y, width, height);
		glBindTexture(GL_TEXTURE_2D, 0);

		auto r = static_cast<EffekseerRendererGL::Renderer*>(renderer.Get());
		r->SetBackground(backGroundTexture_);
	}

	void ResetBackground()
	{
		auto r = static_cast<EffekseerRendererGL::Renderer*>(renderer.Get());

		if(backGroundTexture_ > 0)
		{
			glDeleteTextures(1, &backGroundTexture_);
			backGroundTexture_ = 0;
		}
		r->SetBackground(0);
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

	EfkWebViewer::Context* EXPORT EffekseerInit(int instanceMaxCount, int squareMaxCount, bool isExtentionsEnabled, bool isPremultipliedAlphaEnabled)
	{
		auto context = new EfkWebViewer::Context();
		// Initialize OpenAL
		context->alcDevice = alcOpenDevice(NULL);
		context->alcContext = alcCreateContext(context->alcDevice, NULL);
		alcMakeContextCurrent(context->alcContext);

		// Initialize viewer
		if (!context->Init(instanceMaxCount, squareMaxCount, isExtentionsEnabled, isPremultipliedAlphaEnabled))
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
		for (int loop = 0; loop < int(deltaFrames); loop++)
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

	void* EXPORT EffekseerLoadEffect(EfkWebViewer::Context* context, void* data, int32_t size, float magnification)
	{
		auto effect = Effect::Create(context->manager, data, size, magnification);
		return effect.Pin();
	}

	void EXPORT EffekseerReleaseEffect(EfkWebViewer::Context* context, void* effect) { Effekseer::RefPtr<Effect>::Unpin(effect); }

	void EXPORT EffekseerReloadResources(EfkWebViewer::Context* context, Effect* effect, void* data, int32_t size)
	{
		auto effectRef = Effekseer::RefPtr<Effect>::FromPinned(effect);
		if (effectRef == nullptr)
		{
			return;
		}

		effectRef->ReloadResources(data, size);
	}

	void EXPORT EffekseerStopAllEffects(EfkWebViewer::Context* context) { context->manager->StopAllEffects(); }

	int EXPORT EffekseerPlayEffect(EfkWebViewer::Context* context, void* effect, float x, float y, float z)
	{
		auto effectRef = Effekseer::RefPtr<Effect>::FromPinned(effect);
		return context->manager->Play(effectRef, x, y, z);
	}

	void EXPORT EffekseerStopEffect(EfkWebViewer::Context* context, int handle) { context->manager->StopEffect(handle); }

	void EXPORT EffekseerStopRoot(EfkWebViewer::Context* context, int handle) { context->manager->StopRoot(handle); }

	int EXPORT EffekseerExists(EfkWebViewer::Context* context, int handle) { return context->manager->Exists(handle) ? 1 : 0; }

	void EXPORT EffekseerSetFrame(EfkWebViewer::Context* context, int handle, float frame)
	{
		context->manager->UpdateHandleToMoveToFrame(handle, frame);
	}

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

	void EXPORT EffekseerSendTrigger(EfkWebViewer::Context* context, int handle, int32_t index)
	{
		context->manager->SendTrigger(handle, index);
	}

	void EXPORT EffekseerSetAllColor(EfkWebViewer::Context* context, int handle, float r, float g, float b, float a)
	{
		Color color = Color(r, g, b, a);
		context->manager->SetAllColor(handle, color);
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

	void EXPORT EffekseerSetRandomSeed(EfkWebViewer::Context* context, int handle, float seed) { context->manager->SetRandomSeed(handle, seed); }

	int32_t EXPORT EffekseerGetRestInstancesCount(EfkWebViewer::Context* context) { return context->manager->GetRestInstancesCount(); }

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

	void EXPORT EffekseerCaptureBackground(EfkWebViewer::Context* context, int x, int y, int width, int height)
	{
		if (context == nullptr)
			return;
		context->CaptureBackground(x, y, width, height);
	}

	void EXPORT EffekseerResetBackground(EfkWebViewer::Context* context)
	{
		if (context == nullptr)
			return;
		context->ResetBackground();
	}

	void EXPORT EffekseerSetLogEnabled(int flag) { isEffekseerLogEnabled = flag > 0; }
}
