# WebGPU Three.js Smoke

This repository's release wrapper remains the WebGL package. The WebGPU path is
validated through the Effekseer WebGPU renderer in the `Effekseer` submodule and
the LLGI WebGPU backend.

The smoke target added here builds a browser-only Emscripten test that:

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

To save a screenshot of the browser proof page:

```bash
bash scripts/build_webgpu_threejs_smoke.sh \
  --screenshot=/tmp/effekseer-webgpu-threejs.png
```

A successful run ends with:

```text
EFFEKSEER_WEBGPU_THREEJS_SMOKE_PASS completed changedPixels=...
```

This workflow expects the LLGI WebGPU backend to be present in the maintained
LLGI repository. At the time this workflow was added, the portable browser
runner fix for that backend had been merged in `effekseer/LLGI` as PR #7.
