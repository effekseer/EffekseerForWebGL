# EffekseerForWebGL

- [Official website](http://effekseer.github.io)
- [Effekseer main repository](https://github.com/effekseer/Effekseer)

# Demo

- [Demo](https://effekseer.github.io/EffekseerForWebGL/docs/Sample/index.html)

# Download

- [1.43](https://github.com/effekseer/EffekseerForWebGL/releases/download/143/EffekseerForWebGL143.zip)

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
- Visual Studio 2015

### Emscripten(SDK)

- Emscripten 1.38.38 (Add directory to PATH)
- Java
- Python2x

### JavaScript

- npm
- babel-cli
- babel-preset-es2015

### Build commands

### Convert ES6 to ES5

#### Windows

install npm and babel

```
npm install -g babel-cli
```

move directory

```
cd Dev/Source/
```

install presets

```
npm install babel-preset-es2015 --save-dev
```

call bat

```
ConvertES6ToES5.bat
```

### Compile Native

#### Visual Studio 2015

```
cd Dev\Build
Build_2015.bat
```

### Packaging

```
cd Dev\Build
Package.bat
```

