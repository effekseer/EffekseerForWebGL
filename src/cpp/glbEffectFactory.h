
#pragma once

#include "glTFglbEffectFactory.h"

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