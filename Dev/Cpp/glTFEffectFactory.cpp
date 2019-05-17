#include "glTFEffectFactory.h"
#include "CustomFile.h"

static void PathCombine(EFK_CHAR* dst, const EFK_CHAR* src1, const EFK_CHAR* src2)
{
	int len1 = 0, len2 = 0;
	if( src1 != NULL )
	{
		for( len1 = 0; src1[len1] != u'\0'; len1++ ) {}
		memcpy( dst, src1, len1 * sizeof(EFK_CHAR) );
		if( len1 > 0 && src1[len1 - 1] != u'/' && src1[len1 - 1] != u'\\' )
		{
			dst[len1++] = u'/';
		}
	}
	if( src2 != NULL)
	{
		for( len2 = 0; src2[len2] != u'\0'; len2++ ) {}
		memcpy( &dst[len1], src2, len2 * sizeof(EFK_CHAR) );
	}
	dst[len1 + len2] = u'\0';
}

bool glTFEffectFactory::OnLoading(
	Effekseer::Effect* effect, const void* data, int32_t size, float magnification, const EFK_CHAR* materialPath)
{
	glTFData glTFData_;
	if (!glTFData_.Load(data, size))
		return false;

	char16_t path[260];
	Effekseer::ConvertUtf8ToUtf16((int16_t*)path, 260, (int8_t*)glTFData_.buffers[0].uri.c_str());

	// javascript connects a path
	// EFK_CHAR fullPath[512];
	// PathCombine(fullPath, materialPath, path);

	EfkWebViewer::CustomFileInterface fileInterface;
	auto reader = fileInterface.OpenRead(path);
	if (reader == nullptr)
	{
		return false;
	}

	std::vector<uint8_t> data_;
	data_.resize(reader->GetLength());
	reader->Read(data_.data(), data_.size());


	auto ret = LoadBody(effect, data_.data() + glTFData_.body.byteOffset, glTFData_.body.byteLength, magnification, materialPath);
	ES_SAFE_DELETE(reader);

	return ret;
}

void glTFEffectFactory::OnLoadingResource(Effekseer::Effect* effect, const void* data, int32_t size, const EFK_CHAR* materialPath)
{
	glTFData gltf;
	if (!gltf.Load(data, size))
		return;

	auto textureLoader = effect->GetSetting()->GetTextureLoader();
	auto soundLoader = effect->GetSetting()->GetSoundLoader();
	auto modelLoader = effect->GetSetting()->GetModelLoader();

	if (textureLoader != nullptr)
	{
		for (auto i = 0; i < effect->GetColorImageCount(); i++)
		{
			char16_t path[260];
			Effekseer::ConvertUtf8ToUtf16((int16_t*)path, 260, (int8_t*)gltf.imagePathes[i].c_str());

			// javascript connects a path
			//EFK_CHAR fullPath[512];
			//PathCombine(fullPath, materialPath, path);

			auto resource = textureLoader->Load(path, Effekseer::TextureType::Color);
			SetTexture(effect, i, Effekseer::TextureType::Color, resource);
		}

		for (auto i = 0; i < effect->GetNormalImageCount(); i++)
		{
			char16_t path[260];
			Effekseer::ConvertUtf8ToUtf16((int16_t*)path, 260, (int8_t*)gltf.normalImagePathes[i].c_str());

			// javascript connects a path
			//EFK_CHAR fullPath[512];
			//PathCombine(fullPath, materialPath, path);

			auto resource = textureLoader->Load(path, Effekseer::TextureType::Normal);
			SetTexture(effect, i, Effekseer::TextureType::Normal, resource);
		}

		for (auto i = 0; i < effect->GetDistortionImageCount(); i++)
		{
			char16_t path[260];
			Effekseer::ConvertUtf8ToUtf16((int16_t*)path, 260, (int8_t*)gltf.distortionImagePathes[i].c_str());

			// javascript connects a path
			//EFK_CHAR fullPath[512];
			//PathCombine(fullPath, materialPath, path);

			auto resource = textureLoader->Load(path, Effekseer::TextureType::Distortion);
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

std::string glTFEffectFactory::GetBodyURI(const void* data, int32_t size)
{
	glTFData glTFData_;
	if (!glTFData_.Load(data, size))
		return "";

	return glTFData_.buffers[0].uri;
}