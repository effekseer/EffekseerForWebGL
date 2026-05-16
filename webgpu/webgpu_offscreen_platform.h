#pragma once

#if !defined(__EMSCRIPTEN__)
#error This WebGPU platform is browser-only and requires Emscripten.
#endif

#include <Runtime/EffectPlatformLLGI.h>
#include <EffekseerRendererLLGI/EffekseerRendererLLGI.Renderer.h>
#include <EffekseerRendererLLGI/GraphicsDevice.h>
#include <EffekseerRendererWebGPU.h>
#include <LLGI.CommandList.h>
#include <LLGI.Graphics.h>
#include <LLGI.Texture.h>
#include <WebGPU/LLGI.CompilerWebGPU.h>
#include <WebGPU/LLGI.PlatformWebGPU.h>

#include <cassert>
#include <memory>
#include <stdexcept>
#include <vector>

namespace EffekseerWebGPU
{

static const char* OffscreenCopyVertexShaderWGSL = R"(
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

static const char* OffscreenCopyPixelShaderWGSL = R"(
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

inline bool DistortingCallbackWebGPUOffscreen::OnDistorting(EffekseerRenderer::Renderer* renderer)
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

} // namespace EffekseerWebGPU
