#include <stdlib.h>
#include <math.h>
#include <algorithm>
#include <emscripten.h>
#include <AL/alc.h>
#include "Effekseer.h"
#include "EffekseerRendererGL.h"
#include "EffekseerSoundAL.h"

namespace EfkWebViewer
{
	using namespace Effekseer;

	class CustomTextureLoader : public TextureLoader
	{
	public:
		CustomTextureLoader() = default;
		~CustomTextureLoader() = default;

	public:
		void* Load(const EFK_CHAR* path, TextureType textureType) override {
			
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
				var img = Module._loadImage(UTF16ToString($0));
				GLctx.bindTexture(GLctx.TEXTURE_2D, GL.textures[$1]);
				GLctx.texImage2D(GLctx.TEXTURE_2D, 0, GLctx.RGBA, GLctx.RGBA, GLctx.UNSIGNED_BYTE, img);
				if (Module._isPowerOfTwo(img)) {
					GLctx.generateMipmap(GLctx.TEXTURE_2D);
				}
				GLctx.bindTexture(GLctx.TEXTURE_2D, null);
			}, path, texture);
			
			return (void*)texture;
		}

		void Unload( void* data ) override {
			GLuint texture = (GLuint)data;
			if (texture) {
				glDeleteTextures(1, &texture);
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

		void Unload( void* data )
		{
			if( data != NULL )
			{
				Model* model = (Model*)data;
				delete model;
			}
		}
	};

	class CustomFileReader : public FileReader
	{
		uint8_t* fileData;
		size_t fileSize;
		int currentPosition;
	public:
		CustomFileReader(uint8_t* fileData, size_t fileSize) 
			: fileData(fileData), fileSize(fileSize), currentPosition(0) {
		}
		~CustomFileReader() {
			free(fileData);
		}
		size_t Read( void* buffer, size_t size) {
			if (currentPosition + size > fileSize) {
				size = fileSize - currentPosition;
			}
			memcpy(buffer, fileData + currentPosition, size);
			currentPosition += size;
			return size;
		}
		void Seek(int position) {
			currentPosition = position;
		}
		int GetPosition() {
			return currentPosition;
		}
		size_t GetLength() {
			return fileSize;
		}
	};

	class CustomFileInterface : public FileInterface
	{
	public:
		FileReader* OpenRead( const EFK_CHAR* path ) {
			// Request to load file
			int loaded = EM_ASM_INT({
				return Module._loadBinary(UTF16ToString($0)) != null;
			}, path);
			if (!loaded) {
				return nullptr;
			}

			uint8_t *fileData;
			int fileSize;

			// Copy data from arraybuffer
			EM_ASM_INT({
				var buffer = Module._loadBinary(UTF16ToString($0));
				var memptr = _malloc(buffer.byteLength);
				HEAP8.set(new Uint8Array(buffer), memptr);
				setValue($1, memptr, "i32");
				setValue($2, buffer.byteLength, "i32");
			}, path, &fileData, &fileSize);

			return new CustomFileReader(fileData, fileSize);
		}
		FileWriter* OpenWrite( const EFK_CHAR* path ) {
			return nullptr;
		}
	};

	class Context
	{
	public:
		Manager* manager = NULL;
		EffekseerRenderer::Renderer* renderer = NULL;
		EffekseerSound::Sound* sound = NULL;

		Matrix44 projectionMatrix;
		Matrix44 cameraMatrix;

		CustomFileInterface fileInterface;
			
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

int main(int argc, char *argv[])
{
	return 0;
}

extern "C" {
	using namespace Effekseer;

	static void ArrayToMatrix44(const float* array, Matrix44& matrix) {
		for (int i = 0; i < 4; i++) {
			for (int j = 0; j < 4; j++) {
				matrix.Values[i][j] = array[i * 4 + j];
			}
		}
	}

	static void ArrayToMatrix43(const float* array, Matrix43& matrix) {
		for (int i = 0; i < 4; i++) {
			for (int j = 0; j < 3; j++) {
				matrix.Value[i][j] = array[i * 4 + j];
			}
		}
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
	
	void EXPORT EffekseerReloadResources(Effect* effect)
	{
		effect->ReloadResources();
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

}
