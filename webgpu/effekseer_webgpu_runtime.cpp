#if !defined(__EMSCRIPTEN__)
#error This runtime is browser-only and requires Emscripten.
#endif

#include "webgpu_offscreen_platform.h"

#include <Effekseer.h>
#include <emscripten.h>

#include <algorithm>
#include <cmath>
#include <cstdint>
#include <cstdlib>
#include <cstring>
#include <memory>
#include <vector>

namespace
{

using EffekseerWebGPU::EffectPlatformWebGPUOffscreen;

void ArrayToMatrix44(const float* array, Effekseer::Matrix44& matrix)
{
	for (int row = 0; row < 4; row++)
	{
		for (int column = 0; column < 4; column++)
		{
			matrix.Values[row][column] = array[row * 4 + column];
		}
	}
}

struct RuntimeContext
{
	std::shared_ptr<EffectPlatformWebGPUOffscreen> platform;
	std::vector<Effekseer::EffectRef> effects;
	std::vector<uint8_t> pixels;
	int32_t width = 320;
	int32_t height = 240;
};

RuntimeContext* ToContext(uintptr_t value)
{
	return reinterpret_cast<RuntimeContext*>(value);
}

} // namespace

#define EXPORT EMSCRIPTEN_KEEPALIVE

extern "C"
{
	uintptr_t EXPORT EffekseerWebGPUCreateContext(int32_t width, int32_t height, int32_t instanceMaxCount, int32_t spriteMaxCount)
	{
		auto context = std::make_unique<RuntimeContext>();
		context->width = std::max(1, width);
		context->height = std::max(1, height);

		EffectPlatformInitializingParameter param;
		param.VSync = false;
		param.WindowSize = {context->width, context->height};
		param.InstanceCount = instanceMaxCount > 0 ? instanceMaxCount : 8000;
		param.SpriteCount = spriteMaxCount > 0 ? spriteMaxCount : 2000;
		param.BackgroundPattern = BackgroundPatternType::NonPeriodicGradient;

		context->platform = std::make_shared<EffectPlatformWebGPUOffscreen>();
		context->platform->Initialize(param);
		return reinterpret_cast<uintptr_t>(context.release());
	}

	void EXPORT EffekseerWebGPUTerminate(uintptr_t contextValue)
	{
		auto context = ToContext(contextValue);
		if (context == nullptr)
		{
			return;
		}
		context->platform->Terminate();
		delete context;
	}

	int32_t EXPORT EffekseerWebGPULoadEffect(uintptr_t contextValue, const void* data, int32_t size, float magnification)
	{
		auto context = ToContext(contextValue);
		if (context == nullptr || data == nullptr || size <= 0)
		{
			return 0;
		}

		auto effect = Effekseer::Effect::Create(context->platform->GetManager(), const_cast<void*>(data), size, magnification);
		if (effect == nullptr)
		{
			return 0;
		}

		context->effects.push_back(effect);
		return static_cast<int32_t>(context->effects.size());
	}

	int32_t EXPORT EffekseerWebGPUPlayEffect(uintptr_t contextValue, int32_t effectId, float x, float y, float z)
	{
		auto context = ToContext(contextValue);
		if (context == nullptr || effectId <= 0 || effectId > static_cast<int32_t>(context->effects.size()))
		{
			return -1;
		}

		return context->platform->GetManager()->Play(context->effects[effectId - 1], x, y, z);
	}

	void EXPORT EffekseerWebGPUStopAllEffects(uintptr_t contextValue)
	{
		auto context = ToContext(contextValue);
		if (context != nullptr)
		{
			context->platform->StopAllEffects();
		}
	}

	void EXPORT EffekseerWebGPUSetProjectionMatrix(uintptr_t contextValue, const float* matrixElements)
	{
		auto context = ToContext(contextValue);
		if (context == nullptr || matrixElements == nullptr)
		{
			return;
		}

		Effekseer::Matrix44 matrix;
		ArrayToMatrix44(matrixElements, matrix);
		context->platform->GetRenderer()->SetProjectionMatrix(matrix);
	}

	void EXPORT EffekseerWebGPUSetCameraMatrix(uintptr_t contextValue, const float* matrixElements)
	{
		auto context = ToContext(contextValue);
		if (context == nullptr || matrixElements == nullptr)
		{
			return;
		}

		Effekseer::Matrix44 matrix;
		ArrayToMatrix44(matrixElements, matrix);
		context->platform->GetRenderer()->SetCameraMatrix(matrix);
	}

	int32_t EXPORT EffekseerWebGPUUpdateAndCapture(uintptr_t contextValue, float deltaFrames)
	{
		auto context = ToContext(contextValue);
		if (context == nullptr)
		{
			return 0;
		}

		const auto wholeFrames = std::max(1, static_cast<int32_t>(std::ceil(deltaFrames)));
		for (int32_t frame = 0; frame < wholeFrames; frame++)
		{
			if (!context->platform->Update())
			{
				return 0;
			}
		}

		context->pixels = context->platform->CaptureOffscreenPixels();
		return static_cast<int32_t>(context->pixels.size());
	}

	uintptr_t EXPORT EffekseerWebGPUGetPixelsPointer(uintptr_t contextValue)
	{
		auto context = ToContext(contextValue);
		if (context == nullptr || context->pixels.empty())
		{
			return 0;
		}
		return reinterpret_cast<uintptr_t>(context->pixels.data());
	}

	int32_t EXPORT EffekseerWebGPUGetWidth(uintptr_t contextValue)
	{
		auto context = ToContext(contextValue);
		return context != nullptr ? context->width : 0;
	}

	int32_t EXPORT EffekseerWebGPUGetHeight(uintptr_t contextValue)
	{
		auto context = ToContext(contextValue);
		return context != nullptr ? context->height : 0;
	}
}

int main(int, char**) { return 0; }
