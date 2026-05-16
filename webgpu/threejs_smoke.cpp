#if !defined(__EMSCRIPTEN__)
#error This smoke test is browser-only and requires Emscripten.
#endif

#include <Runtime/EffectPlatformLLGI.h>
#include <Effekseer.h>
#include <EffekseerRendererLLGI/EffekseerRendererLLGI.Renderer.h>
#include <EffekseerRendererLLGI/GraphicsDevice.h>
#include <EffekseerRendererWebGPU.h>
#include <emscripten.h>
#include <LLGI.CommandList.h>
#include <LLGI.Graphics.h>
#include <LLGI.Texture.h>
#include <WebGPU/LLGI.CompilerWebGPU.h>
#include <WebGPU/LLGI.PlatformWebGPU.h>

#include <array>
#include <algorithm>
#include <cassert>
#include <cmath>
#include <cstdlib>
#include <cstring>
#include <iostream>
#include <memory>
#include <stdexcept>
#include <string>
#include <vector>

namespace
{

struct SmokeOptions
{
	std::string EffectPath = "/TestData/Effects/10/SimpleLaser.efk";
	int32_t Width = 320;
	int32_t Height = 240;
	int32_t Frames = 36;
	size_t MinimumChangedPixels = 100;
};

const char* OffscreenCopyVertexShaderWGSL = R"(
struct VSInput {
    @location(0) position: vec3<f32>,
    @location(1) uv: vec2<f32>,
    @location(2) color: vec4<f32>,
};

struct VSOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) uv: vec2<f32>,
    @location(1) color: vec4<f32>,
};

@vertex
fn main(input: VSInput) -> VSOutput {
    var output: VSOutput;
    output.position = vec4<f32>(input.position, 1.0);
    output.uv = input.uv;
    output.color = input.color;
    return output;
}
)";

const char* OffscreenCopyPixelShaderWGSL = R"(
@group(1) @binding(0) var colorTexture: texture_2d<f32>;
@group(2) @binding(0) var colorSampler: sampler;

struct PSInput {
    @location(0) uv: vec2<f32>,
    @location(1) color: vec4<f32>,
};

@fragment
fn main(input: PSInput) -> @location(0) vec4<f32> {
    return textureSample(colorTexture, colorSampler, input.uv);
}
)";

class EffectPlatformWebGPUOffscreen;

class DistortingCallbackWebGPUOffscreen : public EffekseerRenderer::DistortingCallback
{
	EffectPlatformWebGPUOffscreen* platform_ = nullptr;
	Effekseer::Backend::TextureRef texture_ = nullptr;

public:
	explicit DistortingCallbackWebGPUOffscreen(EffectPlatformWebGPUOffscreen* platform)
		: platform_(platform)
	{
	}

	~DistortingCallbackWebGPUOffscreen() override { texture_.Reset(); }

	bool OnDistorting(EffekseerRenderer::Renderer* renderer) override;
};

class EffectPlatformWebGPUOffscreen final : public EffectPlatformLLGI
{
	LLGI::Texture* backgroundTexture_ = nullptr;

	void InitializeWindow() override
	{
		auto device = wgpu::Device::Acquire(emscripten_webgpu_get_device());
		if (device == nullptr)
		{
			throw std::runtime_error("Failed to get preinitialized browser WebGPU device.");
		}

		auto platform = new LLGI::PlatformWebGPU();
		if (!platform->Initialize(device, initParam_.VSync))
		{
			LLGI::SafeRelease(platform);
			throw std::runtime_error("Failed to initialize offscreen LLGI WebGPU platform.");
		}

		platform_ = platform;
		graphics_ = platform_->CreateGraphics();
		if (graphics_ == nullptr)
		{
			throw std::runtime_error("Failed to create LLGI WebGPU graphics.");
		}

		sfMemoryPool_ = graphics_->CreateSingleFrameMemoryPool(1024 * 1024, 128);
		commandListPool_ = std::make_shared<LLGI::CommandListPool>(graphics_, sfMemoryPool_, 3);
	}

	void CreateShaders() override
	{
		auto compiler = new LLGI::CompilerWebGPU();
		compiler->Initialize();

		LLGI::CompilerResult resultVS;
		LLGI::CompilerResult resultPS;
		compiler->Compile(resultVS, OffscreenCopyVertexShaderWGSL, LLGI::ShaderStageType::Vertex);
		compiler->Compile(resultPS, OffscreenCopyPixelShaderWGSL, LLGI::ShaderStageType::Pixel);
		assert(resultVS.Message == "");
		assert(resultPS.Message == "");
		compiler->Release();

		std::vector<LLGI::DataStructure> dataVS;
		std::vector<LLGI::DataStructure> dataPS;
		for (auto& binary : resultVS.Binary)
		{
			LLGI::DataStructure data;
			data.Data = binary.data();
			data.Size = static_cast<int32_t>(binary.size());
			dataVS.push_back(data);
		}
		for (auto& binary : resultPS.Binary)
		{
			LLGI::DataStructure data;
			data.Data = binary.data();
			data.Size = static_cast<int32_t>(binary.size());
			dataPS.push_back(data);
		}

		shader_vs_ = graphics_->CreateShader(dataVS.data(), static_cast<int32_t>(dataVS.size()));
		shader_ps_ = graphics_->CreateShader(dataPS.data(), static_cast<int32_t>(dataPS.size()));
	}

	EffekseerRenderer::RendererRef CreateRenderer() override
	{
		::EffekseerRendererWebGPU::RenderPassInformation renderPassInfo;
		renderPassInfo.DoesPresentToScreen = false;
		renderPassInfo.RenderTextureCount = 1;
		renderPassInfo.RenderTextureFormats[0] = wgpu::TextureFormat::RGBA8Unorm;
		renderPassInfo.DepthFormat = wgpu::TextureFormat::Depth32Float;

		auto graphicsDevice = Effekseer::MakeRefPtr<EffekseerRendererLLGI::Backend::GraphicsDevice>(graphics_);
		auto renderer = ::EffekseerRendererWebGPU::Create(graphicsDevice, renderPassInfo, initParam_.SpriteCount);
		renderer->SetDistortingCallback(new DistortingCallbackWebGPUOffscreen(this));

		sfMemoryPoolEfk_ = EffekseerRenderer::CreateSingleFrameMemoryPool(renderer->GetGraphicsDevice());
		CreateResources();
		return renderer;
	}

	void InitializeDevice(const EffectPlatformInitializingParameter&) override { CreateCheckedTexture(); }

	void DestroyDevice() override
	{
		ES_SAFE_RELEASE(backgroundTexture_);
		EffectPlatformLLGI::DestroyDevice();
	}

	void BeginRendering() override
	{
		EffectPlatformLLGI::BeginRendering();

		auto memoryPool = static_cast<EffekseerRendererLLGI::SingleFrameMemoryPool*>(sfMemoryPoolEfk_.Get());
		commandListEfk_ = Effekseer::MakeRefPtr<EffekseerRendererLLGI::CommandList>(graphics_, commandList_.get(), memoryPool->GetInternal());
		GetRenderer()->SetCommandList(commandListEfk_);
	}

	void EndRendering() override
	{
		GetRenderer()->SetCommandList(nullptr);
		commandListEfk_.Reset();
		commandList_->EndRenderPass();
		commandList_->End();
	}

public:
	EffectPlatformWebGPUOffscreen()
		: EffectPlatformLLGI(LLGI::DeviceType::WebGPU)
	{
	}

	~EffectPlatformWebGPUOffscreen() override = default;

	std::vector<uint8_t> CaptureOffscreenPixels()
	{
		if (commandList_ != nullptr)
		{
			commandList_->WaitUntilCompleted();
		}
		if (graphics_ == nullptr || colorBuffer_ == nullptr)
		{
			return {};
		}
		return graphics_->CaptureRenderTarget(colorBuffer_);
	}

	LLGI::Texture* GetBackgroundTexture()
	{
		if (backgroundTexture_ == nullptr)
		{
			LLGI::TextureParameter param;
			param.Size = LLGI::Vec3I(initParam_.WindowSize[0], initParam_.WindowSize[1], 1);
			backgroundTexture_ = graphics_->CreateTexture(param);
		}
		return backgroundTexture_;
	}

	void UpdateBackgroundTextureForDistortion()
	{
		auto background = GetBackgroundTexture();

		commandList_->EndRenderPass();
		commandList_->CopyTexture(colorBuffer_, background);

		renderPass_->SetIsColorCleared(false);
		renderPass_->SetIsDepthCleared(false);
		commandList_->BeginRenderPass(renderPass_);
	}
};

bool DistortingCallbackWebGPUOffscreen::OnDistorting(EffekseerRenderer::Renderer* renderer)
{
	platform_->UpdateBackgroundTextureForDistortion();

	if (texture_ == nullptr)
	{
		auto graphicsDevice = renderer->GetGraphicsDevice().DownCast<EffekseerRendererLLGI::Backend::GraphicsDevice>();
		texture_ = graphicsDevice->CreateTexture(platform_->GetBackgroundTexture());
	}

	renderer->SetBackground(texture_);
	return true;
}

EM_JS(int, HasThreeJsMatrices, (), {
	return Module.effekseerThreeJsProjectionMatrix &&
				   Module.effekseerThreeJsProjectionMatrix.length === 16 &&
				   Module.effekseerThreeJsCameraMatrix &&
				   Module.effekseerThreeJsCameraMatrix.length === 16
			   ? 1
			   : 0;
});

EM_JS(double, GetThreeJsMatrixValue, (int matrixKind, int index), {
	var matrix = matrixKind === 0 ? Module.effekseerThreeJsProjectionMatrix : Module.effekseerThreeJsCameraMatrix;
	if (!matrix || index < 0 || index >= matrix.length) {
		return NaN;
	}
	return matrix[index];
});

void ReportResult(const char* status, const std::string& message)
{
	EM_ASM(
		{
			Module.effekseerWebGPUTestResult = {};
			Module.effekseerWebGPUTestResult.status = UTF8ToString($0);
			Module.effekseerWebGPUTestResult.message = UTF8ToString($1);
			var prefix = Module.effekseerWebGPUTestResult.status === 'passed' ? 'EFFEKSEER_TEST_PASS' : 'EFFEKSEER_TEST_FAIL';
			console.log(prefix + ' ' + Module.effekseerWebGPUTestResult.message);
		},
		status,
		message.c_str());
}

bool StartsWith(const char* text, const char* prefix)
{
	return std::strncmp(text, prefix, std::strlen(prefix)) == 0;
}

SmokeOptions ParseOptions(int argc, char* argv[])
{
	SmokeOptions options;
	for (int i = 1; i < argc; i++)
	{
		const char* arg = argv[i];
		if (StartsWith(arg, "--effect="))
		{
			options.EffectPath = arg + std::strlen("--effect=");
		}
		else if (StartsWith(arg, "--width="))
		{
			options.Width = std::atoi(arg + std::strlen("--width="));
		}
		else if (StartsWith(arg, "--height="))
		{
			options.Height = std::atoi(arg + std::strlen("--height="));
		}
		else if (StartsWith(arg, "--frames="))
		{
			options.Frames = std::atoi(arg + std::strlen("--frames="));
		}
		else if (StartsWith(arg, "--min-changed-pixels="))
		{
			options.MinimumChangedPixels = static_cast<size_t>(std::max(0, std::atoi(arg + std::strlen("--min-changed-pixels="))));
		}
	}

	if (options.Width <= 0)
	{
		options.Width = 320;
	}
	if (options.Height <= 0)
	{
		options.Height = 240;
	}
	if (options.Frames <= 0)
	{
		options.Frames = 36;
	}

	return options;
}

bool CopyThreeJsMatrix(Effekseer::Matrix44& matrix, int matrixKind)
{
	for (int row = 0; row < 4; row++)
	{
		for (int column = 0; column < 4; column++)
		{
			const auto value = static_cast<float>(GetThreeJsMatrixValue(matrixKind, row * 4 + column));
			if (!std::isfinite(value))
			{
				return false;
			}
			matrix.Values[row][column] = value;
		}
	}

	return true;
}

size_t CountDifferentPixels(const std::vector<uint8_t>& a, const std::vector<uint8_t>& b)
{
	if (a.size() != b.size())
	{
		return 0;
	}

	size_t count = 0;
	for (size_t i = 0; i < a.size(); i += 4)
	{
		const auto dr = std::abs(static_cast<int>(a[i + 0]) - static_cast<int>(b[i + 0]));
		const auto dg = std::abs(static_cast<int>(a[i + 1]) - static_cast<int>(b[i + 1]));
		const auto db = std::abs(static_cast<int>(a[i + 2]) - static_cast<int>(b[i + 2]));
		const auto da = std::abs(static_cast<int>(a[i + 3]) - static_cast<int>(b[i + 3]));
		if (dr + dg + db + da > 24)
		{
			count++;
		}
	}
	return count;
}

bool ApplyThreeJsCamera(EffectPlatformWebGPUOffscreen& platform)
{
	Effekseer::Matrix44 projectionMatrix;
	Effekseer::Matrix44 cameraMatrix;
	if (!CopyThreeJsMatrix(projectionMatrix, 0) || !CopyThreeJsMatrix(cameraMatrix, 1))
	{
		return false;
	}

	auto renderer = platform.GetRenderer();
	if (renderer == nullptr)
	{
		return false;
	}

	renderer->SetProjectionMatrix(projectionMatrix);
	renderer->SetCameraMatrix(cameraMatrix);
	return true;
}

} // namespace

int main(int argc, char* argv[])
{
	Effekseer::SetLogger([](Effekseer::LogType, const std::string& message) -> void { std::cout << message << std::endl; });

	const auto options = ParseOptions(argc, argv);
	std::cout << "EFFEKSEER_WEBGPU_THREEJS_SMOKE effect=" << options.EffectPath << std::endl;

	if (!HasThreeJsMatrices())
	{
		ReportResult("failed", "Three.js camera matrices were not initialized.");
		return 1;
	}

	EffectPlatformInitializingParameter param;
	param.VSync = false;
	param.WindowSize = {options.Width, options.Height};
	param.BackgroundPattern = BackgroundPatternType::NonPeriodicGradient;

	auto platform = std::make_shared<EffectPlatformWebGPUOffscreen>();
	platform->Initialize(param);

	if (!ApplyThreeJsCamera(*platform))
	{
		ReportResult("failed", "Failed to apply Three.js camera matrices to Effekseer WebGPU renderer.");
		platform->Terminate();
		return 1;
	}

	if (!platform->Update())
	{
		ReportResult("failed", "Effekseer WebGPU initial update failed.");
		platform->Terminate();
		return 1;
	}

	const auto background = platform->CaptureOffscreenPixels();
	const auto expectedPixels = static_cast<size_t>(options.Width * options.Height * 4);
	if (background.size() != expectedPixels)
	{
		ReportResult("failed", "Unexpected background capture size.");
		platform->Terminate();
		return 1;
	}

	std::array<char16_t, 512> effectPath{};
	Effekseer::ConvertUtf8ToUtf16(effectPath.data(), static_cast<int32_t>(effectPath.size()), options.EffectPath.c_str());
	platform->Play(effectPath.data());

	for (int frame = 0; frame < options.Frames; frame++)
	{
		if (!ApplyThreeJsCamera(*platform))
		{
			ReportResult("failed", "Failed to refresh Three.js camera matrices.");
			platform->Terminate();
			return 1;
		}
		if (!platform->Update())
		{
			ReportResult("failed", "Effekseer WebGPU render update failed.");
			platform->Terminate();
			return 1;
		}
	}

	const auto rendered = platform->CaptureOffscreenPixels();
	const auto changedPixels = CountDifferentPixels(background, rendered);
	if (rendered.size() != background.size() || changedPixels <= options.MinimumChangedPixels)
	{
		ReportResult("failed", "Changed pixels were too few: " + std::to_string(changedPixels));
		platform->Terminate();
		return 1;
	}

	ReportResult("passed", "completed changedPixels=" + std::to_string(changedPixels));
	platform->Terminate();
	return 0;
}
