
project(effekseer.core)

# CMake version check
cmake_minimum_required(VERSION 3.4)

# Set compiler flags
string(APPEND CMAKE_CXX_FLAGS
	" -Oz -std=c++11"
	" -Wno-inconsistent-missing-override"
	" --llvm-lto 1"
	" --memory-init-file 0"
)

# Set linker flags
string(APPEND CMAKE_EXE_LINKER_FLAGS
	" -s WASM=0"
	" -s MODULARIZE=1"
	" -s NO_FILESYSTEM=1"
	" -s DISABLE_EXCEPTION_CATCHING=1"
	" -s NO_EXIT_RUNTIME=1"
	" -s TOTAL_MEMORY=33554432"
	" -s EXPORT_NAME=\"'effekseer'\""
	" -s EXTRA_EXPORTED_RUNTIME_METHODS='[\"cwrap\", \"Pointer_stringify\"]'"
	" --post-js ../Source/post.js"
)

# Assume Effekseer directory
set(EFFEKSEER_DIR "${PROJECT_SOURCE_DIR}/../../../Effekseer")

# Set include directories
include_directories(
	${EFFEKSEER_DIR}/Dev/Cpp/Effekseer
	${EFFEKSEER_DIR}/Dev/Cpp/Effekseer/Culling
	${EFFEKSEER_DIR}/Dev/Cpp/EffekseerRendererCommon
	${EFFEKSEER_DIR}/Dev/Cpp/EffekseerRendererGL
	${EFFEKSEER_DIR}/Dev/Cpp/EffekseerRendererArea
	${EFFEKSEER_DIR}/Dev/Cpp/EffekseerSoundAL
)

# Enable OpenGL ES 2.0 mode
add_definitions(-D__EFFEKSEER_RENDERER_GLES2__)
add_definitions(-DNDEBUG)

# Set source files
file(GLOB effekseer_src
	${EFFEKSEER_DIR}/Dev/Cpp/Effekseer/*.cpp
	${EFFEKSEER_DIR}/Dev/Cpp/Effekseer/Effekseer/*.cpp
	${EFFEKSEER_DIR}/Dev/Cpp/Effekseer/Effekseer/Culling/*.cpp
	${EFFEKSEER_DIR}/Dev/Cpp/EffekseerRendererCommon/*.cpp
	${EFFEKSEER_DIR}/Dev/Cpp/EffekseerRendererGL/EffekseerRenderer/*.cpp
	${EFFEKSEER_DIR}/Dev/Cpp/EffekseerRendererArea/EffekseerRenderer/*.cpp
	${EFFEKSEER_DIR}/Dev/Cpp/EffekseerSoundAL/EffekseerSound/*.cpp
	${PROJECT_SOURCE_DIR}/../Cpp/*.cpp
)

# Exclude unused source files
list(REMOVE_ITEM effekseer_src
	${EFFEKSEER_DIR}/Dev/Cpp/EffekseerRendererCommon/EffekseerRenderer.DXTK.DDSTextureLoader.cpp
	${EFFEKSEER_DIR}/Dev/Cpp/EffekseerRendererCommon/EffekseerRenderer.PngTextureLoader.cpp
)

# Set output file extension
set(CMAKE_EXECUTABLE_SUFFIX ".js")

# Add build settings
add_executable(effekseer.core ${effekseer_src})
