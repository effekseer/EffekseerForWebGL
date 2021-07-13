# EffekseerForWebGL

- [Official website](http://effekseer.github.io)
- [Effekseer main repository](https://github.com/effekseer/Effekseer)
- [Changes](CHANGES)

# Demo

- [Demo](https://effekseer.github.io/EffekseerForWebGL/Sample/index.html)

# Download

- [1.60e](https://github.com/effekseer/EffekseerForWebGL/releases/download/160e/EffekseerForWebGL160e.zip)

1.61 Beta1 is optimzied for smartphonnes.

- [1.61Beta1](https://github.com/effekseer/EffekseerForWebGL/releases/download/161Beta1/EffekseerForWebGL161Beta1.zip)


- [1.53c](https://github.com/effekseer/EffekseerForWebGL/releases/download/153c/EffekseerForWebGL153c.zip)


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

### 1.6

```js

function main()
{
  // Setup WebGLRenderer
  var canvas = document.getElementById("canvas");

  // There is a bug in the old three.js resetState. It is recommended to use a newer version.
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

  // fast rendering by skipping state fetching.
  // If there is a problem with the drawing, please set this flag to false.
  var fastRenderMode = true;

  if (fastRenderMode) {
    context.setRestorationOfStatesFlag(false);
  }

  // Load effect data
  var effect = context.loadEffect("Laser01.efkefc", 1.0, function(){
    // Play the loaded effect
    var handle = context.play(effect);
    // Change a position
    handle.setLocation(0,0,0);
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

    // Effekseer makes states dirtied. So reset three.js states
    if (fastRenderMode) {
      renderer.resetState();
    }
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

# How to develop

## Requirements

- git
- python
- cmake
- mingw-make (Windows only)
- Emscripten 1.38.38 or later (Add directory to PATH)

## Clone the repositories

```
git clone https://github.com/effekseer/EffekseerForWebGL
cd EffekseerForWebGL
git submodule update --init
```

## Build

```
emsdk install latest
emsdk activate latest
pip install dukpy jsmin
python build.py
```
