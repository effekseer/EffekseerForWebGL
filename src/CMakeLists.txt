
project(effekseer)

option(AS_WASM "compile as wasm" OFF)

# CMake version check
cmake_minimum_required(VERSION 3.15)

# Set compiler flags
string(APPEND CMAKE_CXX_FLAGS
  " -g3"
  " -Wno-inconsistent-missing-override"
  " --llvm-lto 1"
  " --memory-init-file 0"
)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Set linker flags

if(AS_WASM)

    string(APPEND CMAKE_EXE_LINKER_FLAGS
      " -s WASM=1"
      " -s MODULARIZE=1"
      " -s NO_FILESYSTEM=1"
      " -s DISABLE_EXCEPTION_CATCHING=1"
      " -s NO_EXIT_RUNTIME=1"
      " -s TOTAL_MEMORY=33554432"
      " -s ALLOW_MEMORY_GROWTH=1"
      " -s EXPORT_NAME=\"'effekseer_native'\""
      " -s EXPORTED_FUNCTIONS=\"['_malloc', '_free']\" "
      " -s EXTRA_EXPORTED_RUNTIME_METHODS=\"['cwrap', 'UTF8ToString', 'UTF16ToString', 'stackSave', 'stackRestore', 'stackAlloc']\" "
      " --post-js ${PROJECT_SOURCE_DIR}/js/post.js"
    )

else()

    string(APPEND CMAKE_EXE_LINKER_FLAGS
      " -s WASM=0"
      " -s MODULARIZE=1"
      " -s NO_FILESYSTEM=1"
      " -s DISABLE_EXCEPTION_CATCHING=1"
      " -s NO_EXIT_RUNTIME=1"
      " -s TOTAL_MEMORY=33554432"
      " -s ALLOW_MEMORY_GROWTH=1"
      " -s EXPORT_NAME=\"'effekseer'\""
      " -s EXPORTED_FUNCTIONS=\"['_malloc', '_free']\" "
      " -s EXTRA_EXPORTED_RUNTIME_METHODS=\"['cwrap', 'UTF8ToString', 'UTF16ToString', 'stackSave', 'stackRestore', 'stackAlloc']\" "
      " --post-js ${PROJECT_SOURCE_DIR}/js/post.js"
    )

endif()

# Assume Effekseer directory
set(EFFEKSEER_DIR "${PROJECT_SOURCE_DIR}/../Effekseer")

# Set include directories
include_directories(
  ${EFFEKSEER_DIR}/Dev/Cpp/Effekseer
  ${EFFEKSEER_DIR}/Dev/Cpp/Effekseer/Culling
  ${EFFEKSEER_DIR}/Dev/Cpp/EffekseerRendererCommon
  ${EFFEKSEER_DIR}/Dev/Cpp/EffekseerRendererGL
  ${EFFEKSEER_DIR}/Dev/Cpp/EffekseerSoundAL
)

# Enable OpenGL ES 2.0 mode
add_definitions(-D__EFFEKSEER_RENDERER_GLES2__)
add_definitions(-DNDEBUG)
add_definitions(-D__DISABLED_DEFAULT_TEXTURE_LOADER__)

# Set source files
file(GLOB effekseer_src
  ${EFFEKSEER_DIR}/Dev/Cpp/Effekseer/*.cpp
  ${EFFEKSEER_DIR}/Dev/Cpp/Effekseer/Effekseer/*.cpp
  ${EFFEKSEER_DIR}/Dev/Cpp/Effekseer/Effekseer/Culling/*.cpp
  ${EFFEKSEER_DIR}/Dev/Cpp/Effekseer/Effekseer/IO/*.cpp
  ${EFFEKSEER_DIR}/Dev/Cpp/Effekseer/Effekseer/Utils/*.cpp
  ${EFFEKSEER_DIR}/Dev/Cpp/Effekseer/Effekseer/Parameter/*.cpp
  ${EFFEKSEER_DIR}/Dev/Cpp/Effekseer/Effekseer/Material/*.cpp
  ${EFFEKSEER_DIR}/Dev/Cpp/Effekseer/Effekseer/SIMD/*.cpp
  ${EFFEKSEER_DIR}/Dev/Cpp/Effekseer/Effekseer/ForceField/*.cpp
  ${EFFEKSEER_DIR}/Dev/Cpp/Effekseer/Effekseer/Model/*.cpp
  ${EFFEKSEER_DIR}/Dev/Cpp/Effekseer/Effekseer/Noise/*.cpp
  ${EFFEKSEER_DIR}/Dev/Cpp/EffekseerRendererCommon/*.cpp
  ${EFFEKSEER_DIR}/Dev/Cpp/EffekseerRendererCommon/EffekseerRendererCommon/*.cpp
  ${EFFEKSEER_DIR}/Dev/Cpp/EffekseerRendererGL/EffekseerRendererGL/*.cpp
  ${EFFEKSEER_DIR}/Dev/Cpp/EffekseerMaterialCompiler/Common/*.cpp
  ${EFFEKSEER_DIR}/Dev/Cpp/EffekseerMaterialCompiler/OpenGL/*.cpp
  ${EFFEKSEER_DIR}/Dev/Cpp/EffekseerMaterialCompiler/GLSLGenerator/*.cpp
  ${EFFEKSEER_DIR}/Dev/Cpp/EffekseerSoundAL/EffekseerSoundAL/*.cpp
  ${PROJECT_SOURCE_DIR}/cpp/*.cpp
)

# Set output file extension
set(CMAKE_EXECUTABLE_SUFFIX ".js")

# Add build settings
add_executable(effekseer.core ${effekseer_src})
