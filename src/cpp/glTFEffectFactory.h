
#pragma once

#include "glTFglbEffectFactory.h"
#include <string>

class glTFEffectFactory : public glTFglmEffectFactory
{
private:
public:
	glTFEffectFactory() = default;
	virtual ~glTFEffectFactory() = default;

	bool OnCheckIsBinarySupported(const void* data, int32_t size) override;

	bool OnLoading(Effekseer::Effect* effect, const void* data, int32_t size, float magnification, const EFK_CHAR* materialPath) override;

	void OnLoadingResource(Effekseer::Effect* effect, const void* data, int32_t size, const EFK_CHAR* materialPath) override;

	std::string GetBodyURI(const void* data, int32_t size);
};
