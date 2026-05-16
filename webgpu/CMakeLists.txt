cmake_minimum_required(VERSION 3.15)

project(EffekseerForWebGPUThreeJsSmoke C CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

get_filename_component(EFFEKSEER_FOR_WEBGL_ROOT "${CMAKE_CURRENT_LIST_DIR}/.." ABSOLUTE)
set(EFFEKSEER_DIR "${EFFEKSEER_FOR_WEBGL_ROOT}/Effekseer")
list(APPEND CMAKE_MODULE_PATH "${EFFEKSEER_DIR}/cmake")

if(NOT EMSCRIPTEN)
  message(FATAL_ERROR "The WebGPU Three.js smoke target requires Emscripten.")
endif()

include(FilterFolder)
include(ClangFormat)
include(LinkAppleLibs)

set(BUILD_VIEWER OFF CACHE BOOL "" FORCE)
set(BUILD_EDITOR OFF CACHE BOOL "" FORCE)
set(BUILD_EXAMPLES OFF CACHE BOOL "" FORCE)
set(BUILD_TOOLS OFF CACHE BOOL "" FORCE)
set(BUILD_TEST ON CACHE BOOL "" FORCE)
set(BUILD_GL OFF CACHE BOOL "" FORCE)
set(BUILD_WEBGPU ON CACHE BOOL "" FORCE)
set(BUILD_WEBGPU_BROWSER_TEST ON CACHE BOOL "" FORCE)
set(BUILD_DX9 OFF CACHE BOOL "" FORCE)
set(BUILD_DX11 OFF CACHE BOOL "" FORCE)
set(BUILD_DX12 OFF CACHE BOOL "" FORCE)
set(BUILD_METAL OFF CACHE BOOL "" FORCE)
set(BUILD_VULKAN OFF CACHE BOOL "" FORCE)
set(USE_OPENAL OFF CACHE BOOL "" FORCE)
set(CLANG_FORMAT_ENABLED OFF CACHE BOOL "" FORCE)

add_subdirectory("${EFFEKSEER_DIR}/Dev/Cpp" "${CMAKE_CURRENT_BINARY_DIR}/Effekseer")

if(TARGET EffekseerRendererLLGI)
  target_include_directories(
    EffekseerRendererLLGI
    PUBLIC "${EFFEKSEER_DIR}/Dev/Cpp/3rdParty/LLGI/src"
  )
endif()

add_executable(EffekseerForWebGPUThreeJsSmoke threejs_smoke.cpp)
target_link_libraries(EffekseerForWebGPUThreeJsSmoke PRIVATE TestRuntimeFramework)
target_include_directories(
  EffekseerForWebGPUThreeJsSmoke
  PRIVATE
    "${EFFEKSEER_DIR}/Dev/Cpp/TestRuntimeFramework"
    "${EFFEKSEER_DIR}/Dev/Cpp/Effekseer"
    "${EFFEKSEER_DIR}/Dev/Cpp/EffekseerRendererCommon"
    "${EFFEKSEER_DIR}/Dev/Cpp/EffekseerRendererLLGI"
    "${EFFEKSEER_DIR}/Dev/Cpp/EffekseerRendererWebGPU"
    "${EFFEKSEER_DIR}/Dev/Cpp/3rdParty/LLGI/src"
)

add_executable(EffekseerForWebGPUThreeJsRuntime effekseer_webgpu_runtime.cpp)
target_link_libraries(EffekseerForWebGPUThreeJsRuntime PRIVATE TestRuntimeFramework)
target_include_directories(
  EffekseerForWebGPUThreeJsRuntime
  PRIVATE
    "${EFFEKSEER_DIR}/Dev/Cpp/TestRuntimeFramework"
    "${EFFEKSEER_DIR}/Dev/Cpp/Effekseer"
    "${EFFEKSEER_DIR}/Dev/Cpp/EffekseerRendererCommon"
    "${EFFEKSEER_DIR}/Dev/Cpp/EffekseerRendererLLGI"
    "${EFFEKSEER_DIR}/Dev/Cpp/EffekseerRendererWebGPU"
    "${EFFEKSEER_DIR}/Dev/Cpp/3rdParty/LLGI/src"
)

set_target_properties(EffekseerForWebGPUThreeJsSmoke PROPERTIES SUFFIX ".html")
target_link_options(
  EffekseerForWebGPUThreeJsSmoke
  PRIVATE
    "--pre-js=${CMAKE_CURRENT_SOURCE_DIR}/pre_effekseer_webgpu_threejs_smoke.js"
    "--preload-file=${EFFEKSEER_DIR}/TestData@/TestData"
    "-sALLOW_MEMORY_GROWTH=1"
    "-sASYNCIFY=1"
    "-sASSERTIONS=1"
)

set(WEBGPU_RUNTIME_EXPORTED_FUNCTIONS "['_main','_malloc','_free','_EffekseerWebGPUCreateContext','_EffekseerWebGPUTerminate','_EffekseerWebGPULoadEffect','_EffekseerWebGPUPlayEffect','_EffekseerWebGPUStopAllEffects','_EffekseerWebGPUSetProjectionMatrix','_EffekseerWebGPUSetCameraMatrix','_EffekseerWebGPUUpdateAndCapture','_EffekseerWebGPUGetPixelsPointer','_EffekseerWebGPUGetWidth','_EffekseerWebGPUGetHeight']")

set_target_properties(EffekseerForWebGPUThreeJsRuntime PROPERTIES SUFFIX ".js")
target_link_options(
  EffekseerForWebGPUThreeJsRuntime
  PRIVATE
    "-sMODULARIZE=1"
    "-sEXPORT_NAME=effekseer_webgpu_native"
    "-sNO_EXIT_RUNTIME=1"
    "-sALLOW_MEMORY_GROWTH=1"
    "-sASYNCIFY=1"
    "-sASSERTIONS=1"
    "SHELL:-sEXPORTED_FUNCTIONS=${WEBGPU_RUNTIME_EXPORTED_FUNCTIONS}"
    "SHELL:-sEXPORTED_RUNTIME_METHODS=['cwrap','HEAPF32','HEAPU8']"
)

add_custom_command(
  TARGET EffekseerForWebGPUThreeJsSmoke
  POST_BUILD
  COMMAND
    ${CMAKE_COMMAND} -E copy_if_different
    "${EFFEKSEER_FOR_WEBGL_ROOT}/docs/Sample/three.min.js"
    "$<TARGET_FILE_DIR:EffekseerForWebGPUThreeJsSmoke>/three.min.js"
)

add_custom_command(
  TARGET EffekseerForWebGPUThreeJsRuntime
  POST_BUILD
  COMMAND
    ${CMAKE_COMMAND} -E copy_if_different
    "${EFFEKSEER_FOR_WEBGL_ROOT}/docs/Sample/three.min.js"
    "$<TARGET_FILE_DIR:EffekseerForWebGPUThreeJsRuntime>/three.min.js"
  COMMAND
    ${CMAKE_COMMAND} -E copy_if_different
    "${CMAKE_CURRENT_SOURCE_DIR}/effekseer.webgpu.js"
    "$<TARGET_FILE_DIR:EffekseerForWebGPUThreeJsRuntime>/effekseer.webgpu.js"
  COMMAND
    ${CMAKE_COMMAND} -E copy_if_different
    "${CMAKE_CURRENT_SOURCE_DIR}/threejs_webgpu_sample.html"
    "$<TARGET_FILE_DIR:EffekseerForWebGPUThreeJsRuntime>/threejs_webgpu_sample.html"
  COMMAND
    ${CMAKE_COMMAND} -E copy_if_different
    "${EFFEKSEER_DIR}/TestData/Effects/10/SimpleLaser.efk"
    "$<TARGET_FILE_DIR:EffekseerForWebGPUThreeJsRuntime>/SimpleLaser.efk"
)

add_custom_target(
  EffekseerForWebGPUThreeJsRuntimeAssets
  DEPENDS EffekseerForWebGPUThreeJsRuntime
  COMMAND
    ${CMAKE_COMMAND} -E copy_if_different
    "${EFFEKSEER_FOR_WEBGL_ROOT}/docs/Sample/three.min.js"
    "$<TARGET_FILE_DIR:EffekseerForWebGPUThreeJsRuntime>/three.min.js"
  COMMAND
    ${CMAKE_COMMAND} -E copy_if_different
    "${CMAKE_CURRENT_SOURCE_DIR}/effekseer.webgpu.js"
    "$<TARGET_FILE_DIR:EffekseerForWebGPUThreeJsRuntime>/effekseer.webgpu.js"
  COMMAND
    ${CMAKE_COMMAND} -E copy_if_different
    "${CMAKE_CURRENT_SOURCE_DIR}/threejs_webgpu_sample.html"
    "$<TARGET_FILE_DIR:EffekseerForWebGPUThreeJsRuntime>/threejs_webgpu_sample.html"
  COMMAND
    ${CMAKE_COMMAND} -E copy_if_different
    "${EFFEKSEER_DIR}/TestData/Effects/10/SimpleLaser.efk"
    "$<TARGET_FILE_DIR:EffekseerForWebGPUThreeJsRuntime>/SimpleLaser.efk"
)

enable_testing()
find_program(NODE_EXE node)
if(NODE_EXE)
  add_test(
    NAME EffekseerForWebGPU_ThreeJsSmoke
    COMMAND
      ${NODE_EXE}
      "${CMAKE_CURRENT_SOURCE_DIR}/run_webgpu_threejs_smoke.mjs"
      "$<TARGET_FILE:EffekseerForWebGPUThreeJsSmoke>"
  )
  add_test(
    NAME EffekseerForWebGPU_ThreeJsRuntimeSample
    COMMAND
      ${NODE_EXE}
      "${CMAKE_CURRENT_SOURCE_DIR}/run_webgpu_threejs_smoke.mjs"
      "$<TARGET_FILE_DIR:EffekseerForWebGPUThreeJsRuntime>/threejs_webgpu_sample.html"
  )
endif()
