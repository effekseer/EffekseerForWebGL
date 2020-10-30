
const effekseer = (() => {
  let Module = {};
  let Core = {};
  let _onloadAssembly = () => { }
  let _onerrorAssembly = () => { }
  let _is_runtime_initialized = false;
  let _onRuntimeInitialized = () => {
    // C++ functions
    Core = {
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
      GetDynamicInput: Module.cwrap("EffekseerGetDynamicInput", "number", ["number", "number", "number"]),
      SetDynamicInput: Module.cwrap("EffekseerSetDynamicInput", "void", ["number", "number", "number", "number"]),
      SetPaused: Module.cwrap("EffekseerSetPaused", "void", ["number", "number", "number"]),
      SetShown: Module.cwrap("EffekseerSetShown", "void", ["number", "number", "number"]),
      SetSpeed: Module.cwrap("EffekseerSetSpeed", "void", ["number", "number", "number"]),
      GetRestInstancesCount: Module.cwrap("EffekseerGetRestInstancesCount", "number", ["number"]),      
      IsVertexArrayObjectSupported: Module.cwrap("EffekseerIsVertexArrayObjectSupported", "number", ["number"]),
    };


    Module._isPowerOfTwo = img => {
      return _isImagePowerOfTwo(img);
    };

    Module._loadImage = path => {
      const effect = loadingEffect;
      effect.context._makeContextCurrent();

      var res = effect.resources.find(res => { return res.path == path });
      if (res) {
        return (res.isLoaded) ? res.image : null;
      }

      var res = { path: path, isLoaded: false, image: null, isRequired: true };
      effect.resources.push(res);

      var path = effect.baseDir + path;
      if (effect.redirect) {
        path = effect.redirect(path);
      }

      _loadResource(path, image => {
        res.image = image
        res.isLoaded = true;
        effect._update();
      }, effect.onerror);
      return null;
    };

    Module._loadBinary = (path, isRequired) => {
      const effect = loadingEffect;
      effect.context._makeContextCurrent();

      var res = effect.resources.find(res => { return res.path == path });
      if (res) {
        return (res.isLoaded) ? res.buffer : null;
      }

      var res = { path: path, isLoaded: false, buffer: null, isRequired: isRequired };
      effect.resources.push(res);

      var path = effect.baseDir + path;
      if (effect.redirect) {
        path = effect.redirect(path);
      }

      _loadResource(path, buffer => {
        res.buffer = buffer;
        res.isLoaded = true;
        effect._update();
      }, effect.onerror);
      return null;
    };

    _is_runtime_initialized = true;
    _onloadAssembly();
  };

  const _initalize_wasm = (url) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = "arraybuffer";
    xhr.onload = () => {
      var params = {};
      params.wasmBinary = xhr.response;
      params.onRuntimeInitialized = _onRuntimeInitialized;
      Module = effekseer_native(params);
    };
    xhr.onerror = () => {
      _onerrorAssembly();
    };
    xhr.send(null);
  };

  if (typeof effekseer_native === "undefined") {
    Module = effekseer();
    _onRuntimeInitialized();
  }

  /**
   * A loaded effect data
   * @class
   */
  class EffekseerEffect {
    constructor(context) {
      this.context = context;
      this.nativeptr = 0;
      this.baseDir = "";
      this.isLoaded = false;
      this.scale = 1.0;
      this.resources = [];
      this.main_buffer = null;
    }

    _load(buffer) {
      loadingEffect = this;
      this.main_buffer = buffer;
      const memptr = Module._malloc(buffer.byteLength);
      Module.HEAP8.set(new Uint8Array(buffer), memptr);
      this.nativeptr = Core.LoadEffect(this.context.nativeptr, memptr, buffer.byteLength, this.scale);
      Module._free(memptr);
      loadingEffect = null;
      this._update();
    }

    _reload() {
      loadingEffect = this;
      let buffer = this.main_buffer;
      const memptr = Module._malloc(buffer.byteLength);
      Module.HEAP8.set(new Uint8Array(buffer), memptr);
      Core.ReloadResources(this.context.nativeptr, this.nativeptr, memptr, buffer.byteLength);
      Module._free(memptr);
      loadingEffect = null;
    }

    _update() {
      let loaded = this.nativeptr != 0;
      if (this.resources.length > 0) {
        for (let i = 0; i < this.resources.length; i++) {
          if (!this.resources[i].isLoaded && this.resources[i].isRequired) {
            loaded = false;
            break;
          }
        }
        if (loaded) {
          // glGetIntegerv(GL_ELEMENT_ARRAY_BUFFER_BINDING is wrong with Emscripten (Why?)
          this.context.contextStates.save();
          this._reload();
          this.context.contextStates.restore();
        }
      }
      if (!this.isLoaded && loaded) {
        this.isLoaded = true;
        if (this.onload) this.onload();
      }
    }
  }

  /**
   * A handle that played effect instance.
   * @class
   */
  class EffekseerHandle {
    constructor(context, native) {
      this.context = context;
      this.native = native;
    }

    /**
     * Stop this effect instance.
     */
    stop() {
      Core.StopEffect(this.context.nativeptr, this.native);
    }

    /**
     * Stop the root node of this effect instance.
     */
    stopRoot() {
      Core.StopRoot(this.context.nativeptr, this.native);
    }

    /**
     * if returned false, this effect is end of playing.
     * @property {boolean}
     */
    get exists() {
      return !!Core.Exists(this.context.nativeptr, this.native);
    }

    /**
     * Set the location of this effect instance.
     * @param {number} x X value of location
     * @param {number} y Y value of location
     * @param {number} z Z value of location
     */
    setLocation(x, y, z) {
      Core.SetLocation(this.context.nativeptr, this.native, x, y, z);
    }

    /**
     * Set the rotation of this effect instance.
     * @param {number} x X value of euler angle
     * @param {number} y Y value of euler angle
     * @param {number} z Z value of euler angle
     */
    setRotation(x, y, z) {
      Core.SetRotation(this.context.nativeptr, this.native, x, y, z);
    }

    /**
     * Set the scale of this effect instance.
     * @param {number} x X value of scale factor
     * @param {number} y Y value of scale factor
     * @param {number} z Z value of scale factor
     */
    setScale(x, y, z) {
      Core.SetScale(this.context.nativeptr, this.native, x, y, z);
    }

    /**
     * Set the model matrix of this effect instance.
     * @param {array} matrixArray An array that is requred 16 elements
     */
    setMatrix(matrixArray) {
      const stack = Module.stackSave();
      const arrmem = Module.stackAlloc(4 * 16);
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
    setTargetLocation(x, y, z) {
      Core.SetTargetLocation(this.context.nativeptr, this.native, x, y, z);
    }

    /**
     * get a dynamic parameter, which changes effect parameters dynamically while playing
     * @param {number} index slot index
     * @returns {number} value
     */
    getDynamicInput(index) {
      return Core.GetDynamicInput(this.context.nativeptr, this.native, index);
    }

    /**
     * specfiy a dynamic parameter, which changes effect parameters dynamically while playing
     * @param {number} index slot index
     * @param {number} value value
     */
    setDynamicInput(index, value) {
      Core.SetDynamicInput(this.context.nativeptr, this.native, index);
    }

    /**
     * Set the paused flag of this effect instance.
     * if specified true, this effect playing will not advance.
     * @param {boolean} paused Paused flag
     */
    setPaused(paused) {
      Core.SetPaused(this.context.nativeptr, this.native, paused);
    }

    /**
     * Set the shown flag of this effect instance.
     * if specified false, this effect will be invisible.
     * @param {boolean} shown Shown flag
     */
    setShown(shown) {
      Core.SetShown(this.context.nativeptr, this.native, shown);
    }

    /**
     * Set playing speed of this effect.
     * @param {number} speed Speed ratio
     */
    setSpeed(speed) {
      Core.SetSpeed(this.context.nativeptr, this.native, speed);
    }
  }

  let _isImagePowerOfTwo = (image) => {
    return !(image.width & (image.width - 1)) && !(image.height & (image.height - 1));
  };

  let calcNextPowerOfTwo = (v) => {
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
  }

  let _convertPowerOfTwoImage = (image) => {
    if (!_isImagePowerOfTwo(image)) {
      var canvas = document.createElement("canvas");
      canvas.width = calcNextPowerOfTwo(image.width);
      canvas.height = calcNextPowerOfTwo(image.height);
      var context2d = canvas.getContext("2d");
      context2d.drawImage(image, 0, 0, image.width, image.height, 0, 0, canvas.width, canvas.height);
      image = canvas;
    }

    return image;
  };

  const _loadBinFile = (url, onload, onerror) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = "arraybuffer";
    xhr.onload = () => {
      onload(xhr.response);
    };
    xhr.onerror = () => {
      if (!(typeof onerror === "undefined")) onerror('not found', url);
    };
    xhr.send(null);
  };

  let _loadResource = (path, onload, onerror) => {
    splitted_path = path.split('?');
    var ext_path = path;
    if(splitted_path.length >= 2)
    {
      ext_path = splitted_path[0];
    }

    const extindex = ext_path.lastIndexOf(".");
    let ext = (extindex >= 0) ? ext_path.slice(extindex) : "";
    if (ext == ".png" || ext == ".jpg") {
      const image = new Image();
      image.onload = () => {
        let converted_image = _convertPowerOfTwoImage(image);
        onload(converted_image);
      };
      image.onerror = () => {
        if (!(typeof onerror === "undefined")) onerror('not found', path);
      };

      image.crossOrigin = "use-credentials";
      image.src = path;
    } else {
      _loadBinFile(path, buffer => {
        onload(buffer);
      }, onerror);
    }
  };

  var loadingEffect = null;

  class ContextStates {
    constructor(gl) {
      this.restore_texture_slot_max = 8;
      this.gl = gl;
      this.ext_vao = null;
      this.isWebGL2VAOEnabled = false;
      this.effekseer_vao = null;
      this.current_vao = null;
      this.current_vbo = null;
      this.current_ibo = null;
      this.current_textures = [];
      this.current_textures.length = this.restore_texture_slot_max;
      this.current_active_texture_id = null;

      this.ext_vao = gl.getExtension('OES_vertex_array_object');
      if (this.ext_vao != null) {
        this.effekseer_vao = this.ext_vao.createVertexArrayOES();
      }
      else if ('createVertexArray' in this.gl) {
        this.isWebGL2VAOEnabled = true;
        this.effekseer_vao = this.gl.createVertexArray();
      }
    }

    save() {
      // glGetIntegerv(GL_ELEMENT_ARRAY_BUFFER_BINDING) is wrong with Emscripten (Why?)
      // glGetIntegerv(GL_TEXTURE_BINDING_2D) is wrong with Emscripten (Why?)

      this.current_vbo = this.gl.getParameter(this.gl.ARRAY_BUFFER_BINDING);
      this.current_ibo = this.gl.getParameter(this.gl.ELEMENT_ARRAY_BUFFER_BINDING);
      if (this.ext_vao != null) {
        this.current_vao = this.gl.getParameter(this.ext_vao.VERTEX_ARRAY_BINDING_OES);
        this.ext_vao.bindVertexArrayOES(this.effekseer_vao);
      }
      else if (this.isWebGL2VAOEnabled) {
        this.current_vao = this.gl.getParameter(this.gl.VERTEX_ARRAY_BINDING);
        this.gl.bindVertexArray(this.effekseer_vao);
      }

      this.current_active_texture_id = gl.getParameter(gl.ACTIVE_TEXTURE);

      for(var i = 0; i < this.restore_texture_slot_max; i++)
      {
        this.gl.activeTexture(this.gl.TEXTURE0 + i);
        this.current_textures[i] = gl.getParameter(gl.TEXTURE_BINDING_2D);
      }
    }

    restore() {
      for(var i = 0; i < this.restore_texture_slot_max; i++)
      {
        this.gl.activeTexture(this.gl.TEXTURE0 + i);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.current_textures[i]);
      }
      this.gl.activeTexture(this.current_active_texture_id);

      if (this.ext_vao != null) {
        this.ext_vao.bindVertexArrayOES(this.current_vao);
      }
      else if (this.isWebGL2VAOEnabled) {
        this.gl.bindVertexArray(this.current_vao);
      }

      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.current_vbo);
      this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.current_ibo);
    }
  }

  class EffekseerContext {

    _loadBinary_with_effect_cache(path, effect, onload, onerror) {
      var res = effect.resources.find(res => { return res.path == path });
      if (res) {
        onload();
        return (res.isLoaded) ? res.buffer : null;
      }

      var res = { path: path, isLoaded: false, buffer: null, isRequired: true };
      effect.resources.push(res);

      _loadBinFile(effect.baseDir + path, buffer => {
        res.buffer = buffer;
        res.isLoaded = true;
        onload(buffer);
      }, onerror);
      return null;
    };

    _makeContextCurrent() {
      Module.GL.makeContextCurrent(this.ctx);
    }

    /**
     * Initialize graphics system.
     * @param {WebGLRenderingContext} webglContext WebGL Context
     * @param {object} settings Some settings with Effekseer initialization
     */
    init(webglContext, settings) {
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
          squareMaxCount: 10000,
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
    update(deltaFrames) {
      if (!deltaFrames) deltaFrames = 1.0;
      // Update frame
      Core.Update(this.nativeptr, deltaFrames);
    }

    beginUpdate() {
      Core.BeginUpdate(this.nativeptr);
    }

    endUpdate() {
      Core.EndUpdate(this.nativeptr);
    }

    updateHandle(handle, deltaFrames) {
      Core.UpdateHandle(this.nativeptr, handle.native, deltaFrames);
    }

    /**
     * Main rendering.
     */
    draw() {
      this._makeContextCurrent();

      // Save WebGL states
      const program = this.gl.getParameter(gl.CURRENT_PROGRAM);

      // Draw the effekseer core
      this.contextStates.save();
      Core.Draw(this.nativeptr);
      this.contextStates.restore();

      // Restore WebGL states
      this.gl.useProgram(program);
    }

    beginDraw() {
      this.contextStates.save();
      Core.BeginDraw(this.nativeptr);
    }

    endDraw() {
      Core.EndDraw(this.nativeptr);
      this.contextStates.restore();
    }

    drawHandle(handle) {
      Core.DrawHandle(this.nativeptr, handle.native);
    }

    /**
     * Set camera projection from matrix.
     * @param {array} matrixArray An array that is requred 16 elements
     */
    setProjectionMatrix(matrixArray) {
      const stack = Module.stackSave();
      const arrmem = Module.stackAlloc(4 * 16);
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
    setProjectionPerspective(fov, aspect, near, far) {
      Core.SetProjectionPerspective(this.nativeptr, fov, aspect, near, far);
    }

    /**
     * Set camera projection from orthographic parameters.
     * @param {number} width Width coordinate of the view plane
     * @param {number} height Height coordinate of the view plane
     * @param {number} near Distance of near plane
     * @param {number} aspect Distance of far plane
     */
    setProjectionOrthographic(width, height, near, far) {
      Core.SetProjectionOrthographic(this.nativeptr, width, height, near, far);
    }

    /**
     * Set camera view from matrix.
     * @param {array} matrixArray An array that is requred 16 elements
     */
    setCameraMatrix(matrixArray) {
      const stack = Module.stackSave();
      const arrmem = Module.stackAlloc(4 * 16);
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
    setCameraLookAt(
      positionX,
      positionY,
      positionZ,
      targetX,
      targetY,
      targetZ,
      upvecX,
      upvecY,
      upvecZ
    ) {
      Core.SetCameraLookAt(this.nativeptr, positionX, positionY, positionZ, targetX, targetY, targetZ, upvecX, upvecY, upvecZ);
    }

    /**
     * Set camera view from lookat vector parameters.
     * @param {object} position camera position
     * @param {object} target target position
     * @param {object=} upvec upper vector
     */
    setCameraLookAtFromVector(position, target, upvec) {
      upvecVector = (typeof upvecVector === "object") ? upvecVector : { x: 0, y: 1, z: 0 };
      Core.SetCameraLookAt(this.nativeptr, position.x, position.y, position.z, target.x, target.y, target.z, upvec.x, upvec.y, upvec.z);
    }

    /**
     * Load the effect data file (and resources).
     * @param {string} path A URL of effect file (*.efk)
     * @param {number} scale A magnification rate for the effect. The effect is loaded magnificating with this specified number.
     * @param {function=} onload A function that is called at loading complete
     * @param {function=} onerror A function that is called at loading error. First argument is a message. Second argument is an url.
     * @param {function=} redirect A function to redirect a path. First argument is an url and return redirected url.
     * @returns {EffekseerEffect} The effect data
     */
    loadEffect(path, scale = 1.0, onload, onerror, redirect) {
      this._makeContextCurrent();

      const effect = new EffekseerEffect(this);
      const dirIndex = path.lastIndexOf("/");

      if (typeof (scale) === "function") {
        console.log("Error : second arguments is number from version 1.5");
        effect.scale = 1.0;
        effect.onload = scale;
        effect.onerror = onload;
        effect.redirect = redirect;
      }
      else {
        effect.scale = scale;
        effect.onload = onload;
        effect.onerror = onerror;
        effect.redirect = redirect;
      }

      if (typeof path === "string") {
        effect.baseDir = (dirIndex >= 0) ? path.slice(0, dirIndex + 1) : "";
        _loadBinFile(path, buffer => {
          effect._load(buffer);
        }, effect.onerror);
      } else if (typeof path === "arraybuffer") {
        const buffer = path;
        effect._load(buffer);
      }

      return effect;
    }

    /**
     * Release the specified effect. Don't touch the instance of effect after released.
     * @param {EffekseerEffect} effect The loaded effect
     */
    releaseEffect(effect) {
      this._makeContextCurrent();

      if (effect == null) {
        console.warn("the effect is null.")
        return;
      }

      if (!effect.isLoaded) {
        console.warn("the effect has not be loaded yet.")
        return;
      }

      if (effect.nativeptr == null) {
        console.warn("the effect has been released.")
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
    play(effect, x, y, z) {
      if (!effect || !effect.isLoaded) {
        return null;
      }
      if (x === undefined) x = 0;
      if (y === undefined) y = 0;
      if (z === undefined) z = 0;
      const handle = Core.PlayEffect(this.nativeptr, effect.nativeptr, x, y, z);
      return (handle >= 0) ? new EffekseerHandle(this, handle) : null;
    }

    /**
     * Stop the all effects.
     */
    stopAll() {
      Core.StopAllEffects(this.nativeptr);
    }

    /**
     * Set the resource loader function.
     * @param {function} loader
     */
    setResourceLoader(loader) {
      _loadResource = loader;
    }

    /**
     * Gets the number of remaining allocated instances.
     */
    getRestInstancesCount() {
      return Core.GetRestInstancesCount(this.nativeptr);
    }

    /**
     * Get whether VAO is supported
     */
    isVertexArrayObjectSupported() {
      return Core.IsVertexArrayObjectSupported(this.nativeptr);
    }
  }

  /**
   * Effekseer Context
   * @class
   */
  class Effekseer {
    /**
    * Initialize Effekseer.js.
    * This function must be called at first if use WebAssembly
    * @param {string} path A file of webassembply
    * @param {function=} onload A function that is called at loading complete
    * @param {function=} onerror A function that is called at loading error.
    */
    initRuntime(path, onload, onerror) {
      if (typeof effekseer_native === "undefined") {
        onload();
        return;
      }

      _onloadAssembly = onload;
      _onerrorAssembly = onerror;
      _initalize_wasm(path);
    }

    /**
     * Create a context to render in multiple scenes
     * @returns {EffekseerContext} context
     */
    createContext() {
      if (!_is_runtime_initialized) {
        return null;
      }

      return new EffekseerContext();
    }

    /**
    * Release specified context. After that, don't touch a context
    * @param {EffekseerContext} context context
    */
    releaseContext(context) {
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
    init(webglContext, settings) {
      console.warn('deprecated : please use through createContext.');
      this.defaultContext = new EffekseerContext();
      this.defaultContext.init(webglContext, settings);
    }

    /**
     * Advance frames.
     * @param {number=} deltaFrames number of advance frames
     */
    update(deltaFrames) {
      console.warn('deprecated : please use through createContext.');
      this.defaultContext.update(deltaFrames);
    }

    beginUpdate() {
      console.warn('deprecated : please use through createContext.');
      this.defaultContext.beginUpdate();
    }

    endUpdate() {
      console.warn('deprecated : please use through createContext.');
      this.defaultContext.endUpdate();
    }

    updateHandle(handle, deltaFrames) {
      console.warn('deprecated : please use through createContext.');
      this.defaultContext.updateHandle(handle, deltaFrames);
    }

    /**
     * Main rendering.
     */
    draw() {
      console.warn('deprecated : please use through createContext.');
      this.defaultContext.draw();
    }

    beginDraw() {
      console.warn('deprecated : please use through createContext.');
      this.defaultContext.beginDraw();
    }

    endDraw() {
      console.warn('deprecated : please use through createContext.');
      this.defaultContext.endDraw();
    }

    drawHandle(handle) {
      console.warn('deprecated : please use through createContext.');
      this.defaultContext.drawHandle(handle);
    }

    /**
     * Set camera projection from matrix.
     * @param {array} matrixArray An array that is requred 16 elements
     */
    setProjectionMatrix(matrixArray) {
      console.warn('deprecated : please use through createContext.');
      this.defaultContext.setProjectionMatrix(matrixArray);
    }

    /**
     * Set camera projection from perspective parameters.
     * @param {number} fov Field of view in degree
     * @param {number} aspect Aspect ratio
     * @param {number} near Distance of near plane
     * @param {number} aspect Distance of far plane
     */
    setProjectionPerspective(fov, aspect, near, far) {
      console.warn('deprecated : please use through createContext.');
      this.defaultContext.SetProjectionPerspective(fov, aspect, near, far);
    }

    /**
     * Set camera projection from orthographic parameters.
     * @param {number} width Width coordinate of the view plane
     * @param {number} height Height coordinate of the view plane
     * @param {number} near Distance of near plane
     * @param {number} aspect Distance of far plane
     */
    setProjectionOrthographic(width, height, near, far) {
      console.warn('deprecated : please use through createContext.');
      this.defaultContext.setProjectionOrthographic(width, height, near, far);
    }

    /**
     * Set camera view from matrix.
     * @param {array} matrixArray An array that is requred 16 elements
     */
    setCameraMatrix(matrixArray) {
      console.warn('deprecated : please use through createContext.');
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
    setCameraLookAt(
      positionX,
      positionY,
      positionZ,
      targetX,
      targetY,
      targetZ,
      upvecX,
      upvecY,
      upvecZ
    ) {
      console.warn('deprecated : please use through createContext.');
      this.defaultContext.setCameraLookAt(positionX, positionY, positionZ, targetX, targetY, targetZ, upvecX, upvecY, upvecZ);
    }

    /**
     * Set camera view from lookat vector parameters.
     * @param {object} position camera position
     * @param {object} target target position
     * @param {object=} upvec upper vector
     */
    setCameraLookAtFromVector(position, target, upvec) {
      console.warn('deprecated : please use through createContext.');
      this.defaultContext.setCameraLookAtFromVector(position, target, upvec);
    }

    /**
     * Load the effect data file (and resources).
     * @param {string} path A URL of effect file (*.efk)
     * @param {number} scale A magnification rate for the effect. The effect is loaded magnificating with this specified number.
     * @param {function=} onload A function that is called at loading complete
     * @param {function=} onerror A function that is called at loading error. First argument is a message. Second argument is an url.
     * @returns {EffekseerEffect} The effect data
     */
    loadEffect(path, scale = 1.0, onload, onerror) {
      console.warn('deprecated : please use through createContext.');
      return this.defaultContext.loadEffect(path, scale, onload, onerror);
    }

    /**
     * Release the specified effect. Don't touch the instance of effect after released.
     * @param {EffekseerEffect} effect The loaded effect
     */
    releaseEffect(effect) {
      console.warn('deprecated : please use through createContext.');
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
    play(effect, x, y, z) {
      console.warn('deprecated : please use through createContext.');
      return this.defaultContext.play(effect, x, y, z);
    }

    /**
     * Stop the all effects.
     */
    stopAll() {
      console.warn('deprecated : please use through createContext.');
      this.defaultContext.stopAll();
    }

    /**
     * Set the resource loader function.
     * @param {function} loader
     */
    setResourceLoader(loader) {
      console.warn('deprecated : please use through createContext.');
      this.defaultContext.setResourceLoader(loader);
    }

    /**
     * Get whether VAO is supported
     */
    isVertexArrayObjectSupported() {
      console.warn('deprecated : please use through createContext.');
      return this.defaultContext.isVertexArrayObjectSupported();
    }
  }

  return new Effekseer();
})();

// Add support for CommonJS libraries such as browserify.
if (typeof exports !== 'undefined') {
  exports = effekseer;
}
