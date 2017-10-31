# EffekseerForWebGL

- [Official website](http://effekseer.github.io)
- [Effekseer main repository](https://github.com/effekseer/Effekseer)

# Demo

Work in progress...

# How to use

```html
<script src="three.min.js"></script>
<script src="effekseer.min.js"></script>
```

```js
// Setup WebGLRenderer
var renderer = new THREE.WebGLRenderer();

// Initialize by WebGLRenderingContext
effekseer.init(renderer.context);

// Load effect data
var effect = effekseer.loadEffect("Laser01.efk", function(){
  // Play the loaded effect
  effekseer.play(effect);
});

(function renderLoop() {
  requestAnimationFrame( renderLoop );
  
  // Effekseer Update
  effekseer.update();
  
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

## Clone the repository

```
git clone https://github.com/effekseer/Effekseer
git clone https://github.com/effekseer/EffekseerForWebGL
```

## Building (Windows)

### Requirements

### Common

- cmake
- mingw-make
- Visual Studio 2013 or 2015

### Emscripten(SDK)
- Emscripten 1.37.21 or later

### Emscripten(Install manually)

- Emscripten 1.37.9 (Add directory to PATH)
- Java
- Python2x

### Build commands

#### Visual Studio 2013

```
cd Dev\Build
Build_2013.bat
```
#### Visual Studio 2015

```
cd Dev\Build
Build_2015.bat
```

