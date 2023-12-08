
const effekseer = (() => {
  let Module = {};
  let Core = {};
  let _imageCrossOrigin = "";
  let _onloadAssembly = () => { }
  let _onerrorAssembly = () => { }
  let _is_runtime_initialized = false;
  let _onRuntimeInitialized = () => {
    // C++ functions
    Core = {
      Init: Module.cwrap("EffekseerInit", "number", ["number", "number", "number", "number"]),
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
      SetFrame: Module.cwrap("EffekseerSetFrame", "void", ["number", "number", "number"]),
      SetLocation: Module.cwrap("EffekseerSetLocation", "void", ["number", "number", "number", "number", "number"]),
      SetRotation: Module.cwrap("EffekseerSetRotation", "void", ["number", "number", "number", "number", "number"]),
      SetScale: Module.cwrap("EffekseerSetScale", "void", ["number", "number", "number", "number", "number"]),
      SetMatrix: Module.cwrap("EffekseerSetMatrix", "void", ["number", "number", "number"]),
      SetAllColor: Module.cwrap("EffekseerSetAllColor", "void", ["number", "number", "number", "number", "number", "number"]),
      SetTargetLocation: Module.cwrap("EffekseerSetTargetLocation", "void", ["number", "number", "number", "number", "number"]),
      GetDynamicInput: Module.cwrap("EffekseerGetDynamicInput", "number", ["number", "number", "number"]),
      SetDynamicInput: Module.cwrap("EffekseerSetDynamicInput", "void", ["number", "number", "number", "number"]),
      SendTrigger: Module.cwrap("EffekseerSendTrigger", "void", ["number", "number", "number"]),
      SetPaused: Module.cwrap("EffekseerSetPaused", "void", ["number", "number", "number"]),
      SetShown: Module.cwrap("EffekseerSetShown", "void", ["number", "number", "number"]),
      SetSpeed: Module.cwrap("EffekseerSetSpeed", "void", ["number", "number", "number"]),
      SetRandomSeed: Module.cwrap("EffekseerSetRandomSeed", "void", ["number", "number", "number"]),
      GetRestInstancesCount: Module.cwrap("EffekseerGetRestInstancesCount", "number", ["number"]),
      GetUpdateTime: Module.cwrap("EffekseerGetUpdateTime", "number", ["number"]),
      GetDrawTime: Module.cwrap("EffekseerGetDrawTime", "number", ["number"]),
      IsVertexArrayObjectSupported: Module.cwrap("EffekseerIsVertexArrayObjectSupported", "number", ["number"]),
      SetRestorationOfStatesFlag: Module.cwrap("EffekseerSetRestorationOfStatesFlag", "void", ["number", "number"]),
      CaptureBackground: Module.cwrap("EffekseerCaptureBackground", "void", ["number", "number", "number", "number", "number"]),
      ResetBackground: Module.cwrap("EffekseerResetBackground", "void", ["number"]),
      SetLogEnabled: Module.cwrap("EffekseerSetLogEnabled", "void", ["number"]),
    };

    Module.resourcesMap = {};

    Module._isPowerOfTwo = img => {
      return _isImagePowerOfTwo(img);
    };

    Module._loadImage = path => {
      const effect = loadingEffect;
      effect.context._makeContextCurrent();

      {
        const res = effect.resources.find(res => { return res.path == path });
        if (res) {
          return (res.isLoaded) ? res.image : null;
        }
      }

      const res = { path: path, isLoaded: false, image: null, isRequired: true };
      effect.resources.push(res);

      var path = effect.baseDir + path;
      if (effect.redirect) {
        path = effect.redirect(path);
      }

      {
        const arrayBuffer = Module.resourcesMap[path];
        if (arrayBuffer != null) {
          const arrayBufferView = new Uint8Array( arrayBuffer );
          Promise.resolve(new Blob([arrayBufferView], { type: 'image/png' }))
          .then(blob => {
            return Promise.resolve(URL.createObjectURL(blob))
          })
          .then(url => {
            const img = new Image();
            img.onload = () => {
              res.image = img;
              res.isLoaded = true;
              effect._update();
            };
            img.src = url;
          });
        } else {
          _loadResource(path, image => {
            res.image = image
            res.isLoaded = true;
            effect._update();
          }, effect.onerror);
        }
      }
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

      const arrayBuffer = Module.resourcesMap[path];
      if (arrayBuffer != null) {
          res.buffer = arrayBuffer;
          res.isLoaded = true;
          effect._update();
      } else {
        _loadResource(path, buffer => {
          res.buffer = buffer;
          res.isLoaded = true;
          effect._update();
        }, effect.onerror);
      }
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
      // params.onRuntimeInitialized = _onRuntimeInitialized;
      effekseer_native(params).then(function (module) {
        Module = module;
        _onRuntimeInitialized();
      });
    };
    xhr.onerror = () => {
      _onerrorAssembly();
    };
    xhr.send(null);
  };

  if (typeof effekseer_native === "undefined") {
    moduleOrPromise = effekseer();

    if (moduleOrPromise instanceof Promise) {
      moduleOrPromise.then(function (module) {
        Module = module;
        _onRuntimeInitialized();
      });
    }
    else {
      Module = moduleOrPromise;
      _onRuntimeInitialized();
    }
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

    /**
     * Load Effect from arraybuffer of .efkpkg file
     * @param {ArrayBuffer} buffer a ArrayBuffer of the .efkpkg file
     * @param {Object} Unzip a Unzip object
     */
    async _loadFromPackage(buffer, Unzip) {
      const unzip = new Unzip(new Uint8Array(buffer))
      const meta_buffer = unzip.decompress('metafile.json')
      const textDecoder = new TextDecoder();
      const text = textDecoder.decode(meta_buffer);
      const json = JSON.parse(text);

      let efkFile;
      const dependencies = [];
      for (let key in json.files) {
        const val = json.files[key];
        if (val.type === 'Effect') {
          efkFile = key;
          Array.prototype.push.apply(dependencies, val.dependencies);
        }
      }

      for (let dep of dependencies) {
        // const relative_path = json.files[dep].relative_path;
        const buffer = unzip.decompress(dep)
        Module.resourcesMap[dep] = buffer.buffer;
      }

      const efk_buffer = unzip.decompress(efkFile);
      this._load(efk_buffer.buffer);
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
          this.context._makeContextCurrent();
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
     * Set frame of this effect instance.
     * @param {number} frame Frame of this effect instance.
     */
    setFrame(frame) {
      Core.SetFrame(this.context.nativeptr, this.native, frame);
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
     * Set the color of this effect instance.
     * @param {number} r R channel value of color
     * @param {number} g G channel value of color
     * @param {number} b B channel value of color
     * @param {number} a A channel value of color
     */
    setAllColor(r, g, b, a) {
      Core.SetAllColor(this.context.nativeptr, this.native, r, g, b, a);
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
      Core.SetDynamicInput(this.context.nativeptr, this.native, index, value);
    }
    
    /**
     * Sends the specified trigger to the currently playing effect
     * @param {number} index trigger index
     */
    sendTrigger(index) {
      Core.SendTrigger(this.context.nativeptr, this.native, index);
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

    /**
     * Set random seed of this effect.
     * @param {number} seed Random seed
     */
    setRandomSeed(seed) {
      Core.SetRandomSeed(this.context.nativeptr, this.native, seed);
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
    if (splitted_path.length >= 2) {
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

      image.crossOrigin = _imageCrossOrigin;
      image.src = path;
    } else if (ext == ".tga") {
      if (!(typeof onerror === "undefined")) onerror('not supported', path);
    }
    else {
      _loadBinFile(path, buffer => {
        onload(buffer);
      }, onerror);
    }
  };

  var loadingEffect = null;

  class ContextStates {
    constructor(gl) {
      this.restore_texture_slot_max = 8;
      this._gl = gl;
      this.ext_vao = null;
      this.isWebGL2VAOEnabled = false;
      this.effekseer_vao = null;
      this.current_vao = null;
      this.current_vbo = null;
      this.current_ibo = null;
      this.current_textures = [];
      this.current_textures.length = this.restore_texture_slot_max;
      this.current_active_texture_id = null;

      this.ext_vao = this._gl.getExtension('OES_vertex_array_object');
      let vao = null;
      if (this.ext_vao != null) {
        vao = this.ext_vao.createVertexArrayOES();
      }
      else if ('createVertexArray' in this._gl) {
        this.isWebGL2VAOEnabled = true;
        vao = this._gl.createVertexArray();
      }
      if (vao) {
        let GL = Module.GL;
        let id = GL.getNewId(GL.vaos);
        vao.name = id;
        GL.vaos[id] = vao;
        this.effekseer_vao = vao;
      }
    }

    release() {
      if (this.effekseer_vao) {
        if (this.ext_vao) {
          this.ext_vao.deleteVertexArrayOES(this.effekseer_vao);
        } else if (this.isWebGL2VAOEnabled) {
          this._gl.deleteVertexArray(this.effekseer_vao);
        }

        this.effekseer_vao = null;
      }

      this._gl = null;
    }

    save() {
      // glGetIntegerv(GL_ELEMENT_ARRAY_BUFFER_BINDING) is wrong with Emscripten (Why?)
      // glGetIntegerv(GL_TEXTURE_BINDING_2D) is wrong with Emscripten (Why?)

      this.current_vbo = this._gl.getParameter(this._gl.ARRAY_BUFFER_BINDING);
      this.current_ibo = this._gl.getParameter(this._gl.ELEMENT_ARRAY_BUFFER_BINDING);
      if (this.ext_vao != null) {
        this.current_vao = this._gl.getParameter(this.ext_vao.VERTEX_ARRAY_BINDING_OES);
        this.ext_vao.bindVertexArrayOES(this.effekseer_vao);
      }
      else if (this.isWebGL2VAOEnabled) {
        this.current_vao = this._gl.getParameter(this._gl.VERTEX_ARRAY_BINDING);
        this._gl.bindVertexArray(this.effekseer_vao);
      }

      this.current_active_texture_id = this._gl.getParameter(this._gl.ACTIVE_TEXTURE);

      for (var i = 0; i < this.restore_texture_slot_max; i++) {
        this._gl.activeTexture(this._gl.TEXTURE0 + i);
        this.current_textures[i] = this._gl.getParameter(this._gl.TEXTURE_BINDING_2D);
      }
    }

    restore() {
      for (var i = 0; i < this.restore_texture_slot_max; i++) {
        this._gl.activeTexture(this._gl.TEXTURE0 + i);
        this._gl.bindTexture(this._gl.TEXTURE_2D, this.current_textures[i]);
      }
      this._gl.activeTexture(this.current_active_texture_id);

      if (this.ext_vao != null) {
        this.ext_vao.bindVertexArrayOES(this.current_vao);
      }
      else if (this.isWebGL2VAOEnabled) {
        this._gl.bindVertexArray(this.current_vao);
      }

      this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this.current_vbo);
      this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, this.current_ibo);
    }

    disableVAO() {
      if (this.ext_vao != null) {
        this.ext_vao.bindVertexArrayOES(null);
      }
      else if (this.isWebGL2VAOEnabled) {
        this._gl.bindVertexArray(null);
      }
    }
  }

  class EffekseerContext {


    _makeContextCurrent() {
      Module.GL.makeContextCurrent(this.ctx);
    }

    /**
     * Initialize graphics system.
     * @param {WebGLRenderingContext} webglContext WebGL Context
     * @param {object} settings Some settings with Effekseer initialization
     */
    init(webglContext, settings) {
      this._gl = webglContext;
      this.contextStates = new ContextStates(this._gl);

      var instanceMaxCount = 4000;
      var squareMaxCount = 10000;
      var enableExtensionsByDefault = true;
      var enablePremultipliedAlpha = false;

      window.gl = this._gl;
      
      if (settings) {
        if ("instanceMaxCount" in settings) {
          instanceMaxCount = settings.instanceMaxCount;
        }
        if ("squareMaxCount" in settings) {
          squareMaxCount = settings.squareMaxCount;
        }
        if ("enableExtensionsByDefault" in settings) {
          enableExtensionsByDefault = settings.enableExtensionsByDefault;
        }
        if ("enablePremultipliedAlpha" in settings) {
          enablePremultipliedAlpha = settings.enablePremultipliedAlpha;
        }
        if ("enableTimerQuery" in settings && settings.enableTimerQuery) {
          window.ext_timer = window.gl.getExtension("EXT_disjoint_timer_query_webgl2");
          this._availableList = [];
          this._usingList = [];
          this._drawCount = 0;
          this._accumulatedDrawTime = 0;

          if ("onTimerQueryReport" in settings) {
            this._onTimerQueryReport = settings.onTimerQueryReport;
          }
          if ("timerQueryReportIntervalCount" in settings) {
            this._timerQueryReportIntervalCount = settings.timerQueryReportIntervalCount;
          } else {
            this._timerQueryReportIntervalCount = 300;
          }
        }
      }


      // Setup native OpenGL context
      this.ctx = Module.GL.registerContext(webglContext, {
        majorVersion: 1, minorVersion: 0, enableExtensionsByDefault: enableExtensionsByDefault
      });
      this._makeContextCurrent();

      this._restorationOfStatesFlag = true;

      // Initializes Effekseer core.
      this.contextStates.save();
      this.nativeptr = Core.Init(instanceMaxCount, squareMaxCount, enableExtensionsByDefault, enablePremultipliedAlpha);
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
      const availableQuery = this._startQuery();

      this._makeContextCurrent();

      let program = null;

      if (this._restorationOfStatesFlag) {
        // Save WebGL states
        program = this._gl.getParameter(this._gl.CURRENT_PROGRAM);

        // Draw the effekseer core
        this.contextStates.save();
      }
      else {
        // avoid to make external vao dirtied.
        this.contextStates.disableVAO();
      }
      Core.Draw(this.nativeptr);

      if (this._restorationOfStatesFlag) {
        this.contextStates.restore();

        // Restore WebGL states
        this._gl.useProgram(program);
      }

      this._endQuery(availableQuery);
    }

    _startQuery() {
      if (window.ext_timer != null) {
        // Begin draw time query
        const availableQuery = this._availableList.length ? this._availableList.shift() : this._gl.createQuery();
        this._gl.beginQuery(window.ext_timer.TIME_ELAPSED_EXT, availableQuery);

        return availableQuery;
      }
    }

    _endQuery(availableQuery) {
      if (window.ext_timer != null) {
        // End draw time query
        this._gl.endQuery(window.ext_timer.TIME_ELAPSED_EXT);
        this._usingList.push(availableQuery);

        // Get draw time query
        const disjoint = this._gl.getParameter(window.ext_timer.GPU_DISJOINT_EXT);
        if (disjoint) {
          this._usingList.forEach(query => this._gl.deleteQuery(query));
        } else {
          const usingQuery = this._usingList.length ? this._usingList[0] : null;
          if (usingQuery) {
            const resultAvailable = this._gl.getQueryParameter(usingQuery, this._gl.QUERY_RESULT_AVAILABLE);
            if (resultAvailable) {
              const result = this._gl.getQueryParameter(usingQuery, this._gl.QUERY_RESULT);
              this._accumulatedDrawTime += result;
              if (this._drawCount >= this._timerQueryReportIntervalCount) {
                const averageDrawTime = this._accumulatedDrawTime / this._drawCount;
                this._drawCount = 0;
                this._accumulatedDrawTime = 0;
                if (this._onTimerQueryReport != null) {
                  this._onTimerQueryReport(averageDrawTime);
                }
              }
              this._drawCount++;
              this._availableList.push(this._usingList.shift());
            }
          }
        }
      }
    }

    beginDraw() {
      if (this._restorationOfStatesFlag) {
        this.contextStates.save();
      }
      else {
        // avoid to make external vao dirtied.
        this.contextStates.disableVAO();
      }

      Core.BeginDraw(this.nativeptr);
    }

    endDraw() {
      Core.EndDraw(this.nativeptr);

      if (this._restorationOfStatesFlag) {
        this.contextStates.restore();
      }
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
     * @param {string|ArrayBuffer} data A URL/ArrayBuffer of effect file (*.efk)
     * @param {number} scale A magnification rate for the effect. The effect is loaded magnificating with this specified number.
     * @param {function=} onload A function that is called at loading complete
     * @param {function=} onerror A function that is called at loading error. First argument is a message. Second argument is an url.
     * @param {function=} redirect A function to redirect a path. First argument is an url and return redirected url.
     * @returns {EffekseerEffect} The effect data
     */
    loadEffect(data, scale = 1.0, onload, onerror, redirect) {
      this._makeContextCurrent();

      const effect = new EffekseerEffect(this);

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

      if (typeof data === "string") {
        const dirIndex = data.lastIndexOf("/");
        effect.baseDir = (dirIndex >= 0) ? data.slice(0, dirIndex + 1) : "";
        _loadBinFile(data, buffer => {
          effect._load(buffer);
        }, effect.onerror);
      } else if (data instanceof ArrayBuffer) {
        const buffer = data;
        effect._load(buffer);
      }

      return effect;
    }

    /**
     * Load the effect package file (resources included in the package).
     * @param {string|ArrayBuffer} data A URL/ArrayBuffer of effect package file (*.efkpkg)
     * @param {Object} Unzip a Unzip object
     * @param {number} scale A magnification rate for the effect. The effect is loaded magnificating with this specified number.
     * @param {function=} onload A function that is called at loading complete
     * @param {function=} onerror A function that is called at loading error. First argument is a message. Second argument is an url.
     * @returns {EffekseerEffect} The effect data
     */
    loadEffectPackage(data, Unzip, scale = 1.0, onload, onerror) {
      if (Unzip == null)
      this._makeContextCurrent();

      const effect = new EffekseerEffect(this);
      effect.scale = scale;
      effect.onload = onload;
      effect.onerror = onerror;

      if (typeof data === "string") {
        const dirIndex = data.lastIndexOf("/");
        effect.baseDir = (dirIndex >= 0) ? data.slice(0, dirIndex + 1) : "";
        _loadBinFile(data, buffer => {
          effect._loadFromPackage(buffer, Unzip);
        }, effect.onerror);
      } else if (data instanceof ArrayBuffer) {
        const buffer = data;
        effect._loadFromPackage(buffer, Unzip);
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
     * Gets a time when updating
     */
    getUpdateTime() {
      return Core.GetUpdateTime(this.nativeptr);
    }

    /**
     * Gets a time when drawing
     */
    getDrawTime() {
      return Core.GetDrawTime(this.nativeptr);
    }

    /**
     * Get whether VAO is supported
     */
    isVertexArrayObjectSupported() {
      return Core.IsVertexArrayObjectSupported(this.nativeptr);
    }

    /**
     * Set the flag whether the library restores OpenGL states 
     * if specified true, it makes slow.
     * if specified false, You need to restore OpenGL states by yourself
     * it must be called after init
     * @param {boolean} flag
     */
    setRestorationOfStatesFlag(flag) {
      this._restorationOfStatesFlag = flag;
      Core.SetRestorationOfStatesFlag(this.nativeptr, flag);
    }

    /**
     * Capture current frame buffer and set the image as a background
     * @param {number} x captured image's x offset
     * @param {number} y captured image's y offset
     * @param {number} width captured image's width
     * @param {number} height captured image's height
     */
    captureBackground(x, y, width, height) {
      return Core.CaptureBackground(this.nativeptr, x, y, width, height);
    }

    /**
     * Reset background
     */
    resetBackground() {
      return Core.ResetBackground(this.nativeptr);
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
      if (context.contextStates) {
        context.contextStates.release();
      }

      if (context._gl) {
        context._gl = null
      }

      if (context.nativeptr == null) {
        return;
      }
      Core.Terminate(context.nativeptr);
      context.nativeptr = null;
    }

    /**
     * Set the flag whether Effekseer show logs
     * @param {boolean} flag
     */
    setLogEnabled(flag) {
      Core.SetLogEnabled(flag);
    }

    /**
     * Set the string of cross origin for images
     * @param {string} crossOrigin
     */
    setImageCrossOrigin(crossOrigin) {
      _imageCrossOrigin = crossOrigin;
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
