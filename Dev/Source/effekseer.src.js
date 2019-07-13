"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var effekseer = function () {
  var Module = effekseer();

  // C++ functions
  var Core = {
    Init: Module.cwrap("EffekseerInit", "number", ["number", "number"]),
    Terminate: Module.cwrap("EffekseerTerminate", "void", ["number"]),
    Update: Module.cwrap("EffekseerUpdate", "void", ["number", "number"]),
    BeginUpdate: Module.cwrap("EffekseerBeginUpdate", "void", ["number"]),
    EndUpdate: Module.cwrap("EffekseerEndUpdate", "void", ["number"]),
    UpdateHandle: Module.cwrap("EffekseerUpdateHandle", "void", ["number", "number", "number"]),
    Draw: Module.cwrap("EffekseerDraw", "void", ["number"]),
    BeginDraw: Module.cwrap("EffekseerBeginDraw", "void", ["number"]),
    EndDraw: Module.cwrap("EffekseerEndDraw", "void", ["number"]),
    DrawHandle: Module.cwrap("EffekseerDrawHandle", "void", ["number", "number"]),
    SetProjectionMatrix: Module.cwrap("EffekseerSetProjectionMatrix", "void", ["number", "number"]),
    SetProjectionPerspective: Module.cwrap("EffekseerSetProjectionPerspective", "void", ["number", "number", "number", "number", "number"]),
    SetProjectionOrthographic: Module.cwrap("EffekseerSetProjectionOrthographic", "void", ["number", "number", "number", "number", "number"]),
    SetCameraMatrix: Module.cwrap("EffekseerSetCameraMatrix", "void", ["number", "number"]),
    SetCameraLookAt: Module.cwrap("EffekseerSetCameraLookAt", "void", ["number", "number", "number", "number", "number", "number", "number", "number", "number", "number"]),
    LoadEffect: Module.cwrap("EffekseerLoadEffect", "number", ["number", "number", "number", "number", "number"]),
    ReleaseEffect: Module.cwrap("EffekseerReleaseEffect", "void", ["number", "number"]),
    ReloadResources: Module.cwrap("EffekseerReloadResources", "void", ["number", "number"]),
    StopAllEffects: Module.cwrap("EffekseerStopAllEffects", "void", ["number"]),
    PlayEffect: Module.cwrap("EffekseerPlayEffect", "number", ["number", "number", "number", "number", "number"]),
    StopEffect: Module.cwrap("EffekseerStopEffect", "void", ["number", "number"]),
    StopRoot: Module.cwrap("EffekseerStopRoot", "void", ["number", "number"]),
    Exists: Module.cwrap("EffekseerExists", "number", ["number", "number"]),
    SetLocation: Module.cwrap("EffekseerSetLocation", "void", ["number", "number", "number", "number", "number"]),
    SetRotation: Module.cwrap("EffekseerSetRotation", "void", ["number", "number", "number", "number", "number"]),
    SetScale: Module.cwrap("EffekseerSetScale", "void", ["number", "number", "number", "number", "number"]),
    SetMatrix: Module.cwrap("EffekseerSetMatrix", "void", ["number", "number", "number"]),
    SetTargetLocation: Module.cwrap("EffekseerSetTargetLocation", "void", ["number", "number", "number", "number", "number"]),
    SetPaused: Module.cwrap("EffekseerSetPaused", "void", ["number", "number", "number"]),
    SetShown: Module.cwrap("EffekseerSetShown", "void", ["number", "number", "number"]),
    SetSpeed: Module.cwrap("EffekseerSetSpeed", "void", ["number", "number", "number"]),
    IsBinaryglTF: Module.cwrap("EffekseerIsBinaryglTF", "number", ["number", "number", "number"]),
    GetglTFBodyURI: Module.cwrap("EffekseerGetglTFBodyURI", "number", ["number", "number", "number"]),
    IsVertexArrayObjectSupported: Module.cwrap("EffekseerIsVertexArrayObjectSupported", "number", ["number"]),
    EstimateBoundingBox: Module.cwrap("EffekseerEstimateBoundingBox", "void", ["number", "number", "number", "number", "number", "number", "number", "number"])
  };

  var EffekseerBoundingBox = function EffekseerBoundingBox() {
    _classCallCheck(this, EffekseerBoundingBox);

    this.top = 0;
    this.left = 0;
    this.right = 0;
    this.bottom = 0;
  };

  /**
   * A loaded effect data
   * @class
   */


  var EffekseerEffect = function () {
    function EffekseerEffect(context) {
      _classCallCheck(this, EffekseerEffect);

      this.context = context;
      this.nativeptr = 0;
      this.baseDir = "";
      this.isLoaded = false;
      this.scale = 1.0;
      this.resources = [];
      this.main_buffer = null;
    }

    _createClass(EffekseerEffect, [{
      key: "_load",
      value: function _load(buffer) {
        loadingEffect = this;
        this.main_buffer = buffer;
        var memptr = Module._malloc(buffer.byteLength);
        Module.HEAP8.set(new Uint8Array(buffer), memptr);
        this.nativeptr = Core.LoadEffect(this.context.nativeptr, memptr, buffer.byteLength, this.scale);
        Module._free(memptr);
        loadingEffect = null;
        this._update();
      }
    }, {
      key: "_reload",
      value: function _reload() {
        loadingEffect = this;
        var buffer = this.main_buffer;
        var memptr = Module._malloc(buffer.byteLength);
        Module.HEAP8.set(new Uint8Array(buffer), memptr);
        Core.ReloadResources(this.context.nativeptr, this.nativeptr, memptr, buffer.byteLength);
        Module._free(memptr);
        loadingEffect = null;
      }
    }, {
      key: "_update",
      value: function _update() {
        var loaded = this.nativeptr != 0;
        if (this.resources.length > 0) {
          for (var i = 0; i < this.resources.length; i++) {
            if (!this.resources[i].isLoaded) {
              loaded = false;
              break;
            }
          }
          if (loaded) {
            this._reload();
          }
        }
        if (!this.isLoaded && loaded) {
          this.isLoaded = true;
          if (this.onload) this.onload();
        }
      }
    }]);

    return EffekseerEffect;
  }();

  /**
   * A handle that played effect instance.
   * @class
   */


  var EffekseerHandle = function () {
    function EffekseerHandle(context, native) {
      _classCallCheck(this, EffekseerHandle);

      this.context = context;
      this.native = native;
    }

    /**
     * Stop this effect instance.
     */


    _createClass(EffekseerHandle, [{
      key: "stop",
      value: function stop() {
        Core.StopEffect(this.context.nativeptr, this.native);
      }

      /**
       * Stop the root node of this effect instance.
       */

    }, {
      key: "stopRoot",
      value: function stopRoot() {
        Core.StopRoot(this.context.nativeptr, this.native);
      }

      /**
       * if returned false, this effect is end of playing.
       * @property {boolean}
       */

    }, {
      key: "setLocation",


      /**
       * Set the location of this effect instance.
       * @param {number} x X value of location
       * @param {number} y Y value of location
       * @param {number} z Z value of location
       */
      value: function setLocation(x, y, z) {
        Core.SetLocation(this.context.nativeptr, this.native, x, y, z);
      }

      /**
       * Set the rotation of this effect instance.
       * @param {number} x X value of euler angle
       * @param {number} y Y value of euler angle
       * @param {number} z Z value of euler angle
       */

    }, {
      key: "setRotation",
      value: function setRotation(x, y, z) {
        Core.SetRotation(this.context.nativeptr, this.native, x, y, z);
      }

      /**
       * Set the scale of this effect instance.
       * @param {number} x X value of scale factor
       * @param {number} y Y value of scale factor
       * @param {number} z Z value of scale factor
       */

    }, {
      key: "setScale",
      value: function setScale(x, y, z) {
        Core.SetScale(this.context.nativeptr, this.native, x, y, z);
      }

      /**
       * Set the model matrix of this effect instance.
       * @param {array} matrixArray An array that is requred 16 elements
       */

    }, {
      key: "setMatrix",
      value: function setMatrix(matrixArray) {
        var stack = Module.stackSave();
        var arrmem = Module.stackAlloc(4 * 16);
        Module.HEAPF32.set(matrixArray, arrmem >> 2);
        Core.SetMatrix(this.context.nativeptr, this.native, arrmem);
        Module.stackRestore(stack);
      }

      /**
       * Set the target location of this effect instance.
       * @param {number} x X value of target location
       * @param {number} y Y value of target location
       * @param {number} z Z value of target location
       */

    }, {
      key: "setTargetLocation",
      value: function setTargetLocation(x, y, z) {
        Core.SetTargetLocation(this.context.nativeptr, this.native, x, y, z);
      }

      /**
       * Set the paused flag of this effect instance.
       * if specified true, this effect playing will not advance.
       * @param {boolean} paused Paused flag
       */

    }, {
      key: "setPaused",
      value: function setPaused(paused) {
        Core.SetPaused(this.context.nativeptr, this.native, paused);
      }

      /**
       * Set the shown flag of this effect instance.
       * if specified false, this effect will be invisible.
       * @param {boolean} shown Shown flag
       */

    }, {
      key: "setShown",
      value: function setShown(shown) {
        Core.SetShown(this.context.nativeptr, this.native, shown);
      }

      /**
       * Set playing speed of this effect.
       * @param {number} speed Speed ratio
       */

    }, {
      key: "setSpeed",
      value: function setSpeed(speed) {
        Core.SetSpeed(this.context.nativeptr, this.native, speed);
      }
    }, {
      key: "exists",
      get: function get() {
        return !!Core.Exists(this.context.nativeptr, this.native);
      }
    }]);

    return EffekseerHandle;
  }();

  var _isImagePowerOfTwo = function _isImagePowerOfTwo(image) {
    return !(image.width & image.width - 1) && !(image.height & image.height - 1);
  };

  var calcNextPowerOfTwo = function calcNextPowerOfTwo(v) {
    var sizes = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048];

    var foundInd = -1;
    for (var i = 0; i < sizes.length; i++) {
      if (sizes[i] >= v) {
        return sizes[i];
      }
    }

    for (var i = sizes.length - 1; i >= 0; i--) {
      if (sizes[i] <= v) {
        return sizes[i];
      }
    }
    return 1;
  };

  var _convertPowerOfTwoImage = function _convertPowerOfTwoImage(image) {
    if (!_isImagePowerOfTwo(image)) {
      var canvas = document.createElement("canvas");
      canvas.width = calcNextPowerOfTwo(image.width);
      canvas.height = calcNextPowerOfTwo(image.height);
      var context2d = canvas.getContext("2d");
      context2d.drawImage(image, 0, 0, image.width, image.height);
      image = canvas;
    }

    return image;
  };

  var _loadBinFile = function _loadBinFile(url, onload, onerror) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = "arraybuffer";
    xhr.onload = function () {
      onload(xhr.response);
    };
    xhr.onerror = function () {
      if (onerror) onerror();
    };
    xhr.send(null);
  };

  var _loadResource = function _loadResource(path, onload, onerror) {
    var extindex = path.lastIndexOf(".");
    var ext = extindex >= 0 ? path.slice(extindex) : "";
    if (ext == ".png" || ext == ".jpg") {
      var image = new Image();
      image.onload = function () {
        var converted_image = _convertPowerOfTwoImage(image);
        onload(converted_image);
      };
      image.onerror = onerror;
      image.crossOrigin = "anonymous";
      image.src = path;
    } else {
      _loadBinFile(path, function (buffer) {
        onload(buffer);
      }, onerror);
    }
  };

  var loadingEffect = null;

  Module._isPowerOfTwo = function (img) {
    return _isImagePowerOfTwo(img);
  };

  Module._loadImage = function (path) {
    var effect = loadingEffect;
    effect.context._makeContextCurrent();

    var res = effect.resources.find(function (res) {
      return res.path == path;
    });
    if (res) {
      return res.isLoaded ? res.image : null;
    }

    var res = { path: path, isLoaded: false, image: null };
    effect.resources.push(res);

    _loadResource(effect.baseDir + path, function (image) {
      res.image = image;
      res.isLoaded = true;
      effect._update();
    }, effect.onerror);
    return null;
  };

  Module._loadBinary = function (path) {
    var effect = loadingEffect;
    effect.context._makeContextCurrent();

    var res = effect.resources.find(function (res) {
      return res.path == path;
    });
    if (res) {
      return res.isLoaded ? res.buffer : null;
    }

    var res = { path: path, isLoaded: false, buffer: null };
    effect.resources.push(res);

    _loadResource(effect.baseDir + path, function (buffer) {
      res.buffer = buffer;
      res.isLoaded = true;
      effect._update();
    }, effect.onerror);
    return null;
  };

  var ContextStates = function () {
    function ContextStates(gl) {
      _classCallCheck(this, ContextStates);

      this.gl = gl;
      this.ext_vao = null;
      this.effekseer_vao = null;
      this.current_vao = null;
      this.current_vbo = null;
      this.current_ibo = null;

      this.ext_vao = gl.getExtension('OES_vertex_array_object');
      if (this.ext_vao != null) {
        this.effekseer_vao = this.ext_vao.createVertexArrayOES();
      }
    }

    _createClass(ContextStates, [{
      key: "save",
      value: function save() {
        this.current_vbo = this.gl.getParameter(this.gl.ARRAY_BUFFER_BINDING);
        this.current_ibo = this.gl.getParameter(this.gl.ELEMENT_ARRAY_BUFFER_BINDING);
        if (this.ext_vao != null) {
          this.current_vao = this.gl.getParameter(this.ext_vao.VERTEX_ARRAY_BINDING_OES);
          this.ext_vao.bindVertexArrayOES(this.effekseer_vao);
        }
      }
    }, {
      key: "restore",
      value: function restore() {
        if (this.ext_vao != null) {
          this.ext_vao.bindVertexArrayOES(this.current_vao);
        }

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.current_vbo);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.current_ibo);
      }
    }]);

    return ContextStates;
  }();

  var EffekseerContext = function () {
    function EffekseerContext() {
      _classCallCheck(this, EffekseerContext);
    }

    _createClass(EffekseerContext, [{
      key: "_loadBinary_with_effect_cache",
      value: function _loadBinary_with_effect_cache(path, effect, onload, onerror) {
        var res = effect.resources.find(function (res) {
          return res.path == path;
        });
        if (res) {
          onload();
          return res.isLoaded ? res.buffer : null;
        }

        var res = { path: path, isLoaded: false, buffer: null };
        effect.resources.push(res);

        _loadBinFile(effect.baseDir + path, function (buffer) {
          res.buffer = buffer;
          res.isLoaded = true;
          onload(buffer);
        }, onerror);
        return null;
      }
    }, {
      key: "_getglTFBodyURI",
      value: function _getglTFBodyURI(buffer) {
        var memptr = Module._malloc(buffer.byteLength);
        Module.HEAP8.set(new Uint8Array(buffer), memptr);
        ptr = Core.GetglTFBodyURI(memptr, buffer.byteLength);
        str = Module.UTF8ToString(ptr);
        Module._free(memptr);
        return str;
      }
    }, {
      key: "_isBinaryglTF",
      value: function _isBinaryglTF(context, buffer) {
        var memptr = Module._malloc(buffer.byteLength);
        Module.HEAP8.set(new Uint8Array(buffer), memptr);
        var ret = Core.IsBinaryglTF(context.nativeptr, memptr, buffer.byteLength);
        Module._free(memptr);
        return ret > 0;
      }
    }, {
      key: "_makeContextCurrent",
      value: function _makeContextCurrent() {
        Module.GL.makeContextCurrent(this.ctx);
      }

      /**
       * Initialize graphics system.
       * @param {WebGLRenderingContext} webglContext WebGL Context
       * @param {object} settings Some settings with Effekseer initialization
       */

    }, {
      key: "init",
      value: function init(webglContext, settings) {
        this.gl = webglContext;
        this.contextStates = new ContextStates(this.gl);

        window.gl = this.gl;
        // Setup native OpenGL context
        this.ctx = Module.GL.registerContext(webglContext, {
          majorVersion: 1, minorVersion: 0, enableExtensionsByDefault: true
        });
        this._makeContextCurrent();

        if (!settings) {
          settings = {
            instanceMaxCount: 4000,
            squareMaxCount: 10000
          };
        }

        // Initializes Effekseer core.
        this.contextStates.save();
        this.nativeptr = Core.Init(settings.instanceMaxCount, settings.squareMaxCount);
        this.contextStates.restore();
      }

      /**
       * Advance frames.
       * @param {number=} deltaFrames number of advance frames
       */

    }, {
      key: "update",
      value: function update(deltaFrames) {
        if (!deltaFrames) deltaFrames = 1.0;
        // Update frame
        Core.Update(this.nativeptr, deltaFrames);
      }
    }, {
      key: "beginUpdate",
      value: function beginUpdate() {
        Core.BeginUpdate(this.nativeptr);
      }
    }, {
      key: "endUpdate",
      value: function endUpdate() {
        Core.EndUpdate(this.nativeptr);
      }
    }, {
      key: "updateHandle",
      value: function updateHandle(handle, deltaFrames) {
        Core.UpdateHandle(this.nativeptr, handle.native, deltaFrames);
      }

      /**
       * Main rendering.
       */

    }, {
      key: "draw",
      value: function draw() {
        this._makeContextCurrent();

        // Save WebGL states
        var program = this.gl.getParameter(gl.CURRENT_PROGRAM);

        // Draw the effekseer core
        this.contextStates.save();
        Core.Draw(this.nativeptr);
        this.contextStates.restore();

        // Restore WebGL states
        this.gl.useProgram(program);
      }
    }, {
      key: "beginDraw",
      value: function beginDraw() {
        Core.BeginDraw(this.nativeptr);
      }
    }, {
      key: "endDraw",
      value: function endDraw() {
        Core.EndDraw(this.nativeptr);
      }
    }, {
      key: "drawHandle",
      value: function drawHandle(handle) {
        Core.DrawHandle(this.nativeptr, handle.native);
      }

      /**
       * Set camera projection from matrix.
       * @param {array} matrixArray An array that is requred 16 elements
       */

    }, {
      key: "setProjectionMatrix",
      value: function setProjectionMatrix(matrixArray) {
        var stack = Module.stackSave();
        var arrmem = Module.stackAlloc(4 * 16);
        Module.HEAPF32.set(matrixArray, arrmem >> 2);
        Core.SetProjectionMatrix(this.nativeptr, arrmem);
        Module.stackRestore(stack);
      }

      /**
       * Set camera projection from perspective parameters.
       * @param {number} fov Field of view in degree
       * @param {number} aspect Aspect ratio
       * @param {number} near Distance of near plane
       * @param {number} aspect Distance of far plane
       */

    }, {
      key: "setProjectionPerspective",
      value: function setProjectionPerspective(fov, aspect, near, far) {
        Core.SetProjectionPerspective(this.nativeptr, fov, aspect, near, far);
      }

      /**
       * Set camera projection from orthographic parameters.
       * @param {number} width Width coordinate of the view plane
       * @param {number} height Height coordinate of the view plane
       * @param {number} near Distance of near plane
       * @param {number} aspect Distance of far plane
       */

    }, {
      key: "setProjectionOrthographic",
      value: function setProjectionOrthographic(width, height, near, far) {
        Core.SetProjectionOrthographic(this.nativeptr, width, height, near, far);
      }

      /**
       * Set camera view from matrix.
       * @param {array} matrixArray An array that is requred 16 elements
       */

    }, {
      key: "setCameraMatrix",
      value: function setCameraMatrix(matrixArray) {
        var stack = Module.stackSave();
        var arrmem = Module.stackAlloc(4 * 16);
        Module.HEAPF32.set(matrixArray, arrmem >> 2);
        Core.SetCameraMatrix(this.nativeptr, arrmem);
        Module.stackRestore(stack);
      }

      /**
       * Set camera view from lookat parameters.
       * @param {number} positionX X value of camera position
       * @param {number} positionY Y value of camera position
       * @param {number} positionZ Z value of camera position
       * @param {number} targetX X value of target position
       * @param {number} targetY Y value of target position
       * @param {number} targetZ Z value of target position
       * @param {number} upvecX X value of upper vector
       * @param {number} upvecY Y value of upper vector
       * @param {number} upvecZ Z value of upper vector
       */

    }, {
      key: "setCameraLookAt",
      value: function setCameraLookAt(positionX, positionY, positionZ, targetX, targetY, targetZ, upvecX, upvecY, upvecZ) {
        Core.SetCameraLookAt(this.nativeptr, positionX, positionY, positionZ, targetX, targetY, targetZ, upvecX, upvecY, upvecZ);
      }

      /**
       * Set camera view from lookat vector parameters.
       * @param {object} position camera position
       * @param {object} target target position
       * @param {object=} upvec upper vector
       */

    }, {
      key: "setCameraLookAtFromVector",
      value: function setCameraLookAtFromVector(position, target, upvec) {
        upvecVector = (typeof upvecVector === "undefined" ? "undefined" : _typeof(upvecVector)) === "object" ? upvecVector : { x: 0, y: 1, z: 0 };
        Core.SetCameraLookAt(this.nativeptr, position.x, position.y, position.z, target.x, target.y, target.z, upvec.x, upvec.y, upvec.z);
      }

      /**
       * Load the effect data file (and resources).
       * @param {string} path A URL of effect file (*.efk)
       * @param {number} scale A magnification rate for the effect. The effect is loaded magnificating with this specified number.
       * @param {function=} onload A function that is called at loading complete
       * @param {function=} onerror A function that is called at loading error
       * @returns {EffekseerEffect} The effect data
       */

    }, {
      key: "loadEffect",
      value: function loadEffect(path) {
        var scale = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1.0;

        var _this = this;

        var onload = arguments[2];
        var onerror = arguments[3];

        this._makeContextCurrent();

        var effect = new EffekseerEffect(this);
        var dirIndex = path.lastIndexOf("/");

        if (typeof scale === "function") {
          console.log("Error : second arguments is number from version 1.5");
          effect.scale = 1.0;
          effect.onload = scale;
          effect.onerror = onload;
        } else {
          effect.scale = scale;
          effect.onload = onload;
          effect.onerror = onerror;
        }

        if (typeof path === "string") {
          effect.baseDir = dirIndex >= 0 ? path.slice(0, dirIndex + 1) : "";
          _loadBinFile(path, function (buffer) {

            if (_this._isBinaryglTF(_this, buffer)) {
              // glTF
              bodyPath = _this._getglTFBodyURI(buffer);

              _this._loadBinary_with_effect_cache(bodyPath, effect, function (bufferBody) {
                effect._load(buffer);
              }, effect.onerror);
            } else {
              effect._load(buffer);
            }
          }, effect.onerror);
        } else if (typeof path === "arraybuffer") {
          var buffer = path;
          effect._load(buffer);
        }

        return effect;
      }

      /**
       * Release the specified effect. Don't touch the instance of effect after released.
       * @param {EffekseerEffect} effect The loaded effect
       */

    }, {
      key: "releaseEffect",
      value: function releaseEffect(effect) {
        this._makeContextCurrent();

        if (effect == null) {
          console.warn("the effect is null.");
          return;
        }

        if (!effect.isLoaded) {
          console.warn("the effect has not be loaded yet.");
          return;
        }

        if (effect.nativeptr == null) {
          console.warn("the effect has been released.");
          return;
        }

        Core.ReleaseEffect(this.nativeptr, effect.nativeptr);
        effect.nativeptr = null;
      }

      /**
       * Play the specified effect.
       * @param {EffekseerEffect} effect The loaded effect
       * @param {number} x X value of location that is emited
       * @param {number} y Y value of location that is emited
       * @param {number} z Z value of location that is emited
       * @returns {EffekseerHandle} The effect handle
       */

    }, {
      key: "play",
      value: function play(effect, x, y, z) {
        if (!effect || !effect.isLoaded) {
          return null;
        }
        if (x === undefined) x = 0;
        if (y === undefined) y = 0;
        if (z === undefined) z = 0;
        var handle = Core.PlayEffect(this.nativeptr, effect.nativeptr, x, y, z);
        return handle >= 0 ? new EffekseerHandle(this, handle) : null;
      }

      /**
       * Stop the all effects.
       */

    }, {
      key: "stopAll",
      value: function stopAll() {
        Core.StopAllEffects(this.nativeptr);
      }

      /**
       * Set the resource loader function.
       * @param {function} loader
       */

    }, {
      key: "setResourceLoader",
      value: function setResourceLoader(loader) {
        _loadResource = loader;
      }

      /**
       * Get whether VAO is supported
       */

    }, {
      key: "isVertexArrayObjectSupported",
      value: function isVertexArrayObjectSupported() {
        return Core.IsVertexArrayObjectSupported(this.nativeptr);
      }
    }]);

    return EffekseerContext;
  }();

  /**
   * Effekseer Context
   * @class
   */


  var Effekseer = function () {
    function Effekseer() {
      _classCallCheck(this, Effekseer);
    }

    _createClass(Effekseer, [{
      key: "createContext",


      /**
       * Create a context to render in multiple scenes
       * @returns {EffekseerContext} context
       */
      value: function createContext() {
        return new EffekseerContext();
      }

      /**
      * Release specified context. After that, don't touch a context
      * @param {EffekseerContext} context context
      */

    }, {
      key: "releaseContext",
      value: function releaseContext(context) {
        if (context.nativeptr == null) {
          return;
        }
        Core.Terminate(context.nativeptr);
        context.nativeptr = null;
      }

      /**
       * Initialize graphics system.
       * @param {WebGLRenderingContext} webglContext WebGL Context
       * @param {object} settings Some settings with Effekseer initialization
       */

    }, {
      key: "init",
      value: function init(webglContext, settings) {
        this.defaultContext = new EffekseerContext();
        this.defaultContext.init(webglContext, settings);
      }

      /**
       * Advance frames.
       * @param {number=} deltaFrames number of advance frames
       */

    }, {
      key: "update",
      value: function update(deltaFrames) {
        this.defaultContext.update(deltaFrames);
      }
    }, {
      key: "beginUpdate",
      value: function beginUpdate() {
        this.defaultContext.beginUpdate();
      }
    }, {
      key: "endUpdate",
      value: function endUpdate() {
        this.defaultContext.endUpdate();
      }
    }, {
      key: "updateHandle",
      value: function updateHandle(handle, deltaFrames) {
        this.defaultContext.updateHandle(handle, deltaFrames);
      }

      /**
       * Main rendering.
       */

    }, {
      key: "draw",
      value: function draw() {
        this.defaultContext.draw();
      }
    }, {
      key: "beginDraw",
      value: function beginDraw() {
        this.defaultContext.beginDraw();
      }
    }, {
      key: "endDraw",
      value: function endDraw() {
        this.defaultContext.endDraw();
      }
    }, {
      key: "drawHandle",
      value: function drawHandle(handle) {
        this.defaultContext.drawHandle(handle);
      }

      /**
       * Set camera projection from matrix.
       * @param {array} matrixArray An array that is requred 16 elements
       */

    }, {
      key: "setProjectionMatrix",
      value: function setProjectionMatrix(matrixArray) {
        this.defaultContext.setProjectionMatrix(matrixArray);
      }

      /**
       * Set camera projection from perspective parameters.
       * @param {number} fov Field of view in degree
       * @param {number} aspect Aspect ratio
       * @param {number} near Distance of near plane
       * @param {number} aspect Distance of far plane
       */

    }, {
      key: "setProjectionPerspective",
      value: function setProjectionPerspective(fov, aspect, near, far) {
        this.defaultContext.SetProjectionPerspective(fov, aspect, near, far);
      }

      /**
       * Set camera projection from orthographic parameters.
       * @param {number} width Width coordinate of the view plane
       * @param {number} height Height coordinate of the view plane
       * @param {number} near Distance of near plane
       * @param {number} aspect Distance of far plane
       */

    }, {
      key: "setProjectionOrthographic",
      value: function setProjectionOrthographic(width, height, near, far) {
        this.defaultContext.setProjectionOrthographic(width, height, near, far);
      }

      /**
       * Set camera view from matrix.
       * @param {array} matrixArray An array that is requred 16 elements
       */

    }, {
      key: "setCameraMatrix",
      value: function setCameraMatrix(matrixArray) {
        this.defaultContext.setCameraMatrix(matrixArray);
      }

      /**
       * Set camera view from lookat parameters.
       * @param {number} positionX X value of camera position
       * @param {number} positionY Y value of camera position
       * @param {number} positionZ Z value of camera position
       * @param {number} targetX X value of target position
       * @param {number} targetY Y value of target position
       * @param {number} targetZ Z value of target position
       * @param {number} upvecX X value of upper vector
       * @param {number} upvecY Y value of upper vector
       * @param {number} upvecZ Z value of upper vector
       */

    }, {
      key: "setCameraLookAt",
      value: function setCameraLookAt(positionX, positionY, positionZ, targetX, targetY, targetZ, upvecX, upvecY, upvecZ) {
        this.defaultContext.setCameraLookAt(positionX, positionY, positionZ, targetX, targetY, targetZ, upvecX, upvecY, upvecZ);
      }

      /**
       * Set camera view from lookat vector parameters.
       * @param {object} position camera position
       * @param {object} target target position
       * @param {object=} upvec upper vector
       */

    }, {
      key: "setCameraLookAtFromVector",
      value: function setCameraLookAtFromVector(position, target, upvec) {
        this.defaultContext.setCameraLookAtFromVector(position, target, upvec);
      }

      /**
       * Load the effect data file (and resources).
       * @param {string} path A URL of effect file (*.efk)
       * @param {number} scale A magnification rate for the effect. The effect is loaded magnificating with this specified number.
       * @param {function=} onload A function that is called at loading complete
       * @param {function=} onerror A function that is called at loading error
       * @returns {EffekseerEffect} The effect data
       */

    }, {
      key: "loadEffect",
      value: function loadEffect(path) {
        var scale = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1.0;
        var onload = arguments[2];
        var onerror = arguments[3];

        return this.defaultContext.loadEffect(path, scale, onload, onerror);
      }

      /**
       * Release the specified effect. Don't touch the instance of effect after released.
       * @param {EffekseerEffect} effect The loaded effect
       */

    }, {
      key: "releaseEffect",
      value: function releaseEffect(effect) {
        this.defaultContext.releaseEffect(effect);
      }

      /**
       * Play the specified effect.
       * @param {EffekseerEffect} effect The loaded effect
       * @param {number} x X value of location that is emited
       * @param {number} y Y value of location that is emited
       * @param {number} z Z value of location that is emited
       * @returns {EffekseerHandle} The effect handle
       */

    }, {
      key: "play",
      value: function play(effect, x, y, z) {
        return this.defaultContext.play(effect, x, y, z);
      }

      /**
       * Stop the all effects.
       */

    }, {
      key: "stopAll",
      value: function stopAll() {
        this.defaultContext.stopAll();
      }

      /**
       * Set the resource loader function.
       * @param {function} loader
       */

    }, {
      key: "setResourceLoader",
      value: function setResourceLoader(loader) {
        this.defaultContext.setResourceLoader(loader);
      }

      /**
       * Get whether VAO is supported
       */

    }, {
      key: "isVertexArrayObjectSupported",
      value: function isVertexArrayObjectSupported() {
        return this.defaultContext.isVertexArrayObjectSupported();
      }
    }, {
      key: "estimateBoundingBox",
      value: function estimateBoundingBox(effect, cameraMat, projMat, screenWidth, screenHeight, time, rate) {
        var stack = Module.stackSave();
        var ret_ = Module.stackAlloc(4 * 4);
        var cameraMat_ = Module.stackAlloc(4 * 16);
        var projMat_ = Module.stackAlloc(4 * 16);

        Module.HEAPF32.set(cameraMat, cameraMat_ >> 2);
        Module.HEAPF32.set(projMat, projMat_ >> 2);

        Core.EstimateBoundingBox(ret_, effect.nativeptr, cameraMat_, projMat_, screenWidth, screenHeight, time, rate);

        var ret = new EffekseerBoundingBox();
        ret.left = Module.HEAP32[(ret_ >> 2) + 0];
        ret.top = Module.HEAP32[(ret_ >> 2) + 1];
        ret.right = Module.HEAP32[(ret_ >> 2) + 2];
        ret.bottom = Module.HEAP32[(ret_ >> 2) + 3];

        Module.stackRestore(stack);
        return ret;
      }
    }]);

    return Effekseer;
  }();

  return new Effekseer();
}();

// Add support for CommonJS libraries such as browserify.
if (typeof exports !== 'undefined') {
  exports = effekseer;
}
