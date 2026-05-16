#if !defined(__EMSCRIPTEN__)
#error This smoke test is browser-only and requires Emscripten.
#endif

#include "webgpu_offscreen_platform.h"

#include <Effekseer.h>
#include <emscripten.h>

#include <array>
#include <algorithm>
#include <cmath>
#include <cstdlib>
#include <cstring>
#include <iostream>
#include <memory>
#include <string>
#include <vector>

namespace
{

using EffekseerWebGPU::EffectPlatformWebGPUOffscreen;

struct SmokeOptions
{
	std::string EffectPath = "/TestData/Effects/10/SimpleLaser.efk";
	int32_t Width = 320;
	int32_t Height = 240;
	int32_t Frames = 36;
	size_t MinimumChangedPixels = 100;
};

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
