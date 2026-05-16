#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="${BUILD_DIR:-${ROOT_DIR}/build_webgpu_threejs}"

if ! command -v emcmake >/dev/null 2>&1; then
  echo "emcmake was not found. Activate an Emscripten 4.x SDK before running this script." >&2
  exit 2
fi

git -C "${ROOT_DIR}" submodule update --init --depth 1 Effekseer TestData ResourceData
git -C "${ROOT_DIR}/Effekseer" submodule update --init --depth 1 Dev/Cpp/3rdParty/LLGI Dev/Cpp/3rdParty/spdlog Dev/Cpp/3rdParty/stb TestData ResourceData

emcmake cmake -S "${ROOT_DIR}/webgpu" -B "${BUILD_DIR}" -DCMAKE_BUILD_TYPE=Release
cmake --build "${BUILD_DIR}" --target EffekseerForWebGPUThreeJsSmoke -j "${JOBS:-$(getconf _NPROCESSORS_ONLN 2>/dev/null || echo 2)}"

node "${ROOT_DIR}/webgpu/run_webgpu_threejs_smoke.mjs" \
  "${BUILD_DIR}/EffekseerForWebGPUThreeJsSmoke.html" \
  "$@"
