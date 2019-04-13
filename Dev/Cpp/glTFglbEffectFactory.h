
#pragma once

#include "picojson.h"
#include <Effekseer.h>
#include <string>

class glTFglmEffectFactory : public Effekseer::EffectFactory
{

protected:
	struct Buffer
	{
		std::string uri;
	};

	struct BufferView
	{
		std::string buffer;
		int byteLength = 0;
		int byteOffset = 0;
	};

	static BufferView CreateBufferView(picojson::object& o);

	struct glTFData
	{
		std::map<std::string, Buffer> buffers;

		BufferView body;
		std::map<std::string, BufferView> images;

		bool Load(const void* data, int32_t size);
	};

public:
	glTFglmEffectFactory() = default;
	virtual ~glTFglmEffectFactory() = default;

	bool OnCheckIsReloadSupported() override;

    void OnUnloadingResource(Effekseer::Effect* effect) override;
};

class glTFEffectFactory : public glTFglmEffectFactory
{
public:
	glTFEffectFactory() = default;
	virtual ~glTFEffectFactory() = default;

	bool OnCheckIsBinarySupported(const void* data, int32_t size) override;

    bool OnLoading(Effekseer::Effect* effect, const void* data, int32_t size, float magnification, const EFK_CHAR* materialPath) override;
};

class glbEffectFactory : public glTFglmEffectFactory
{
protected:
	struct glbData
	{
        uint8_t* bin = nullptr;
        glTFData gltf; 

        bool Load(const void* data, int32_t size);
	};

public:
	glbEffectFactory() = default;
	virtual ~glbEffectFactory() = default;

	bool OnCheckIsBinarySupported(const void* data, int32_t size) override;

	bool OnLoading(Effekseer::Effect* effect, const void* data, int32_t size, float magnification, const EFK_CHAR* materialPath) override;

    void OnLoadingResource(Effekseer::Effect* effect, const void* data, int32_t size, const EFK_CHAR* materialPath) override;
};