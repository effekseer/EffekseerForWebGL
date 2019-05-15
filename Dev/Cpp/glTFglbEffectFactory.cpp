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
	auto& buffers_ = root["buffers"].get<picojson::array>();
	auto& bufferViews = root["bufferViews"].get<picojson::object>();

	auto& effekseer = extensions["Effekseer"].get<picojson::object>();
	auto& effects = effekseer["effects"].get<picojson::array>();
	auto& effect1 = effects.begin()->get<picojson::object>();
	auto& body_bufferview_name = effect1["body"].get<picojson::object>()["bufferview"].get<std::string>();
	auto& images_bufferviews = effect1["images"].get<picojson::array>();
	auto& normalImages_bufferviews = effect1["normalImages"].get<picojson::array>();
	auto& distortionImages_bufferviews = effect1["distortionImages"].get<picojson::array>();

	body = CreateBufferView(bufferViews[body_bufferview_name].get<picojson::object>());

	for (auto& buffer_ : buffers_)
	{
		auto& buf = buffer_.get<picojson::object>();
		auto b = Buffer();
		b.byteLength = buf["byteLength"].get<double>();
		b.uri = buf["uri"].get<std::string>();
		buffers.push_back(b);
	}

	for (auto& image : images_bufferviews)
	{
		auto bufferview_it = image.get<picojson::object>().find("bufferview");
		auto uri_it = image.get<picojson::object>().find("uri");

		if (bufferview_it != image.get<picojson::object>().end())
		{
			auto bufferview_name = bufferview_it->second.get<std::string>();
			images.push_back(CreateBufferView(bufferViews[bufferview_name].get<picojson::object>()));
		}

		if (uri_it != image.get<picojson::object>().end())
		{
			auto path_name = uri_it->second.get<std::string>();
			imagePathes.push_back(path_name);
		}
	}

	for (auto& image : normalImages_bufferviews)
	{
		auto bufferview_it = image.get<picojson::object>().find("bufferview");
		auto uri_it = image.get<picojson::object>().find("uri");

		if (bufferview_it != image.get<picojson::object>().end())
		{
			auto bufferview_name = bufferview_it->second.get<std::string>();
			normalImages.push_back(CreateBufferView(bufferViews[bufferview_name].get<picojson::object>()));
		}

		if (uri_it != image.get<picojson::object>().end())
		{
			auto path_name = uri_it->second.get<std::string>();
			normalImagePathes.push_back(path_name);
		}
	}

	for (auto& image : distortionImages_bufferviews)
	{
		auto bufferview_it = image.get<picojson::object>().find("bufferview");
		auto uri_it = image.get<picojson::object>().find("uri");

		if (bufferview_it != image.get<picojson::object>().end())
		{
			auto bufferview_name = bufferview_it->second.get<std::string>();
			distortionImages.push_back(CreateBufferView(bufferViews[bufferview_name].get<picojson::object>()));
		}

		if (uri_it != image.get<picojson::object>().end())
		{
			auto path_name = uri_it->second.get<std::string>();
			distortionImagePathes.push_back(path_name);
		}
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
