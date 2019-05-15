#include "glbEffectFactory.h"

bool glbEffectFactory::glbData::Load(const void* data, int32_t size)
{
	uint8_t* p = static_cast<uint8_t*>(const_cast<void*>(data));
	char ascii[4];
	memcpy(ascii, p, sizeof(int));
	p += sizeof(int);

	int version = 0;
	memcpy(&version, p, sizeof(int));
	p += sizeof(int);

	int filesize = 0;
	memcpy(&filesize, p, sizeof(int));
	p += sizeof(int);

	filesize -= 12;

	uint8_t* p_json = nullptr;
	int32_t size_json = 0;
	uint8_t* p_bin = nullptr;

	while (filesize > 0)
	{
		int chunksize = 0;
		memcpy(&chunksize, p, sizeof(int));
		p += sizeof(int);
		filesize -= sizeof(int);

		char chunktype[4];
		memcpy(&chunktype, p, sizeof(int));
		p += sizeof(int);
		filesize -= sizeof(int);

		if (memcmp(chunktype, "JSON", 4) == 0)
		{
			p_json = p;
			size_json = chunksize;
		}

		if (memcmp(chunktype, "BIN", 4) == 0)
		{
			p_bin = p;
		}

		p += chunksize;
		filesize -= chunksize;
	}

	bin = p_bin;

	return gltf.Load(p_json, size_json);
}

bool glbEffectFactory::OnCheckIsBinarySupported(const void* data, int32_t size)
{
	int head = 0;
	memcpy(&head, data, sizeof(int));
	if (memcmp(&head, "glTF", 4) != 0)
		return false;
	return true;
}

bool glbEffectFactory::OnLoading(
	Effekseer::Effect* effect, const void* data, int32_t size, float magnification, const EFK_CHAR* materialPath)
{
	glbData glbData_;
	if (!glbData_.Load(data, size))
		return false;

	return LoadBody(effect, glbData_.bin + glbData_.gltf.body.byteOffset, glbData_.gltf.body.byteLength, magnification, materialPath);
}

void glbEffectFactory::OnLoadingResource(Effekseer::Effect* effect, const void* data, int32_t size, const EFK_CHAR* materialPath)
{
	glbData glbData_;
	if (!glbData_.Load(data, size))
		return;

	auto textureLoader = effect->GetSetting()->GetTextureLoader();
	auto soundLoader = effect->GetSetting()->GetSoundLoader();
	auto modelLoader = effect->GetSetting()->GetModelLoader();

	if (textureLoader != nullptr)
	{
		for (auto i = 0; i < effect->GetColorImageCount(); i++)
		{
			char path[260];
			Effekseer::ConvertUtf16ToUtf8((int8_t*)path, 260, (int16_t*)effect->GetColorImagePath(i));
			auto buf = glbData_.gltf.images[i];
			auto resource = textureLoader->Load((const void*)(glbData_.bin + buf.byteOffset), buf.byteLength, Effekseer::TextureType::Color);
			SetTexture(effect, i, Effekseer::TextureType::Color, resource);
		}

		for (auto i = 0; i < effect->GetNormalImageCount(); i++)
		{
			char path[260];
			Effekseer::ConvertUtf16ToUtf8((int8_t*)path, 260, (int16_t*)effect->GetColorImagePath(i));
			auto buf = glbData_.gltf.normalImages[i];
			auto resource =
				textureLoader->Load((const void*)(glbData_.bin + buf.byteOffset), buf.byteLength, Effekseer::TextureType::Normal);
			SetTexture(effect, i, Effekseer::TextureType::Normal, resource);
		}

		for (auto i = 0; i < effect->GetDistortionImageCount(); i++)
		{
			char path[260];
			Effekseer::ConvertUtf16ToUtf8((int8_t*)path, 260, (int16_t*)effect->GetColorImagePath(i));
			auto buf = glbData_.gltf.distortionImages[i];
			auto resource =
				textureLoader->Load((const void*)(glbData_.bin + buf.byteOffset), buf.byteLength, Effekseer::TextureType::Distortion);
			SetTexture(effect, i, Effekseer::TextureType::Distortion, resource);
		}
	}

	if (soundLoader != nullptr)
	{
		for (auto i = 0; i < effect->GetWaveCount(); i++)
		{
			// Need to implement
		}
	}

	if (modelLoader != nullptr)
	{
		for (auto i = 0; i < effect->GetModelCount(); i++)
		{
			// Need to implement
		}
	}
}
