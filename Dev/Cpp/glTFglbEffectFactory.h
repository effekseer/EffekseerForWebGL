
#pragma once

#include "picojson.h"
#include <Effekseer.h>
#include <string>

class glTFglmEffectFactory : public Effekseer::EffectFactory
{

protected:
	struct Buffer
	{
		int byteLength = 0;
		std::string uri;
	};

	struct BufferView
	{
		int buffer = 0;
		int byteLength = 0;
		int byteOffset = 0;
	};

	static BufferView CreateBufferView(picojson::object& o);

	struct glTFData
	{
		std::vector<Buffer> buffers;

		BufferView body;
		std::vector<BufferView> images;
		std::vector<BufferView> normalImages;
		std::vector<BufferView> distortionImages;

		std::vector<std::string> imagePathes;
		std::vector<std::string> normalImagePathes;
		std::vector<std::string> distortionImagePathes;

		bool Load(const void* data, int32_t size);
	};

public:
	glTFglmEffectFactory() = default;
	virtual ~glTFglmEffectFactory() = default;

	bool OnCheckIsReloadSupported() override;

	void OnUnloadingResource(Effekseer::Effect* effect) override;
};
