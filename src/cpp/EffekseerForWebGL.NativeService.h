#include <AL/alc.h>
#include <Effekseer.h>
#include <EffekseerRendererGL.h>
#include <EffekseerSoundAL.h>

namespace EffekseerForWebGL
{

using namespace Effekseer;

typedef uint32_t rawPtr_t;

class NativeService
{
public:
	ManagerRef manager = nullptr;
	EffekseerRendererGL::RendererRef renderer = nullptr;
	EffekseerSound::SoundRef sound = nullptr;
	float time_ = 0.0f;
	bool isFirstUpdate_ = false;
	float restDeltaTime_ = 0.0f;

	Matrix44 projectionMatrix;
	Matrix44 cameraMatrix;

	ALCdevice* alcDevice = nullptr;
	ALCcontext* alcContext = nullptr;

	GLuint backGroundTexture_ = 0;
	uint32_t backGroundTextureWidth_ = 0;
	uint32_t backGroundTextureHeight_ = 0;

	NativeService();

	~NativeService();

	void CalculateCameraDirectionAndPosition(const Matrix44& matrix, Vector3D& direction, Vector3D& position);

	bool Init(int instanceMaxCount, int squareMaxCount, bool isExtentionsEnabled, bool isPremultipliedAlphaEnabled);

	void Terminate();

	void Draw();

	void Update(float deltaFrames);

	void BeginUpdate();

	void EndUpdate();

	void UpdateHandle(int handle, float deltaFrame);

	void BeginDraw();

	void EndDraw();

	void DrawHandle(int handle);

	void SetProjectionMatrix(rawPtr_t matrixElements);

	void SetProjectionPerspective(float fov, float aspect, float, float);

	void SetProjectionOrthographic(float width, float height, float, float);

	void SetCameraMatrix(rawPtr_t matrixElements);

	void SetCameraLookAt(float eyeX, float eyeY, float eyeZ, float atX, float atY, float atZ, float upX, float upY, float upZ);

	rawPtr_t LoadEffect(rawPtr_t data, int32_t size, float magnification);

	void ReleaseEffect(rawPtr_t effect);

	void ReloadResources(rawPtr_t effect, rawPtr_t data, int32_t size);

	void StopAllEffects();

	int PlayEffect(rawPtr_t effect, float x, float y, float z);

	void StopEffect(int handle);

	void StopRoot(int handle);

	bool Exists(int handle);

	void SetFrame(int handle, float frame);

	void SetLocation(int handle, float x, float y, float z);

	void SetRotation(int handle, float x, float y, float z);

	void SetScale(int handle, float x, float y, float z);

	void SetMatrix(int handle, rawPtr_t matrixElements);

	float GetDynamicInput(int handle, int32_t index);

	void SetDynamicInput(int handle, int32_t index, float value);

	void SendTrigger(int handle, int32_t index);

	void SetAllColor(int handle, float r, float g, float b, float a);

	void SetTargetLocation(int handle, float x, float y, float z);

	void SetPaused(int handle, bool paused);

	void SetShown(int handle, bool shown);

	void SetSpeed(int handle, float speed);

	void SetRandomSeed(int handle, float seed);

	int32_t GetRestInstancesCount();

	int GetUpdateTime();

	int GetDrawTime();

	bool IsVertexArrayObjectSupported();

	void SetRestorationOfStatesFlag(bool flag);

	void CaptureBackground(int x, int y, int width, int height);

	void ResetBackground();
};
} // namespace EffekseerForWebGL