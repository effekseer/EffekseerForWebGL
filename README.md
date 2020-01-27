# EffekseerForWebGL

- [Official website](http://effekseer.github.io)
- [Effekseer main repository](https://github.com/effekseer/Effekseer)

# Demo

- [Demo](https://effekseer.github.io/EffekseerForWebGL/Sample/index.html)

# Download

- [1.50Beta5](https://github.com/effekseer/EffekseerForWebGL/releases/download/NightlyBuild/EffekseerForWebGL150Beta5.zip)

- [1.43](https://github.com/effekseer/EffekseerForWebGL/releases/download/143/EffekseerForWebGL143.zip)

# How to use

WASM version

```html
<canvas id="canvas" width="640" height="480"></canvas>
<script src="three.min.js"></script>
<script src="effekseer.min.js"></script>
```

or

asm.js version

```html
<canvas id="canvas" width="640" height="480"></canvas>
<script src="three.min.js"></script>
<script src="effekseer_asmjs.js"></script>
```

## JavaScript

### 1.5

```js

function main()
{
  // Setup WebGLRenderer
  var canvas = document.getElementById("canvas");
  var renderer = new THREE.WebGLRenderer({ canvas: canvas });
  renderer.setSize(canvas.width, canvas.height);
  var clock = new THREE.Clock();
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(30.0, canvas.width / canvas.height, 1, 1000);
  camera.position.set(20, 20, 20);
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  // Create a context
  context = effekseer.createContext();

  // Initialize by WebGLRenderingContext
  context.init(renderer.getContext());

  // Load effect data
  var effect = context.loadEffect("Laser01.efk", 1.0, function(){
    // Play the loaded effect
    context.play(effect);
  });

  (function renderLoop() {
    requestAnimationFrame( renderLoop );

    // Effekseer Update
    context.update(clock.getDelta() * 60.0);

    // Three.js Rendering
    renderer.render(scene, camera);

    // Rendering Settings
    context.setProjectionMatrix(camera.projectionMatrix.elements);
    context.setCameraMatrix(camera.matrixWorldInverse.elements);

    // Effekseer Rendering
    context.draw();
  })();
}

useWASM = true;

if(useWASM) {
  // if you use wasm version
  effekseer.initRuntime('effekseer.wasm', () => {
    main();
  });
} else {
  // if you use asmjs version
  main();
}

```

### 1.4

```js
// Setup WebGLRenderer
var canvas = document.getElementById("canvas");
var renderer = new THREE.WebGLRenderer({ canvas: canvas });
renderer.setSize(canvas.width, canvas.height);
var clock = new THREE.Clock();
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(30.0, canvas.width / canvas.height, 1, 1000);
camera.position.set(20, 20, 20);
camera.lookAt(new THREE.Vector3(0, 0, 0));

// Initialize by WebGLRenderingContext
effekseer.init(renderer.getContext());

// Load effect data
var effect = effekseer.loadEffect("Laser01.efk", function(){
  // Play the loaded effect
  effekseer.play(effect);
});

(function renderLoop() {
  requestAnimationFrame( renderLoop );

  // Effekseer Update
  effekseer.update(clock.getDelta() * 60.0);

  // Three.js Rendering
  renderer.render(scene, camera);

  // Rendering Settings
  effekseer.setProjectionMatrix(camera.projectionMatrix.elements);
  effekseer.setCameraMatrix(camera.matrixWorldInverse.elements);

  // Effekseer Rendering
  effekseer.draw();
})();

```

# How to develop

## Clone the repositories

```
git clone https://github.com/effekseer/Effekseer
git clone https://github.com/effekseer/EffekseerForWebGL
```

## Requirements

- python
- cmake
- mingw-make (Windows only)
- Emscripten 1.38.38 (Add directory to PATH)

## Build

```
pip install dukpy jsmin
python build.py
```
