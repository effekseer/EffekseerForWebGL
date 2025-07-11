#pragma once

#include <Effekseer.h>
#include <EffekseerRenderer/GraphicsDevice.h>
#include <EffekseerRendererGL.h>

#include <emscripten.h>
#include <stdlib.h>

#include "EffekseerForWebGL.Common.hpp"

namespace EffekseerForWebGL
{
class CustomTextureLoader : public Effekseer::TextureLoader
{
private:
	Effekseer::Backend::GraphicsDevice* graphicsDevice_ = nullptr;

public:
	CustomTextureLoader(Effekseer::Backend::GraphicsDevice* graphicsDevice) : graphicsDevice_(graphicsDevice) {}

	~CustomTextureLoader() = default;

public:
	Effekseer::TextureRef Load(const EFK_CHAR* path, Effekseer::TextureType textureType) override
	{
		// Request to load image
		int loaded = EM_ASM_INT({ return Module._loadEffectImage(UTF16ToString($0)) != null; }, path);
		if (!loaded)
		{
			// Loading incompleted
			return nullptr;
		}

		GLuint texture = 0;
		glGenTextures(1, &texture);

		// Load texture from image
		EM_ASM_INT(
			{
				var binding = GLctx.getParameter(GLctx.TEXTURE_BINDING_2D);

				var img = Module._loadEffectImage(UTF16ToString($0));
				GLctx.bindTexture(GLctx.TEXTURE_2D, GL.textures[$1]);

				var pa = GLctx.getParameter(GLctx.UNPACK_PREMULTIPLY_ALPHA_WEBGL);
				var oldFlipY = GLctx.getParameter(GLctx.UNPACK_FLIP_Y_WEBGL);
				GLctx.pixelStorei(GLctx.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
				GLctx.pixelStorei(GLctx.UNPACK_FLIP_Y_WEBGL, false);
				GLctx.texImage2D(GLctx.TEXTURE_2D, 0, GLctx.RGBA, GLctx.RGBA, GLctx.UNSIGNED_BYTE, img);
				GLctx.generateMipmap(GLctx.TEXTURE_2D);

				GLctx.pixelStorei(GLctx.UNPACK_PREMULTIPLY_ALPHA_WEBGL, pa);
				GLctx.pixelStorei(GLctx.UNPACK_FLIP_Y_WEBGL, oldFlipY);
				GLctx.bindTexture(GLctx.TEXTURE_2D, binding);
			},
			path,
			texture);

		std::array<char, 260> path8;
		Effekseer::ConvertUtf16ToUtf8(path8.data(), static_cast<int32_t>(path8.size()), path);
		std::string pathStr = path8.data();

		auto g = static_cast<EffekseerRendererGL::Backend::GraphicsDevice*>(graphicsDevice_);
		std::function<void()> onDisposed = [texture, pathStr]() -> void
		{
			glDeleteTextures(1, &texture);
			PrintEffekseerLog("Effekseer : Unload : " + pathStr);
		};
		auto backend = g->CreateTexture(texture, true, onDisposed);
		auto textureData = Effekseer::MakeRefPtr<Effekseer::Texture>();
		textureData->SetBackend(backend);

		PrintEffekseerLog("Effekseer : Load : " + pathStr);

		return textureData;
	}

	void Unload(Effekseer::TextureRef data) override {}
};
} // namespace EffekseerForWebGL