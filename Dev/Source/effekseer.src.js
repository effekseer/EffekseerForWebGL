"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var effekseer = function () {
	var Module = effekseer();
	var Runtime = Module.Runtime;

	// C++ functions
	var Core = {
		Init: Module.cwrap("EffekseerInit", "void", ["number", "number"]),
		Update: Module.cwrap("EffekseerUpdate", "void", ["number"]),
		Draw: Module.cwrap("EffekseerDraw", "void", []),
		SetProjectionMatrix: Module.cwrap("EffekseerSetProjectionMatrix", "void", ["number"]),
		SetProjectionPerspective: Module.cwrap("EffekseerSetProjectionPerspective", "void", ["number", "number", "number", "number"]),
		SetProjectionOrthographic: Module.cwrap("EffekseerSetProjectionOrthographic", "void", ["number", "number", "number", "number"]),
		SetCameraMatrix: Module.cwrap("EffekseerSetCameraMatrix", "void", ["number"]),
		SetCameraLookAt: Module.cwrap("EffekseerSetCameraLookAt", "void", ["number", "number", "number", "number", "number", "number", "number", "number", "number"]),
		LoadEffect: Module.cwrap("EffekseerLoadEffect", "number", ["number", "number", "string"]),
		ReleaseEffect: Module.cwrap("EffekseerReleaseEffect", "void", ["number"]),
		ReloadResources: Module.cwrap("EffekseerReloadResources", "void", ["number"]),
		StopAllEffects: Module.cwrap("EffekseerStopAllEffects", "void", []),
		PlayEffect: Module.cwrap("EffekseerPlayEffect", "number", ["number", "number", "number", "number"]),
		StopEffect: Module.cwrap("EffekseerStopEffect", "void", ["number"]),
		StopRoot: Module.cwrap("EffekseerStopRoot", "void", ["number"]),
		Exists: Module.cwrap("EffekseerExists", "number", ["number"]),
		SetLocation: Module.cwrap("EffekseerSetLocation", "void", ["number", "number", "number", "number"]),
		SetRotation: Module.cwrap("EffekseerSetRotation", "void", ["number", "number", "number", "number"]),
		SetScale: Module.cwrap("EffekseerSetScale", "void", ["number", "number", "number", "number"]),
		SetMatrix: Module.cwrap("EffekseerSetMatrix", "void", ["number", "number"]),
		SetTargetLocation: Module.cwrap("EffekseerSetTargetLocation", "void", ["number", "number", "number", "number"]),
		SetPause: Module.cwrap("EffekseerSetPause", "void", ["number", "number"]),
		SetShown: Module.cwrap("EffekseerSetShown", "void", ["number", "number"]),
		SetSpeed: Module.cwrap("EffekseerSetSpeed", "void", ["number", "number"]),
		IsBinaryglTF: Module.cwrap("EffekseerIsBinaryglTF", "number", ["number", "number"]),
		GetglTFBodyURI: Module.cwrap("EffekseerGetglTFBodyURI", "number", ["number", "number"])
	};

	/**
 * A loaded effect data
 * @class
 */

	var EffekseerEffect = function () {
		function EffekseerEffect() {
			_classCallCheck(this, EffekseerEffect);

			this.nativeptr = 0;
			this.baseDir = "";
			this.isLoaded = false;
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
				this.nativeptr = Core.LoadEffect(memptr, buffer.byteLength);
				Module._free(memptr);
				loadingEffect = null;
				this._update();
			}
		}, {
			key: "_reload",
			value: function _reload() {
				loadingEffect = this;
				buffer = this.main_buffer;
				var memptr = Module._malloc(buffer.byteLength);
				Module.HEAP8.set(new Uint8Array(buffer), memptr);
				Core.ReloadResources(this.nativeptr, memptr, buffer.byteLength);
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
		function EffekseerHandle(native) {
			_classCallCheck(this, EffekseerHandle);

			this.native = native;
		}

		/**
  * Stop this effect instance.
  */


		_createClass(EffekseerHandle, [{
			key: "stop",
			value: function stop() {
				Core.StopEffect(this.native);
			}

			/**
   * Stop the root node of this effect instance.
   */

		}, {
			key: "stopRoot",
			value: function stopRoot() {
				Core.StopRoot(this.native);
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
				Core.SetLocation(this.native, x, y, z);
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
				Core.SetRotation(this.native, x, y, z);
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
				Core.SetScale(this.native, x, y, z);
			}

			/**
   * Set the model matrix of this effect instance.
   * @param {array} matrixArray An array that is requred 16 elements
   */

		}, {
			key: "setMatrix",
			value: function setMatrix(matrixArray) {
				var stack = Runtime.stackSave();
				var arrmem = Runtime.stackAlloc(4 * 16);
				Module.HEAPF32.set(matrixArray, arrmem >> 2);
				Core.SetMatrix(this.native, arrmem);
				Runtime.stackRestore(stack);
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
				Core.SetTargetLocation(this.native, x, y, z);
			}

			/**
   * Set the paused flag of this effect instance.
   * if specified true, this effect playing will not advance.
   * @param {boolean} paused Paused flag
   */

		}, {
			key: "setPaused",
			value: function setPaused(paused) {
				Core.SetPaused(this.native, paused);
			}

			/**
   * Set the shown flag of this effect instance.
   * if specified false, this effect will be invisible.
   * @param {boolean} shown Shown flag
   */

		}, {
			key: "setShown",
			value: function setShown(shown) {
				Core.SetShown(this.native, shown);
			}

			/**
   * Set playing speed of this effect.
   * @param {number} speed Speed ratio
   */

		}, {
			key: "setSpeed",
			value: function setSpeed(speed) {
				Core.SetSpeed(this.native, speed);
			}
		}, {
			key: "exists",
			get: function get() {
				return !!Core.Exists(this.native);
			}
		}]);

		return EffekseerHandle;
	}();

	var gl = null;
	var loadingEffect = null;

	var loadBinFile = function loadBinFile(url, onload, onerror) {
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

	var loadResource = function loadResource(path, onload, onerror) {
		var extindex = path.lastIndexOf(".");
		var ext = extindex >= 0 ? ext = path.slice(extindex) : "";
		if (ext == ".png" || ext == ".jpg") {
			var image = new Image();
			image.onload = function () {
				onload(image);
			};
			image.onerror = onerror;
			image.crossOrigin = "anonymous";
			image.src = path;
		} else {
			loadBinFile(path, function (buffer) {
				onload(buffer);
			}, onerror);
		}
	};

	Module._isPowerOfTwo = function (img) {
		return !(img.width & img.width - 1) && !(img.height & img.height - 1);
	};
	Module._loadImage = function (path) {
		var effect = loadingEffect;
		var res = effect.resources.find(function (res) {
			return res.path == path;
		});
		if (res) {
			return res.isLoaded ? res.image : null;
		}

		var res = { path: path, isLoaded: false, image: null };
		effect.resources.push(res);

		loadResource(effect.baseDir + path, function (image) {
			res.image = image;
			res.isLoaded = true;
			effect._update();
		}, effect.onerror);
		return null;
	};

	Module._loadBinary = function (path) {
		var effect = loadingEffect;
		var res = effect.resources.find(function (res) {
			return res.path == path;
		});
		if (res) {
			return res.isLoaded ? res.buffer : null;
		}

		var res = { path: path, isLoaded: false, buffer: null };
		effect.resources.push(res);

		loadResource(effect.baseDir + path, function (buffer) {
			res.buffer = buffer;
			res.isLoaded = true;
			effect._update();
		}, effect.onerror);
		return null;
	};

	_loadBinary_with_effect_cache = function _loadBinary_with_effect_cache(path, effect, onload, onerror) {
		var res = effect.resources.find(function (res) {
			return res.path == path;
		});
		if (res) {
			onload();
			return res.isLoaded ? res.buffer : null;
		}

		var res = { path: path, isLoaded: false, buffer: null };
		effect.resources.push(res);

		loadBinFile(effect.baseDir + path, function (buffer) {
			res.buffer = buffer;
			res.isLoaded = true;
			onload(buffer);
		}, onerror);
		return null;
	};

	_isBinaryglTF = function _isBinaryglTF(buffer) {
		var memptr = Module._malloc(buffer.byteLength);
		Module.HEAP8.set(new Uint8Array(buffer), memptr);
		ret = Core.IsBinaryglTF(memptr, buffer.byteLength);
		Module._free(memptr);
		return ret > 0;
	};

	_getglTFBodyURI = function _getglTFBodyURI(buffer) {
		var memptr = Module._malloc(buffer.byteLength);
		Module.HEAP8.set(new Uint8Array(buffer), memptr);
		ptr = Core.GetglTFBodyURI(memptr, buffer.byteLength);
		str = Module.Pointer_stringify(ptr);
		Module._free(memptr);
		return str;
	};

	/**
 * Effekseer Context
 * @class
 */

	var Effekseer = function () {
		function Effekseer() {
			_classCallCheck(this, Effekseer);
		}

		_createClass(Effekseer, [{
			key: "init",

			/**
   * Initialize graphics system.
   * @param {WebGLRenderingContext} webglContext WebGL Context
   * @param {object} settings Some settings with Effekseer initialization
   */
			value: function init(webglContext, settings) {
				gl = webglContext;
				window.gl = gl;
				// Setup native OpenGL context
				var ctx = Module.GL.registerContext(webglContext, {
					majorVersion: 1, minorVersion: 0, enableExtensionsByDefault: true
				});
				Module.GL.makeContextCurrent(ctx);

				if (!settings) {
					settings = {
						instanceMaxCount: 2000,
						squareMaxCount: 8000
					};
				}

				// Initializes Effekseer core.
				Core.Init(settings.instanceMaxCount, settings.squareMaxCount);
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
				Core.Update(deltaFrames);
			}

			/**
   * Main rendering.
   */

		}, {
			key: "draw",
			value: function draw() {
				// Save WebGL states
				var program = gl.getParameter(gl.CURRENT_PROGRAM);

				// Draw the effekseer core
				Core.Draw();

				// Restore WebGL states
				gl.useProgram(program);
			}

			/**
   * Set camera projection from matrix.
   * @param {array} matrixArray An array that is requred 16 elements
   */

		}, {
			key: "setProjectionMatrix",
			value: function setProjectionMatrix(matrixArray) {
				var stack = Runtime.stackSave();
				var arrmem = Runtime.stackAlloc(4 * 16);
				Module.HEAPF32.set(matrixArray, arrmem >> 2);
				Core.SetProjectionMatrix(arrmem);
				Runtime.stackRestore(stack);
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
				Core.SetProjectionPerspective(fov, aspect, near, far);
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
				Core.SetProjectionOrthographic(width, height, near, far);
			}

			/**
   * Set camera view from matrix.
   * @param {array} matrixArray An array that is requred 16 elements
   */

		}, {
			key: "setCameraMatrix",
			value: function setCameraMatrix(matrixArray) {
				var stack = Runtime.stackSave();
				var arrmem = Runtime.stackAlloc(4 * 16);
				Module.HEAPF32.set(matrixArray, arrmem >> 2);
				Core.SetCameraMatrix(arrmem);
				Runtime.stackRestore(stack);
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
				Core.SetCameraLookAt(positionX, positionY, positionZ, targetX, targetY, targetZ, upvecX, upvecY, upvecZ);
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
				Core.SetCameraLookAt(position.x, position.y, position.z, target.x, target.y, target.z, upvec.x, upvec.y, upvec.z);
			}

			/**
   * Load the effect data file (and resources).
   * @param {string} path A URL of effect file (*.efk)
   * @param {function=} onload A function that is called at loading complete
   * @param {function=} onerror A function that is called at loading error
   * @returns {EffekseerEffect} The effect data
   */

		}, {
			key: "loadEffect",
			value: function loadEffect(path, onload, onerror) {
				var effect = new EffekseerEffect();
				var dirIndex = path.lastIndexOf("/");

				effect.onload = onload;
				effect.onerror = onerror;

				if (typeof path === "string") {
					effect.baseDir = dirIndex >= 0 ? path.slice(0, dirIndex + 1) : "";
					loadBinFile(path, function (buffer) {

						if (_isBinaryglTF(buffer)) {
							// glTF
							bodyPath = _getglTFBodyURI(buffer);

							_loadBinary_with_effect_cache(bodyPath, effect, function (bufferBody) {
								effect._load(buffer);
							}, effect.onerror);
						} else {
							effect._load(buffer);
						}
					}, effect.onerror);
				} else if (typeof path === "arraybuffer") {
					var _buffer = path;
					effect._load(_buffer);
				}

				return effect;
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
				var handle = Core.PlayEffect(effect.nativeptr, x, y, z);
				return handle >= 0 ? new EffekseerHandle(handle) : null;
			}

			/**
   * Stop the all effects.
   */

		}, {
			key: "stopAll",
			value: function stopAll() {
				Core.StopAllEffects();
			}

			/**
   * Set the resource loader function.
   * @param {function} loader
   */

		}, {
			key: "setResourceLoader",
			value: function setResourceLoader(loader) {
				loadResource = loader;
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
