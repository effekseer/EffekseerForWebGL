#include <AL/alc.h>
#include <Effekseer.h>
#include <EffekseerRenderer/EffekseerRendererGL.MaterialLoader.h>
#include <EffekseerRenderer/EffekseerRendererGL.RendererImplemented.h>
#include <EffekseerRenderer/GraphicsDevice.h>
#include <EffekseerRendererGL.h>
#include <EffekseerSoundAL.h>

#include "EffekseerForWebGL.Common.hpp"
#include "EffekseerForWebGL.CustomFile.hpp"
#include "EffekseerForWebGL.CustomTexture.hpp"

#include "EffekseerForWebGL.NativeService.h"

EffekseerForWebGL::NativeService::NativeService() = default;

EffekseerForWebGL::NativeService::~NativeService() = default;

void EffekseerForWebGL::NativeService::CalculateCameraDirectionAndPosition(const Matrix44& matrix, Vector3D& direction, Vector3D& position)
{
	const auto& mat = matrix;

	direction = -Vector3D(matrix.Values[0][2], matrix.Values[1][2], matrix.Values[2][2]);

	{
		auto localPos = Vector3D(-mat.Values[3][0], -mat.Values[3][1], -mat.Values[3][2]);
		auto f = Vector3D(mat.Values[0][2], mat.Values[1][2], mat.Values[2][2]);
		auto r = Vector3D(mat.Values[0][0], mat.Values[1][0], mat.Values[2][0]);
		auto u = Vector3D(mat.Values[0][1], mat.Values[1][1], mat.Values[2][1]);

		position = r * localPos.X + u * localPos.Y + f * localPos.Z;
	}
}

bool EffekseerForWebGL::NativeService::Init(int instanceMaxCount,
											int squareMaxCount,
											bool isExtentionsEnabled,
											bool isPremultipliedAlphaEnabled)
{
	SetLogger([](LogType type, const std::string& s) -> void { PrintEffekseerLog("EffekseerLog : " + s); });

	alcDevice = alcOpenDevice(nullptr);
	alcContext = alcCreateContext(alcDevice, nullptr);
	alcMakeContextCurrent(alcContext);

	RefPtr<CustomFileInterface> fileInterface = MakeRefPtr<CustomFileInterface>();
	manager = Manager::Create(instanceMaxCount);
	renderer = EffekseerRendererGL::Renderer::Create(
		squareMaxCount, EffekseerRendererGL::OpenGLDeviceType::OpenGLES2, isExtentionsEnabled, isPremultipliedAlphaEnabled);
	sound = EffekseerSound::Sound::Create(16);

	manager->SetSpriteRenderer(renderer->CreateSpriteRenderer());
	manager->SetRibbonRenderer(renderer->CreateRibbonRenderer());
	manager->SetRingRenderer(renderer->CreateRingRenderer());
	manager->SetModelRenderer(renderer->CreateModelRenderer());
	manager->SetTrackRenderer(renderer->CreateTrackRenderer());
	manager->SetTextureLoader(MakeRefPtr<CustomTextureLoader>(renderer->GetGraphicsDevice().Get()));
	manager->SetModelLoader(renderer->CreateModelLoader(fileInterface));
	manager->SetCurveLoader(MakeRefPtr<CurveLoader>(fileInterface));

	manager->SetMaterialLoader(MakeRefPtr<EffekseerRendererGL::MaterialLoader>(
		renderer->GetGraphicsDevice().DownCast<EffekseerRendererGL::Backend::GraphicsDevice>(), fileInterface, false));
	manager->SetSoundPlayer(sound->CreateSoundPlayer());
	manager->SetSoundLoader(sound->CreateSoundLoader(fileInterface));

	manager->SetCoordinateSystem(CoordinateSystem::RH);

	auto g = renderer->GetGraphicsDevice().DownCast<EffekseerRendererGL::Backend::GraphicsDevice>();

	PrintEffekseerLog("MaxVaryingVectors : " +
					  std::to_string(g->GetProperty(EffekseerRendererGL::Backend::DevicePropertyType::MaxVaryingVectors)));
	return true;
}

void EffekseerForWebGL::NativeService::Terminate()
{
	ResetBackground();

	manager.Reset();
	renderer.Reset();
	sound.Reset();
}

void EffekseerForWebGL::NativeService::Draw()
{
	Vector3D cameraPosition;
	Vector3D cameraFrontDirection;
	CalculateCameraDirectionAndPosition(cameraMatrix, cameraFrontDirection, cameraPosition);

	Manager::LayerParameter layerParam;
	layerParam.ViewerPosition = cameraPosition;
	manager->SetLayerParameter(0, layerParam);

	renderer->SetProjectionMatrix(projectionMatrix);
	renderer->SetCameraMatrix(cameraMatrix);

	renderer->BeginRendering();
	manager->Draw();
	renderer->EndRendering();
}

void EffekseerForWebGL::NativeService::Update(float deltaFrames)
{
	deltaFrames += restDeltaTime_;
	restDeltaTime_ = deltaFrames - int(deltaFrames);
	for (int loop = 0; loop < int(deltaFrames); loop++)
	{
		manager->Update(1.0f);
	}

	time_ += deltaFrames * 1.0f / 60.0f;
	renderer->SetTime(time_);
}

void EffekseerForWebGL::NativeService::BeginUpdate()
{
	manager->BeginUpdate();
	isFirstUpdate_ = true;
}

void EffekseerForWebGL::NativeService::EndUpdate()
{
	manager->EndUpdate();
	renderer->SetTime(time_);
}

void EffekseerForWebGL::NativeService::UpdateHandle(int handle, float deltaFrame)
{
	manager->UpdateHandle(handle, deltaFrame);
	if (isFirstUpdate_)
	{
		time_ += deltaFrame * 1.0f / 60.0f;
		isFirstUpdate_ = false;
	}
}

void EffekseerForWebGL::NativeService::BeginDraw()
{
	renderer->SetProjectionMatrix(projectionMatrix);
	renderer->SetCameraMatrix(cameraMatrix);
	renderer->BeginRendering();
}

void EffekseerForWebGL::NativeService::EndDraw() { renderer->EndRendering(); }

void EffekseerForWebGL::NativeService::DrawHandle(int handle) { manager->DrawHandle(handle); }

void EffekseerForWebGL::NativeService::SetProjectionMatrix(rawPtr_t matrixElements)
{
	ArrayToMatrix44(reinterpret_cast<const float*>(matrixElements), projectionMatrix);
}

void EffekseerForWebGL::NativeService::SetProjectionPerspective(float fov, float aspect, float near, float far)
{
	projectionMatrix.PerspectiveFovRH_OpenGL(fov * 3.1415926f / 180.0f, aspect, near, far);
}

void EffekseerForWebGL::NativeService::SetProjectionOrthographic(float width, float height, float near, float far)
{
	projectionMatrix.OrthographicRH(width, height, near, far);
}

void EffekseerForWebGL::NativeService::SetCameraMatrix(rawPtr_t matrixElements)
{
	ArrayToMatrix44(reinterpret_cast<const float*>(matrixElements), cameraMatrix);
}

void EffekseerForWebGL::NativeService::SetCameraLookAt(
	float eyeX, float eyeY, float eyeZ, float atX, float atY, float atZ, float upX, float upY, float upZ)
{
	cameraMatrix.LookAtRH(Vector3D(eyeX, eyeY, eyeZ), Vector3D(atX, atY, atZ), Vector3D(upX, upY, upZ));
}

EffekseerForWebGL::rawPtr_t EffekseerForWebGL::NativeService::LoadEffect(rawPtr_t data, int32_t size, float magnification)
{
	auto effect = Effect::Create(manager, reinterpret_cast<const uint8_t*>(data), size, magnification);
	return reinterpret_cast<rawPtr_t>(effect.Pin());
}

void EffekseerForWebGL::NativeService::ReleaseEffect(rawPtr_t effect)
{
	auto _effect = reinterpret_cast<Effect*>(effect);
	SafeRelease(_effect);
}

void EffekseerForWebGL::NativeService::ReloadResources(rawPtr_t effect, rawPtr_t data, int32_t size)
{
	auto _effect = reinterpret_cast<Effect*>(effect);
	SafeAddRef<Effect>(_effect);
	auto effectRef = RefPtr<Effect>(_effect);
	if (effectRef == nullptr)
	{
		return;
	}

	effectRef->ReloadResources(reinterpret_cast<const uint8_t*>(data), size);
}

void EffekseerForWebGL::NativeService::StopAllEffects() { manager->StopAllEffects(); }

int EffekseerForWebGL::NativeService::PlayEffect(rawPtr_t effect, float x, float y, float z)
{
	auto _effect = reinterpret_cast<Effect*>(effect);
	SafeAddRef<Effect>(_effect);
	auto effectRef = RefPtr<Effect>(_effect);
	return manager->Play(effectRef, x, y, z);
}

void EffekseerForWebGL::NativeService::StopEffect(int handle) { manager->StopEffect(handle); }

void EffekseerForWebGL::NativeService::StopRoot(int handle) { manager->StopRoot(handle); }

bool EffekseerForWebGL::NativeService::Exists(int handle) { return manager->Exists(handle); }

void EffekseerForWebGL::NativeService::SetFrame(int handle, float frame) { manager->UpdateHandleToMoveToFrame(handle, frame); }

void EffekseerForWebGL::NativeService::SetLocation(int handle, float x, float y, float z) { manager->SetLocation(handle, x, y, z); }

void EffekseerForWebGL::NativeService::SetRotation(int handle, float x, float y, float z) { manager->SetRotation(handle, x, y, z); }

void EffekseerForWebGL::NativeService::SetScale(int handle, float x, float y, float z) { manager->SetScale(handle, x, y, z); }

void EffekseerForWebGL::NativeService::SetMatrix(int handle, rawPtr_t matrixElements)
{
	Matrix43 matrix43;
	ArrayToMatrix43(reinterpret_cast<const float*>(matrixElements), matrix43);
	manager->SetMatrix(handle, matrix43);
}

float EffekseerForWebGL::NativeService::GetDynamicInput(int handle, int32_t index) { return manager->GetDynamicInput(handle, index); }

void EffekseerForWebGL::NativeService::SetDynamicInput(int handle, int32_t index, float value)
{
	manager->SetDynamicInput(handle, index, value);
}

void EffekseerForWebGL::NativeService::SendTrigger(int handle, int32_t index) { manager->SendTrigger(handle, index); }

void EffekseerForWebGL::NativeService::SetAllColor(int handle, float r, float g, float b, float a)
{
	Color color = Color(r, g, b, a);
	manager->SetAllColor(handle, color);
}

void EffekseerForWebGL::NativeService::SetTargetLocation(int handle, float x, float y, float z)
{
	manager->SetTargetLocation(handle, x, y, z);
}

void EffekseerForWebGL::NativeService::SetPaused(int handle, bool paused) { manager->SetPaused(handle, paused); }

void EffekseerForWebGL::NativeService::SetShown(int handle, bool shown) { manager->SetShown(handle, shown); }

void EffekseerForWebGL::NativeService::SetSpeed(int handle, float speed) { manager->SetSpeed(handle, speed); }

void EffekseerForWebGL::NativeService::SetRandomSeed(int handle, float seed) { manager->SetRandomSeed(handle, seed); }

int32_t EffekseerForWebGL::NativeService::GetRestInstancesCount() { return manager->GetRestInstancesCount(); }

int EffekseerForWebGL::NativeService::GetUpdateTime() { return manager->GetUpdateTime(); }

int EffekseerForWebGL::NativeService::GetDrawTime() { return manager->GetDrawTime(); }

bool EffekseerForWebGL::NativeService::IsVertexArrayObjectSupported()
{
	if (renderer == nullptr)
		return 0;

	return renderer->IsVertexArrayObjectSupported();
}

void EffekseerForWebGL::NativeService::SetRestorationOfStatesFlag(bool flag)
{
	if (renderer == nullptr)
		return;

	renderer->SetRestorationOfStatesFlag(flag);
}

void EffekseerForWebGL::NativeService::CaptureBackground(int x, int y, int width, int height)
{
	if (backGroundTextureWidth_ != width || backGroundTextureHeight_ != height)
	{
		if (backGroundTexture_ == 0)
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

void EffekseerForWebGL::NativeService::ResetBackground()
{
	auto r = static_cast<EffekseerRendererGL::Renderer*>(renderer.Get());

	if (backGroundTexture_ > 0)
	{
		glDeleteTextures(1, &backGroundTexture_);
		backGroundTexture_ = 0;
	}
	r->SetBackground(0);
}