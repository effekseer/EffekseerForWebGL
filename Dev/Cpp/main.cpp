#include <stdlib.h>
#include <math.h>
#include <algorithm>
#include <emscripten.h>
#include <emscripten/bind.h>
#include <AL/alc.h>
#include "Effekseer.h"
#include "EffekseerRendererGL.h"
#include "EffekseerSoundAL.h"
#include <EffekseerRenderer/EffekseerRendererArea.Renderer.h>

#include "glTFEffectFactory.h"
#include "glbEffectFactory.h"

#include "CustomFile.h"
#define STB_IMAGE_IMPLEMENTATION
#include "stb_image.h"

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
			int loaded = EM_ASM_INT({
				return Module._loadImage(UTF16ToString($0)) != null;
			}, path);
			if (!loaded) {
				// Loading incompleted
				return nullptr;
			}

			GLuint texture = 0;
			glGenTextures(1, &texture);

			// Load texture from image
			EM_ASM_INT({
				var binding = GLctx.getParameter(GLctx.TEXTURE_BINDING_2D);

				var img = Module._loadImage(UTF16ToString($0));
				GLctx.bindTexture(GLctx.TEXTURE_2D, GL.textures[$1]);
				GLctx.texImage2D(GLctx.TEXTURE_2D, 0, GLctx.RGBA, GLctx.RGBA, GLctx.UNSIGNED_BYTE, img);
				if (Module._isPowerOfTwo(img)) {
					GLctx.generateMipmap(GLctx.TEXTURE_2D);
				}
				GLctx.bindTexture(GLctx.TEXTURE_2D, binding);
			}, path, texture);
			
			Effekseer::TextureData* textureData = new Effekseer::TextureData();
			textureData->UserID = texture;
			return textureData;
		}

		Effekseer::TextureData* Load(const void* data, int32_t size, TextureType textureType) override
		{
			int width;
			int height;
			int channel;

			uint8_t* img_ptr = stbi_load_from_memory((const uint8_t*)data, size, &width, &height, &channel, 4);

			GLint binding = 0;

			glGetIntegerv(GL_TEXTURE_BINDING_2D, &binding);

			GLuint texture = 0;
			glGenTextures(1, &texture);
			glBindTexture(GL_TEXTURE_2D, texture);
			glTexImage2D(GL_TEXTURE_2D,
					 0,
					 GL_RGBA,
					 width,
					 height,
					 0,
					 GL_RGBA,
					 GL_UNSIGNED_BYTE,
					 img_ptr);

			// Generate mipmap
			glGenerateMipmap(GL_TEXTURE_2D);

			glBindTexture(GL_TEXTURE_2D, binding);
			stbi_image_free(img_ptr);

			auto textureData = new Effekseer::TextureData();
			textureData->UserPtr = nullptr;
			textureData->UserID = texture;
			textureData->TextureFormat = Effekseer::TextureFormatType::ABGR8;
			textureData->Width = width;
			textureData->Height = height;
			return textureData;
		}

		void Unload(Effekseer::TextureData* data ) override
		{
			if (data != NULL)
			{
				auto textureData = (Effekseer::TextureData*)data;
				GLuint texture = (GLuint)textureData->UserID;
				if (texture) {
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
		CustomModelLoader( FileInterface* fileInterface )
			: m_fileInterface	( fileInterface )
		{
		}

		~CustomModelLoader() = default;

		void* Load( const EFK_CHAR* path )
		{
			std::unique_ptr<Effekseer::FileReader> 
				reader( m_fileInterface->OpenRead( path ) );
			
			if( reader.get() != NULL )
			{
				size_t size_model = reader->GetLength();
				char* data_model = new char[size_model];
				reader->Read( data_model, size_model );

				Model* model = new EffekseerRendererGL::Model(data_model, size_model);

				delete [] data_model;

				return (void*)model;
			}

			return NULL;
		}

		void* Load(const void* data, int32_t size) override
		{
			Model* model = new EffekseerRendererGL::Model((void*)data, size);
			return (void*)model;
		}

		void Unload( void* data )
		{
			if( data != NULL )
			{
				Model* model = (Model*)data;
				delete model;
			}
		}
	};


	class Context
	{
	public:
		Manager* manager = NULL;
		EffekseerRendererGL::Renderer* renderer = NULL;
		EffekseerSound::Sound* sound = NULL;

		Matrix44 projectionMatrix;
		Matrix44 cameraMatrix;

		CustomFileInterface fileInterface;
			
		glbEffectFactory* glbEffectFactory_ = nullptr;
		glTFEffectFactory* glTFEffectFactory_ = nullptr;

		//! pass strings
		std::string tempStr;

	public:
		Context() = default;
		~Context() = default;
		
		bool Init(int instanceMaxCount, int squareMaxCount) {
			manager = Manager::Create(instanceMaxCount);
			renderer = EffekseerRendererGL::Renderer::Create(squareMaxCount, 
				EffekseerRendererGL::OpenGLDeviceType::OpenGLES2);
			sound = EffekseerSound::Sound::Create(16);

			manager->SetSpriteRenderer( renderer->CreateSpriteRenderer() );
			manager->SetRibbonRenderer( renderer->CreateRibbonRenderer() );
			manager->SetRingRenderer( renderer->CreateRingRenderer() );
			manager->SetModelRenderer( renderer->CreateModelRenderer() );
			manager->SetTrackRenderer( renderer->CreateTrackRenderer() );
			manager->SetTextureLoader( new CustomTextureLoader() );
			manager->SetModelLoader( new CustomModelLoader(&fileInterface) );
		
			manager->SetSoundPlayer( sound->CreateSoundPlayer() );
			manager->SetSoundLoader( sound->CreateSoundLoader(&fileInterface) );

			manager->SetCoordinateSystem( CoordinateSystem::RH );
			
			glbEffectFactory_ = new glbEffectFactory();
			glTFEffectFactory_ = new glTFEffectFactory();

			manager->GetSetting()->AddEffectFactory(glbEffectFactory_);
			manager->GetSetting()->AddEffectFactory(glTFEffectFactory_);

			return true;
		}
		
		void Update(float deltaFrames) {
			manager->Update(deltaFrames);
		}
		
		void Draw() {
			renderer->SetProjectionMatrix(projectionMatrix);
			renderer->SetCameraMatrix(cameraMatrix);

			renderer->BeginRendering();
			manager->Draw();
			renderer->EndRendering();
		}
	};
}

static ALCdevice* alcDevice;
static ALCcontext* alcContext;
static EfkWebViewer::Context viewer;

#define EXPORT EMSCRIPTEN_KEEPALIVE

static void ArrayToMatrix44(const float* array, Effekseer::Matrix44& matrix) {
	for (int i = 0; i < 4; i++) {
		for (int j = 0; j < 4; j++) {
			matrix.Values[i][j] = array[i * 4 + j];
		}
	}
}

static void ArrayToMatrix43(const float* array, Effekseer::Matrix43& matrix) {
	for (int i = 0; i < 4; i++) {
		for (int j = 0; j < 3; j++) {
			matrix.Value[i][j] = array[i * 4 + j];
		}
	}
}


int main(int argc, char *argv[])
{
	return 0;
}



extern "C" {
	using namespace Effekseer;

	struct BoundingBox
	{
		int Left;
		int Top;
		int Right;
		int Bottom;
	};

	void EXPORT EffekseerEstimateBoundingBox(::BoundingBox* ret, Effekseer::Effect* effect, float* cameraMat, float* projMat, int screenWidth, int screenHeight, int32_t time, float rate)
	{
		Effekseer::Matrix44 cameraMat_;
		Effekseer::Matrix44 projMat_;
		ArrayToMatrix44(cameraMat, cameraMat_);
		ArrayToMatrix44(projMat, projMat_);

		EffekseerRendererArea::BoundingBoxEstimator estimator;
		auto bb = estimator.Estimate(effect, cameraMat_, projMat_, screenWidth, screenHeight, time, rate, -1.0f, 1.0f);

		ret->Top = bb.Top;
		ret->Left = bb.Left;
		ret->Right = bb.Right;
		ret->Bottom = bb.Bottom;
	}

	int EXPORT EffekseerInit(int instanceMaxCount, int squareMaxCount)
	{
		// Initialize OpenAL
		alcDevice = alcOpenDevice(NULL);
		alcContext = alcCreateContext(alcDevice, NULL);
		alcMakeContextCurrent(alcContext);

		// Initialize viewer
		if (!viewer.Init(instanceMaxCount, squareMaxCount)) {
		  return 0;
		}

		return 1;
	}

	void EXPORT EffekseerUpdate(float deltaFrames)
	{
		viewer.Update(deltaFrames);
	}

	void EXPORT EffekseerDraw()
	{
		viewer.Draw();
	}

	void EXPORT EffekseerSetProjectionMatrix(const float* matrixElements)
	{
		ArrayToMatrix44(matrixElements, viewer.projectionMatrix);
	}

	void EXPORT EffekseerSetProjectionPerspective(float fov, float aspect, float near, float far)
	{
		viewer.projectionMatrix.PerspectiveFovRH_OpenGL(fov * 3.1415926f / 180.0f, aspect, near, far);
	}

	void EXPORT EffekseerSetProjectionOrthographic(float width, float height, float near, float far)
	{
		viewer.projectionMatrix.OrthographicRH(width, height, near, far);
	}

	void EXPORT EffekseerSetCameraMatrix(const float* matrixElements)
	{
		ArrayToMatrix44(matrixElements, viewer.cameraMatrix);
	}

	void EXPORT EffekseerSetCameraLookAt(float eyeX, float eyeY, float eyeZ, 
		float atX, float atY, float atZ, float upX, float upY, float upZ)
	{
		viewer.cameraMatrix.LookAtRH(Vector3D(eyeX, eyeY, eyeZ), 
			Vector3D(atX, atY, atZ), Vector3D(upX, upY, upZ));
	}

	Effect* EXPORT EffekseerLoadEffect(void* data, int32_t size)
	{
		return Effect::Create(viewer.manager, data, size);
	}

	void EXPORT EffekseerReleaseEffect(Effect* effect)
	{
		effect->Release();
	}
	
	void EXPORT EffekseerReloadResources(Effect* effect, void* data, int32_t size)
	{
		effect->ReloadResources(data, size);
	}

	void EXPORT EffekseerStopAllEffects()
	{
		viewer.manager->StopAllEffects();
	}

	int EXPORT EffekseerPlayEffect(Effect* effect, float x, float y, float z)
	{
		return viewer.manager->Play(effect, x, y, z);
	}

	void EXPORT EffekseerStopEffect(int handle)
	{
		viewer.manager->StopEffect(handle);
	}

	void EXPORT EffekseerStopRoot(int handle)
	{
		viewer.manager->StopRoot(handle);
	}

	int EXPORT EffekseerExists(int handle)
	{
		return viewer.manager->Exists(handle) ? 1 : 0;
	}

	void EXPORT EffekseerSetLocation(int handle, float x, float y, float z)
	{
		viewer.manager->SetLocation(handle, x, y, z);
	}

	void EXPORT EffekseerSetRotation(int handle, float x, float y, float z)
	{
		viewer.manager->SetRotation(handle, x, y, z);
	}

	void EXPORT EffekseerSetScale(int handle, float x, float y, float z)
	{
		viewer.manager->SetScale(handle, x, y, z);
	}

	void EXPORT EffekseerSetMatrix(int handle, const float* matrixElements)
	{
		Matrix43 matrix43;
		ArrayToMatrix43(matrixElements, matrix43);
		viewer.manager->SetMatrix(handle, matrix43);
	}

	void EXPORT EffekseerSetTargetLocation(int handle, float x, float y, float z)
	{
		viewer.manager->SetTargetLocation(handle, x, y, z);
	}

	void EXPORT EffekseerSetPause(int handle, int paused)
	{
		viewer.manager->SetPaused(handle, paused != 0);
	}

	void EXPORT EffekseerSetShown(int handle, int shown)
	{
		viewer.manager->SetShown(handle, shown != 0);
	}

	void EXPORT EffekseerSetSpeed(int handle, float speed)
	{
		viewer.manager->SetSpeed(handle, speed);
	}

	int EXPORT EffekseerIsBinaryglTF(void* data, int32_t size)
	{
		return viewer.glTFEffectFactory_->OnCheckIsBinarySupported(data, size) ? 1 : 0;
	}

	const char* EXPORT EffekseerGetglTFBodyURI(void* data, int32_t size)
	{
		viewer.tempStr = viewer.glTFEffectFactory_->GetBodyURI(data, size);
		return viewer.tempStr.c_str();
	}

	int EXPORT EffekseerIsVertexArrayObjectSupported()
	{
		if (viewer.renderer == nullptr)
			return 0;

		return viewer.renderer->IsVertexArrayObjectSupported() ? 1 : 0;
	}

}
