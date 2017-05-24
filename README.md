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

- Emscripten 1.37.9 (Add directory to PATH)
- Visual Studio 2013 or later
- Java
- Python2x

### Build commands

```
cd Dev\Build
Build.bat
```
