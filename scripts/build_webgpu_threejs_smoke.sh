#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="${BUILD_DIR:-${ROOT_DIR}/build_webgpu_threejs}"
LLGI_WEBGPU_REV="${LLGI_WEBGPU_REV:-6e8ddc6054cfdaeb6da6551e3b24e106c4ca85bc}"

if ! command -v emcmake >/dev/null 2>&1; then
  echo "emcmake was not found. Activate an Emscripten 4.x SDK before running this script." >&2
  exit 2
fi

git -C "${ROOT_DIR}" submodule update --init --depth 1 Effekseer TestData ResourceData
git -C "${ROOT_DIR}/Effekseer" submodule update --init --depth 1 Dev/Cpp/3rdParty/LLGI Dev/Cpp/3rdParty/spdlog Dev/Cpp/3rdParty/stb TestData ResourceData

LLGI_DIR="${ROOT_DIR}/Effekseer/Dev/Cpp/3rdParty/LLGI"
ORIGINAL_LLGI_REV="$(git -C "${LLGI_DIR}" rev-parse HEAD)"
if [ -n "$(git -C "${LLGI_DIR}" status --porcelain)" ]; then
  echo "LLGI submodule has local changes; refusing to switch revisions for the WebGPU smoke." >&2
  exit 2
fi

restore_llgi_revision() {
  git -C "${LLGI_DIR}" checkout -q --detach "${ORIGINAL_LLGI_REV}" >/dev/null 2>&1 || true
}
trap restore_llgi_revision EXIT

git -C "${LLGI_DIR}" fetch --depth 1 origin "${LLGI_WEBGPU_REV}"
git -C "${LLGI_DIR}" checkout -q --detach "${LLGI_WEBGPU_REV}"
echo "Using LLGI WebGPU revision ${LLGI_WEBGPU_REV}"

emcmake cmake -S "${ROOT_DIR}/webgpu" -B "${BUILD_DIR}" -DCMAKE_BUILD_TYPE=Release
cmake --build "${BUILD_DIR}" --target EffekseerForWebGPUThreeJsSmoke EffekseerForWebGPUThreeJsRuntimeAssets -j "${JOBS:-$(getconf _NPROCESSORS_ONLN 2>/dev/null || echo 2)}"

node "${ROOT_DIR}/webgpu/run_webgpu_threejs_smoke.mjs" \
  "${BUILD_DIR}/EffekseerForWebGPUThreeJsSmoke.html" \
  "$@"

node "${ROOT_DIR}/webgpu/run_webgpu_threejs_smoke.mjs" \
  "${BUILD_DIR}/threejs_webgpu_sample.html" \
  "$@"
