# WebGPU Three.js Smoke

This repository's release wrapper remains the WebGL package. The WebGPU path is
available here as an experimental browser module and sample backed by the
Effekseer WebGPU renderer in the `Effekseer` submodule and the maintained LLGI
WebGPU backend.

The WebGPU workflow added here builds two browser-only Emscripten targets:

- `EffekseerForWebGPUThreeJsRuntime.js`, a small JavaScript-facing runtime used
  by `threejs_webgpu_sample.html`
- `EffekseerForWebGPUThreeJsSmoke.html`, an automated regression smoke

- creates a browser WebGPU device through `navigator.gpu`
- loads actual Three.js and creates a `THREE.PerspectiveCamera`
- passes that camera's projection and view matrices into the Effekseer WebGPU renderer
- plays an Effekseer effect from preloaded test data
- reads back the offscreen WebGPU render texture and fails if the effect does not change the frame

## Requirements

- Emscripten 4.x or newer with `--use-port=emdawnwebgpu`
- CMake 3.15 or newer
- Node.js 22 or newer
- WebGPU-capable Chrome or Edge

Set `CHROME_PATH` if Chrome is not in a common desktop install location.

## Run

```bash
source /path/to/emsdk/emsdk_env.sh
bash scripts/build_webgpu_threejs_smoke.sh
```

The helper checks out the merged LLGI WebGPU browser-runner revision
`6e8ddc6054cfdaeb6da6551e3b24e106c4ca85bc` while building and restores the
submodule revision afterwards.

To save a screenshot of the browser proof page:

```bash
bash scripts/build_webgpu_threejs_smoke.sh \
  --screenshot=/tmp/effekseer-webgpu-threejs.png
```

A successful run ends with:

```text
EFFEKSEER_WEBGPU_THREEJS_RUNNER_PASS completed changedPixels=...
```

The generated sample files are written into `build_webgpu_threejs/`:

- `EffekseerForWebGPUThreeJsRuntime.js`
- `EffekseerForWebGPUThreeJsRuntime.wasm`
- `effekseer.webgpu.js`
- `threejs_webgpu_sample.html`

Serve `build_webgpu_threejs/threejs_webgpu_sample.html` from localhost to try
the WebGPU runtime surface manually.
