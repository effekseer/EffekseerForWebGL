#include "glTFglbEffectFactory.h"

glTFglmEffectFactory::BufferView glTFglmEffectFactory::CreateBufferView(picojson::object& o)
{
	BufferView bv;
	bv.buffer = o["buffer"].get<double>();
	bv.byteOffset = o["byteOffset"].get<double>();
	bv.byteLength = o["byteLength"].get<double>();
	return bv;
}

bool glTFglmEffectFactory::glTFData::Load(const void* data, int32_t size)
{
	std::string json_str = reinterpret_cast<char*>(const_cast<void*>(data));

	picojson::value json;
	const std::string err = picojson::parse(json, json_str);
	if (!err.empty())
	{
		std::cerr << err << std::endl;
		return false;
	}

	picojson::object& root = json.get<picojson::object>();
	auto& extensions = root["extensions"].get<picojson::object>();
	auto& buffers = root["buffers"].get<picojson::array>();
	auto& bufferViews = root["bufferViews"].get<picojson::object>();

	auto& effekseer = extensions["Effekseer"].get<picojson::object>();
	auto& effects = effekseer["effects"].get<picojson::array>();
	auto& effect1 = effects.begin()->get<picojson::object>();
	auto& body_bufferview_name = effect1["body"].get<picojson::object>()["bufferview"].get<std::string>();
	auto& images_bufferviews = effect1["images"].get<picojson::array>();
	auto& normalImages_bufferviews = effect1["normalImages"].get<picojson::array>();
	auto& distortionImages_bufferviews = effect1["distortionImages"].get<picojson::array>();

	body = CreateBufferView(bufferViews[body_bufferview_name].get<picojson::object>());

	for (auto& buffer_ : buffers)
	{
        auto b = Buffer();
		//buffers[buffer_.first] = b;
	}

	for (auto& image : images_bufferviews)
	{
		auto bufferview_name = image.get<picojson::object>()["bufferview"].get<std::string>();
		images.push_back(CreateBufferView(bufferViews[bufferview_name].get<picojson::object>()));
	}

	for (auto& image : normalImages_bufferviews)
	{
		auto bufferview_name = image.get<picojson::object>()["bufferview"].get<std::string>();
		normalImages.push_back(CreateBufferView(bufferViews[bufferview_name].get<picojson::object>()));
	}

	for (auto& image : distortionImages_bufferviews)
	{
		auto bufferview_name = image.get<picojson::object>()["bufferview"].get<std::string>();
		distortionImages.push_back(CreateBufferView(bufferViews[bufferview_name].get<picojson::object>()));
	}

	return true;
}

bool glTFglmEffectFactory::OnCheckIsReloadSupported() { return false; }

void glTFglmEffectFactory::OnUnloadingResource(Effekseer::Effect* effect)
{
	auto textureLoader = effect->GetSetting()->GetTextureLoader();
	auto soundLoader = effect->GetSetting()->GetSoundLoader();
	auto modelLoader = effect->GetSetting()->GetModelLoader();

	if (textureLoader != nullptr)
	{
		for (auto i = 0; i < effect->GetColorImageCount(); i++)
		{
			textureLoader->Unload(effect->GetColorImage(i));
			SetTexture(effect, i, Effekseer::TextureType::Color, nullptr);
		}

		for (auto i = 0; i < effect->GetNormalImageCount(); i++)
		{
			textureLoader->Unload(effect->GetNormalImage(i));
			SetTexture(effect, i, Effekseer::TextureType::Normal, nullptr);
		}

		for (auto i = 0; i < effect->GetDistortionImageCount(); i++)
		{
			textureLoader->Unload(effect->GetDistortionImage(i));
			SetTexture(effect, i, Effekseer::TextureType::Distortion, nullptr);
		}
	}

	if (soundLoader != nullptr)
	{
		for (auto i = 0; i < effect->GetWaveCount(); i++)
		{
			soundLoader->Unload(effect->GetWave(i));
			SetSound(effect, i, nullptr);
		}
	}

	if (modelLoader != nullptr)
	{
		for (auto i = 0; i < effect->GetModelCount(); i++)
		{
			modelLoader->Unload(effect->GetModel(i));
			SetModel(effect, i, nullptr);
		}
	}
}

bool glTFEffectFactory::OnLoading(
	Effekseer::Effect* effect, const void* data, int32_t size, float magnification, const EFK_CHAR* materialPath)
{
    glTFData glTFData_;
	if (!glTFData_.Load(data, size))
		return false;

    return true;
}

bool glTFEffectFactory::OnCheckIsBinarySupported(const void* data, int32_t size)
{
	if (size > 1024 * 1024)
		return false;

	std::vector<char> data_;
	data_.resize(size);
	memcpy(data_.data(), data, size);
	data_.push_back(0);

	std::string json_str = data_.data();

	picojson::value json;
	const std::string err = picojson::parse(json, json_str);
	if (!err.empty())
	{
		return false;
	}
	return true;
}

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
