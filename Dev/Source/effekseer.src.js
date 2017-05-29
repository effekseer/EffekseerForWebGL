
var effekseer = (function() {
	'use strict';

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
	};

	/**
	 * A loaded effect data
	 * @class
	 */
	var EffekseerEffect = function() {
		this.nativeptr = 0;
		this.baseDir = "";
		this.isLoaded = false;
		this.resources = [];
	};
	EffekseerEffect.prototype = {
		_load: function(buffer) {
			loadingEffect = this;
			var memptr = Module._malloc(buffer.byteLength);
			Module.HEAP8.set(new Uint8Array(buffer), memptr);
			this.nativeptr = Core.LoadEffect(memptr, buffer.byteLength);
			Module._free(memptr);
			loadingEffect = null;
			this._update();
		},
		_reload: function() {
			loadingEffect = this;
			Core.ReloadResources(this.nativeptr);
			loadingEffect = null;
		},
		_update: function() {
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
	};

	/**
	 * A handle that played effect instance.
	 * @class
	 */
	var EffekseerHandle = function(native) {
		this.native = native;
	};
	
	EffekseerHandle.prototype = {
		/**
		 * Stop this effect instance.
		 */
		stop: function() {
			Core.StopEffect(this.native);
		},
	
		/**
		 * Stop the root node of this effect instance.
		 */
		stopRoot: function() {
			Core.StopRoot(this.native);
		},

		/**
		 * if returned false, this effect is end of playing.
		 * @property {boolean}
		 */
	    get exists() {
			return !!Core.Exists(this.native);
	    },
		
		/**
		 * Set the location of this effect instance.
		 * @param {number} x X value of location
		 * @param {number} y Y value of location
		 * @param {number} z Z value of location
		 */
		setLocation: function(x, y, z) {
			Core.SetLocation(this.native, x, y, z);
		},
		
		/**
		 * Set the rotation of this effect instance.
		 * @param {number} x X value of euler angle
		 * @param {number} y Y value of euler angle
		 * @param {number} z Z value of euler angle
		 */
		setRotation: function(x, y, z) {
			Core.SetRotation(this.native, x, y, z);
		},
		
		/**
		 * Set the scale of this effect instance.
		 * @param {number} x X value of scale factor
		 * @param {number} y Y value of scale factor
		 * @param {number} z Z value of scale factor
		 */
		setScale: function(x, y, z) {
			Core.SetScale(this.native, x, y, z);
		},

		/**
		 * Set the model matrix of this effect instance.
		 * @param {array} matrixArray An array that is requred 16 elements
		 */
		setMatrix: function(matrixArray) {
			var stack = Runtime.stackSave();
			var arrmem = Runtime.stackAlloc(4 * 16);
			Module.HEAPF32.set(matrixArray, arrmem>>2);
			Core.SetMatrix(this.native, arrmem);
			Runtime.stackRestore(stack);
		},
		
		/**
		 * Set the target location of this effect instance.
		 * @param {number} x X value of target location
		 * @param {number} y Y value of target location
		 * @param {number} z Z value of target location
		 */
		setTargetLocation: function(x, y, z) {
			Core.SetTargetLocation(this.native, x, y, z);
		},
		
		/**
		 * Set the paused flag of this effect instance.
		 * if specified true, this effect playing will not advance.
		 * @param {boolean} paused Paused flag
		 */
		setPaused: function(paused) {
			Core.SetPaused(this.native, paused);
		},
		
		/**
		 * Set the shown flag of this effect instance.
		 * if specified false, this effect will be invisible.
		 * @param {boolean} shown Shown flag
		 */
		setShown: function(shown) {
			Core.SetShown(this.native, shown);
		},
		
		/**
		 * Set playing speed of this effect.
		 * @param {number} speed Speed ratio
		 */
		setSpeed: function(speed) {
			Core.SetSpeed(this.native, speed);
		},
	};
	
	var gl = null;
	var loadingEffect = null;

	var loadBinFile = function(url, onload, onerror) {
		var xhr = new XMLHttpRequest();
		xhr.open('GET', url, true);
		xhr.responseType = "arraybuffer";
		xhr.onload = function() {
			onload(xhr.response);
		};
		xhr.onerror = function() {
			if (onerror) onerror();
		}
		xhr.send(null);
	};
	var loadResource = function(path, onload, onerror) {
		var extindex = path.lastIndexOf(".");
		var ext = (extindex >= 0) ? ext = path.slice(extindex) : "";
		if (ext == ".png" || ext == ".jpg") {
			var image = new Image();
			image.onload = function() {
				onload(image);
			};
			image.onerror = onerror;
			image.crossOrigin = "anonymous";
			image.src = path;
		} else {
			loadBinFile(path, function(buffer) {
				onload(buffer);
			}, onerror);
		}
	};
	var loadEfkBuffer = function(buffer) {
		loadingEffect = effect;
		var memptr = Module._malloc(buffer.byteLength);
		Module.HEAP8.set(new Uint8Array(buffer), memptr);
		effect.nativeptr = Core.LoadEffect(memptr, buffer.byteLength);
		Module._free(memptr);
		loadingEffect = null;
		effect._update();
	};

	Module._isPowerOfTwo = function(img) {
		return !(img.width & (img.width-1)) && !(img.height & (img.height-1));
	};
	Module._loadImage = function(path) {
		var effect = loadingEffect;
		var res = effect.resources.find(function(res){return res.path == path});
		if (res) {
			return (res.isLoaded) ? res.image : null;
		}

		var res = {path: path, isLoaded: false, image: null};
		effect.resources.push(res);

		loadResource(effect.baseDir + path, function(image) {
			res.image = image
			res.isLoaded = true;
			effect._update();
		}, effect.onerror);
		return null;
	};
	Module._loadBinary = function(path) {
		var effect = loadingEffect;
		var res = effect.resources.find(function(res){return res.path == path});
		if (res) {
			return (res.isLoaded) ? res.buffer : null;
		}

		var res = {path: path, isLoaded: false, buffer: null};
		effect.resources.push(res);
		
		loadResource(effect.baseDir + path, function(buffer) {
			res.buffer = buffer;
			res.isLoaded = true;
			effect._update();
		}, effect.onerror);
		return null;
	};

	/**
	 * Effekseer Context
	 * @class
	 */
	var Effekseer = function() {
	};

	Effekseer.prototype = {
		/**
		 * Initialize graphics system.
		 * @param {WebGLRenderingContext} webglContext WebGL Context
		 * @param {object} settings Some settings with Effekseer initialization
		 */
		init: function(webglContext, settings) {
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
					squareMaxCount: 8000,
				};
			}

			// Initializes Effekseer core.
			Core.Init(settings.instanceMaxCount, settings.squareMaxCount);
		},
		
		/**
		 * Advance frames.
		 * @param {number=} deltaFrames number of advance frames
		 */
		update: function(deltaFrames) {
			if (!deltaFrames) deltaFrames = 1.0;
			// Update frame
			Core.Update(deltaFrames);
		},
		
		/**
		 * Main rendering.
		 */
		draw: function() {
			// Save WebGL states
			var program = gl.getParameter(gl.CURRENT_PROGRAM);
			
			// Draw the effekseer core
			Core.Draw();
			
			// Restore WebGL states
			gl.useProgram(program);
		},

		/**
		 * Set camera projection from matrix.
		 * @param {array} matrixArray An array that is requred 16 elements
		 */
		setProjectionMatrix: function(matrixArray) {
			var stack = Runtime.stackSave();
			var arrmem = Runtime.stackAlloc(4 * 16);
			Module.HEAPF32.set(matrixArray, arrmem>>2);
			Core.SetProjectionMatrix(arrmem);
			Runtime.stackRestore(stack);
		},
		
		/**
		 * Set camera projection from perspective parameters.
		 * @param {number} fov Field of view in degree
		 * @param {number} aspect Aspect ratio
		 * @param {number} near Distance of near plane
		 * @param {number} aspect Distance of far plane
		 */
		setProjectionPerspective: function(fov, aspect, near, far) {
			Core.SetProjectionPerspective(fov, aspect, near, far);
		},

		/**
		 * Set camera projection from orthographic parameters.
		 * @param {number} width Width coordinate of the view plane
		 * @param {number} height Height coordinate of the view plane
		 * @param {number} near Distance of near plane
		 * @param {number} aspect Distance of far plane
		 */
		setProjectionOrthographic: function(width, height, near, far) {
			Core.SetProjectionOrthographic(width, height, near, far);
		},
		
		/**
		 * Set camera view from matrix.
		 * @param {array} matrixArray An array that is requred 16 elements
		 */
		setCameraMatrix: function(matrixArray) {
			var stack = Runtime.stackSave();
			var arrmem = Runtime.stackAlloc(4 * 16);
			Module.HEAPF32.set(matrixArray, arrmem>>2);
			Core.SetCameraMatrix(arrmem);
			Runtime.stackRestore(stack);
		},
		
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
		setCameraLookAt: function(positionX, positionY, positionZ, targetX, targetY, targetZ, upvecX, upvecY, upvecZ) {
			Core.SetCameraLookAt(positionX, positionY, positionZ, targetX, targetY, targetZ, upvecX, upvecY, upvecZ);
		},

		/**
		 * Set camera view from lookat vector parameters.
		 * @param {object} position camera position
		 * @param {object} target target position
		 * @param {object=} upvec upper vector
		 */
		setCameraLookAtFromVector: function(position, target, upvec) {
			upvecVector = (typeof upvecVector === "object") ? upvecVector : {x:0, y:1, z:0};
			Core.SetCameraLookAt(position.x, position.y, position.z, target.x, target.y, target.z, upvec.x, upvec.y, upvec.z);
		},

		/**
		 * Load the effect data file (and resources).
		 * @param {string} path A URL of effect file (*.efk)
		 * @param {function=} onload A function that is called at loading complete
		 * @param {function=} onerror A function that is called at loading error
		 * @returns {EffekseerEffect} The effect data
		 */
		loadEffect: function(path, onload, onerror) {
			var effect = new EffekseerEffect();
			var dirIndex = path.lastIndexOf("/");

			effect.onload = onload;
			effect.onerror = onerror;

			if (typeof path === "string") {
				effect.baseDir = (dirIndex >= 0) ? path.slice(0, dirIndex + 1) : "";
				loadBinFile(path, function(buffer) {
					effect._load(buffer);
				}, effect.onerror);
			} else if (typeof path === "arraybuffer") {
				var buffer = path;
				effect._load(buffer);
			}
			
			return effect;
		},
		
		/**
		 * Play the specified effect.
		 * @param {EffekseerEffect} effect The loaded effect
		 * @param {number} x X value of location that is emited
		 * @param {number} y Y value of location that is emited
		 * @param {number} z Z value of location that is emited
		 * @returns {EffekseerHandle} The effect handle
		 */
		play: function(effect, x, y, z) {
			if (!effect || !effect.isLoaded) {
				return null;
			}
			if (x === undefined) x = 0;
			if (y === undefined) y = 0;
			if (z === undefined) z = 0;
			var handle = Core.PlayEffect(effect.nativeptr, x, y, z);
			return (handle >= 0) ? new EffekseerHandle(handle) : null;
		},
		
		/**
		 * Stop the all effects.
		 */
		stopAll: function() {
			Core.StopAllEffects();
		},
	
		/**
		 * Set the resource loader function.
		 * @param {function} loader
		 */
		setResourceLoader: function(loader) {
			loadResource = loader;
		}
	};

	return new Effekseer();
})();

// Add support for CommonJS libraries such as browserify.
if (typeof exports !== 'undefined') {
	exports = effekseer;
}
