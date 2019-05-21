
project(effekseer.core)

# CMake version check
cmake_minimum_required(VERSION 2.8)

# Set compiler flags
set(CMAKE_CXX_FLAGS "\
	-Oz -std=c++11 \
	-Wno-inconsistent-missing-override \
	--llvm-lto 1 \
	--memory-init-file 0 \
	" ${CMAKE_CXX_FLAGS})

set(CMAKE_EXE_LINKER_FLAGS "\
	-s MODULARIZE=1 \
	-s NO_FILESYSTEM=1 \
	-s DISABLE_EXCEPTION_CATCHING=1 \
	-s NO_EXIT_RUNTIME=1 \
	-s TOTAL_MEMORY=33554432 \
	-s EXPORT_NAME=\"'effekseer'\" \
	--post-js ../Source/post.js \
	" ${CMAKE_EXE_LINKER_FLAGS})

# Set include directories
set(INCLUDE_DIR
	"${PROJECT_SOURCE_DIR}./../../../Effekseer/Dev/Cpp/Effekseer"
	"${PROJECT_SOURCE_DIR}./../../../Effekseer/Dev/Cpp/Effekseer/Culling"
	"${PROJECT_SOURCE_DIR}./../../../Effekseer/Dev/Cpp/EffekseerRendererCommon"
	"${PROJECT_SOURCE_DIR}./../../../Effekseer/Dev/Cpp/EffekseerRendererGL"
	"${PROJECT_SOURCE_DIR}./../../../Effekseer/Dev/Cpp/EffekseerSoundAL")
	
include_directories (${INCLUDE_DIR}) 

# Enable OpenGL ES 2.0 mode
add_definitions(-D__EFFEKSEER_RENDERER_GLES2__)
add_definitions(-DNDEBUG)

# Set souce files
file(GLOB effekseer_src
	${PROJECT_SOURCE_DIR}./../../../Effekseer/Dev/Cpp/Effekseer/*.cpp
	${PROJECT_SOURCE_DIR}./../../../Effekseer/Dev/Cpp/Effekseer/Effekseer/*.cpp
	${PROJECT_SOURCE_DIR}./../../../Effekseer/Dev/Cpp/Effekseer/Effekseer/Culling/*.cpp
	${PROJECT_SOURCE_DIR}./../../../Effekseer/Dev/Cpp/EffekseerRendererCommon/*.cpp
	${PROJECT_SOURCE_DIR}./../../../Effekseer/Dev/Cpp/EffekseerRendererGL/EffekseerRenderer/*.cpp
	${PROJECT_SOURCE_DIR}./../../../Effekseer/Dev/Cpp/EffekseerSoundAL/EffekseerSound/*.cpp
	${PROJECT_SOURCE_DIR}./../Cpp/*.cpp)

# Exclude unused souce files
# INTERNAL_LOADER
list(REMOVE_ITEM effekseer_src "${PROJECT_SOURCE_DIR}./../../../Effekseer/Dev/Cpp/EffekseerRendererCommon/EffekseerRenderer.DXTK.DDSTextureLoader.cpp")
list(REMOVE_ITEM effekseer_src "${PROJECT_SOURCE_DIR}./../../../Effekseer/Dev/Cpp/EffekseerRendererCommon/EffekseerRenderer.PngTextureLoader.cpp")

# Set output file extension
set(CMAKE_EXECUTABLE_SUFFIX ".js")

# Add build settings
add_executable(effekseer.core ${effekseer_src} )
