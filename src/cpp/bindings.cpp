#include <algorithm>
#include <emscripten/bind.h>
#include <emscripten/emscripten.h>
#include <emscripten/val.h>
#include <math.h>
#include <stdlib.h>

#include "EffekseerForWebGL.Common.hpp"

#include "EffekseerForWebGL.NativeService.h"

// clang-format off
#define BEGIN_CLASS_BINDING(Class, JsName) \
{ \
    using __binding_class__ = Class; \
    emscripten::class_<__binding_class__> binding_##Class(JsName); \
    binding_##Class

#define ADD_CONSTRUCTOR(...) \
    .constructor<__VA_ARGS__>()

#define ADD_PROPERTY(Attribute) \
	.property(#Attribute, &__binding_class__::Attribute)

#define ADD_PROPERTY_WITH_NAME(Attribute, JsName) \
	.property(JsName, &__binding_class__::Attribute)

#define ADD_FUNCTION(Method) \
    .function(#Method, &__binding_class__::Method)

#define ADD_FUNCTION_WITH_NAME(Method, JsName) \
    .function(JsName, &__binding_class__::Method)

#define END_CLASS_BINDING \
	; \
}
// clang-format on

EMSCRIPTEN_BINDINGS(effekseer)
{
	using namespace EffekseerForWebGL;

	emscripten::function("setLogEnabled", SetLogEnabled);

	BEGIN_CLASS_BINDING(NativeService, "NativeService")
	ADD_CONSTRUCTOR()
	ADD_PROPERTY_WITH_NAME(time_, "time")
	ADD_PROPERTY_WITH_NAME(isFirstUpdate_, "isFirstUpdate")
	ADD_PROPERTY_WITH_NAME(restDeltaTime_, "restDeltaTime")
	ADD_PROPERTY_WITH_NAME(backGroundTexture_, "backGroundTexture")
	ADD_PROPERTY_WITH_NAME(backGroundTextureWidth_, "backGroundTextureWidth")
	ADD_PROPERTY_WITH_NAME(backGroundTextureHeight_, "backGroundTextureHeight")
	ADD_FUNCTION(Init)
	ADD_FUNCTION(Terminate)
	ADD_FUNCTION(Draw)
	ADD_FUNCTION(Update)
	ADD_FUNCTION(BeginUpdate)
	ADD_FUNCTION(EndUpdate)
	ADD_FUNCTION(UpdateHandle)
	ADD_FUNCTION(BeginDraw)
	ADD_FUNCTION(EndDraw)
	ADD_FUNCTION(DrawHandle)
	ADD_FUNCTION(SetProjectionMatrix)
	ADD_FUNCTION(SetProjectionPerspective)
	ADD_FUNCTION(SetProjectionOrthographic)
	ADD_FUNCTION(SetCameraMatrix)
	ADD_FUNCTION(SetCameraLookAt)
	ADD_FUNCTION(LoadEffect)
	ADD_FUNCTION(ReleaseEffect)
	ADD_FUNCTION(ReloadResources)
	ADD_FUNCTION(StopAllEffects)
	ADD_FUNCTION(PlayEffect)
	ADD_FUNCTION(StopEffect)
	ADD_FUNCTION(StopRoot)
	ADD_FUNCTION(Exists)
	ADD_FUNCTION(SetFrame)
	ADD_FUNCTION(SetLocation)
	ADD_FUNCTION(SetRotation)
	ADD_FUNCTION(SetScale)
	ADD_FUNCTION(SetMatrix)
	ADD_FUNCTION(GetDynamicInput)
	ADD_FUNCTION(SetDynamicInput)
	ADD_FUNCTION(SendTrigger)
	ADD_FUNCTION(SetAllColor)
	ADD_FUNCTION(SetTargetLocation)
	ADD_FUNCTION(SetPaused)
	ADD_FUNCTION(SetShown)
	ADD_FUNCTION(SetSpeed)
	ADD_FUNCTION(SetRandomSeed)
	ADD_FUNCTION(GetRestInstancesCount)
	ADD_FUNCTION(GetUpdateTime)
	ADD_FUNCTION(GetDrawTime)
	ADD_FUNCTION(IsVertexArrayObjectSupported)
	ADD_FUNCTION(SetRestorationOfStatesFlag)
	ADD_FUNCTION(CaptureBackground)
	ADD_FUNCTION(ResetBackground)
	END_CLASS_BINDING
}