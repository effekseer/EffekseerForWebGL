
# CMake version check
cmake_minimum_required(VERSION 3.15)

project(effekseer)

# Set compiler flags
string(APPEND CMAKE_CXX_FLAGS
  " -O2"
  " -g1"
  " -flto"
  " -Wno-inconsistent-missing-override"
)

set(CMAKE_CXX_STANDARD 14)

# Set linker flags
string(APPEND CMAKE_EXE_LINKER_FLAGS
  " -s WASM=1"
  " -s MODULARIZE=1"
  " -s FILESYSTEM=0"
  " -s DISABLE_EXCEPTION_CATCHING=1"
  " -s EXIT_RUNTIME=0"
  " -s INITIAL_MEMORY=33554432"
  " -s ALLOW_MEMORY_GROWTH=1"
  " -s EXPORT_NAME=\"'EffekseerInit'\""
  " -s EXPORTED_FUNCTIONS=\"
  [
    '_malloc',
    '_free'
  ]\" "
  " -s EXPORTED_RUNTIME_METHODS=\"
  [
    'GL',
    'stackSave',
    'stackAlloc',
    'stackRestore',
    'HEAP8',
    'HEAPF32'
  ]\" "
  " -lembind"
  " --emit-tsd types.d.ts"
  " --post-js effekseer_webgl.js"
)

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
add_compile_definitions(-D__EFFEKSEER_RENDERER_GLES2__)
add_compile_definitions(-DNDEBUG)
add_compile_definitions(-D__DISABLED_DEFAULT_TEXTURE_LOADER__)

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
  ${EFFEKSEER_DIR}/Dev/Cpp/EffekseerRendererGL/EffekseerRenderer/*.cpp
  ${EFFEKSEER_DIR}/Dev/Cpp/EffekseerMaterialCompiler/Common/*.cpp
  ${EFFEKSEER_DIR}/Dev/Cpp/EffekseerMaterialCompiler/OpenGL/*.cpp
  ${EFFEKSEER_DIR}/Dev/Cpp/EffekseerMaterialCompiler/GLSLGenerator/*.cpp
  ${EFFEKSEER_DIR}/Dev/Cpp/EffekseerSoundAL/EffekseerSound/*.cpp
  ${PROJECT_SOURCE_DIR}/cpp/*.cpp
)

# Set output file extension
set(CMAKE_EXECUTABLE_SUFFIX ".js")

# Add build settings
add_executable(${PROJECT_NAME} ${effekseer_src})
