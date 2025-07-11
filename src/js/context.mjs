import Effekseer from '../Effekseer.mjs';
import { _loadBuffer } from './loading.mjs';
import { Effect } from './effect.mjs';
import { Handle } from './handle.mjs';
import { getProperty } from './utils.mjs';

class ContextStates {
    /**
     * @type {OES_vertex_array_object}
     */
    ext_vao;

    /**
     * @param {WebGL2RenderingContext} gl
     */
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
            let GL = Effekseer.GL;
            let id = GL.getNewId(GL.vaos);
            //vao.name = id;
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

        for (let i = 0; i < this.restore_texture_slot_max; i++) {
            this._gl.activeTexture(this._gl.TEXTURE0 + i);
            this.current_textures[i] = this._gl.getParameter(this._gl.TEXTURE_BINDING_2D);
        }
    }

    restore() {
        for (let i = 0; i < this.restore_texture_slot_max; i++) {
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

export class Context {
    /**
     * @type {number}
     */
    ctx;

    /**
     * @type {import('../../build_wasm/types.d.ts').NativeService}
     */
    native;

    _makeContextCurrent() {
        Effekseer.GL.makeContextCurrent(this.ctx);
    }

    /**
     * @param {import('../Effekseer.mjs').EffekseerSettings} obj 
     */
    _getEffekseerSettings(obj) {
        return {
            instanceMaxCount: getProperty(obj, 'instanceMaxCount', 4000),
            squareMaxCount: getProperty(obj, 'squareMaxCount', 10000),
            enableExtensionsByDefault: getProperty(obj, 'enableExtensionsByDefault', true),
            enablePremultipliedAlpha: getProperty(obj, 'enablePremultipliedAlpha', false)
        };
    }

    /**
     * @param {import('../Effekseer.mjs').EmscriptenWebGLContextAttributes} obj 
     */
    _getEmscriptenWebGLContextAttributes(obj) {
        return {
            alpha: getProperty(obj, 'alpha', true),
            depth: getProperty(obj, 'depth', true),
            stencil: getProperty(obj, 'stencil', false),
            antialias: getProperty(obj, 'antialias', true),
            premultipliedAlpha: getProperty(obj, 'premultipliedAlpha', true),
            preserveDrawingBuffer: getProperty(obj, 'preserveDrawingBuffer', false),
            powerPreference: getProperty(obj, 'powerPreference', 0),
            failIfMajorPerformanceCaveat: getProperty(obj, 'failIfMajorPerformanceCaveat', 0),
            majorVersion: getProperty(obj, 'majorVersion', 1),
            minorVersion: getProperty(obj, 'minorVersion', 0),
            enableExtensionsByDefault: getProperty(obj, 'enableExtensionsByDefault', true),
            explicitSwapControl: getProperty(obj, 'explicitSwapControl', false),
            proxyContextToMainThread: getProperty(obj, 'proxyContextToMainThread', 0),
            renderViaOffscreenBackBuffer: getProperty(obj, 'renderViaOffscreenBackBuffer', false),
        };
    }

    /**
     * @param {WebGL2RenderingContext} webglContext
     * @param {import('../Effekseer.mjs').EffekseerSettings} settings
     * @param {import('../Effekseer.mjs').EmscriptenWebGLContextAttributes} attributes
     */
    init(webglContext, settings, attributes) {
        this._gl = webglContext;
        this.contextStates = new ContextStates(this._gl);

        settings = this._getEffekseerSettings(settings);
        attributes = this._getEmscriptenWebGLContextAttributes(attributes);

        if ('enableTimerQuery' in settings && settings.enableTimerQuery) {
            globalThis.ext_timer = this._gl.getExtension('EXT_disjoint_timer_query_webgl2');
            this._availableList = [];
            this._usingList = [];
            this._drawCount = 0;
            this._accumulatedDrawTime = 0;

            if ('onTimerQueryReport' in settings) {
                this._onTimerQueryReport = settings.onTimerQueryReport;
            }
            if ('timerQueryReportIntervalCount' in settings) {
                this._timerQueryReportIntervalCount = settings.timerQueryReportIntervalCount;
            } else {
                this._timerQueryReportIntervalCount = 300;
            }
        }

        this.ctx = Effekseer.GL.registerContext(this._gl, attributes);
        this._makeContextCurrent();

        this._restorationOfStatesFlag = true;

        this.contextStates.save();
        this.native = new Effekseer.NativeService();
        this.native.Init(settings.instanceMaxCount, settings.squareMaxCount, settings.enableExtensionsByDefault, settings.enablePremultipliedAlpha);
        this.contextStates.restore();
    }

    /**
     * @param {number} deltaFrames
     */
    update(deltaFrames) {
        if (!deltaFrames) {
            deltaFrames = 1.0;
        }
        this.native.Update(deltaFrames);
    }

    beginUpdate() {
        this.native.BeginUpdate();
    }

    endUpdate() {
        this.native.EndUpdate();
    }

    /**
     * @param {Handle} handle
     * @param {number} deltaFrames
     */
    updateHandle(handle, deltaFrames) {
        this.native.UpdateHandle(handle.nativeptr, deltaFrames);
    }

    _startQuery() {
        if (globalThis.ext_timer != null) {
            const availableQuery = this._availableList.length ? this._availableList.shift() : this._gl.createQuery();
            this._gl.beginQuery(globalThis.ext_timer.TIME_ELAPSED_EXT, availableQuery);

            return availableQuery;
        }
    }

    /**
     * @param {boolean} availableQuery 
     */
    _endQuery(availableQuery) {
        if (globalThis.ext_timer != null) {
            this._gl.endQuery(globalThis.ext_timer.TIME_ELAPSED_EXT);
            this._usingList.push(availableQuery);

            const disjoint = this._gl.getParameter(globalThis.ext_timer.GPU_DISJOINT_EXT);
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

    draw() {
        const availableQuery = this._startQuery();

        this._makeContextCurrent();

        let program = null;

        if (this._restorationOfStatesFlag) {
            program = this._gl.getParameter(this._gl.CURRENT_PROGRAM);

            this.contextStates.save();
        } else {
            this.contextStates.disableVAO();
        }
        this.native.Draw();

        if (this._restorationOfStatesFlag) {
            this.contextStates.restore();

            this._gl.useProgram(program);
        }

        this._endQuery(availableQuery);
    }

    beginDraw() {
        if (this._restorationOfStatesFlag) {
            this.contextStates.save();
        } else {
            this.contextStates.disableVAO();
        }

        this.native.BeginDraw();
    }

    endDraw() {
        this.native.EndDraw();

        if (this._restorationOfStatesFlag) {
            this.contextStates.restore();
        }
    }

    /**
     * @param {Handle} handle
     */
    drawHandle(handle) {
        this.native.DrawHandle(handle.nativeptr);
    }

    /**
     * Set camera projection from matrix.
     * @param {array} matrixArray An array that is requred 16 elements
     */
    setProjectionMatrix(matrixArray) {
        const stack = Effekseer.stackSave();
        const arrmem = Effekseer.stackAlloc(4 * 16);
        Effekseer.HEAPF32.set(matrixArray, arrmem >> 2);
        this.native.SetProjectionMatrix(arrmem);
        Effekseer.stackRestore(stack);
    }

    /**
     * Set camera projection from perspective parameters.
     * @param {number} fov Field of view in degree
     * @param {number} aspect Aspect ratio
     * @param {number} near Distance of near plane
     * @param {number} aspect Distance of far plane
     */
    setProjectionPerspective(fov, aspect, near, far) {
        this.native.SetProjectionPerspective(fov, aspect, near, far);
    }

    /**
     * Set camera projection from orthographic parameters.
     * @param {number} width Width coordinate of the view plane
     * @param {number} height Height coordinate of the view plane
     * @param {number} near Distance of near plane
     * @param {number} far Distance of far plane
     */
    setProjectionOrthographic(width, height, near, far) {
        this.native.SetProjectionOrthographic(width, height, near, far);
    }

    /**
     * Set camera view from matrix.
     * @param {array} matrixArray An array that is requred 16 elements
     */
    setCameraMatrix(matrixArray) {
        const stack = Effekseer.stackSave();
        const arrmem = Effekseer.stackAlloc(4 * 16);
        Effekseer.HEAPF32.set(matrixArray, arrmem >> 2);
        this.native.SetCameraMatrix(arrmem);
        Effekseer.stackRestore(stack);
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
    setCameraLookAt(positionX, positionY, positionZ, targetX, targetY, targetZ, upvecX, upvecY, upvecZ) {
        this.native.SetCameraLookAt(positionX, positionY, positionZ, targetX, targetY, targetZ, upvecX, upvecY, upvecZ);
    }

    /**
     * Set camera view from lookat vector parameters.
     * @param {object} position camera position
     * @param {object} target target position
     * @param {object=} upvec upper vector
     */
    setCameraLookAtFromVector(position, target, upvec) {
        this.native.SetCameraLookAt(position.x, position.y, position.z, target.x, target.y, target.z, upvec.x, upvec.y, upvec.z);
    }

    /**
     * Load the effect data file (and resources).
     * @param {string|ArrayBuffer} data A URL/ArrayBuffer of effect file (*.efk)
     * @param {number} scale A magnification rate for the effect. The effect is loaded magnificating with this specified number.
     * @param {() => void} onload A function that is called at loading complete
     * @param {(reason: any) => void} onerror A function that is called at loading error. First argument is a message. Second argument is an url.
     * @param {(path: string) => string} redirect A function to redirect a path. First argument is an url and return redirected url.
     * @returns {Effect} The effect data
     */
    loadEffect(data, scale = 1.0, onload, onerror, redirect) {
        this._makeContextCurrent();

        const effect = new Effect(this);

        effect.scale = scale;
        effect.onload = onload;
        effect.onerror = onerror;
        effect.redirect = redirect;

        if (typeof data === 'string') {
            const dirIndex = data.lastIndexOf('/');
            effect.baseDir = (dirIndex >= 0) ? data.slice(0, dirIndex + 1) : '';
            _loadBuffer(data).then(buffer => {
                effect._load(buffer);
            }).catch(reason => {
                effect.onerror(reason);
            });
        } else if (data instanceof ArrayBuffer) {
            const buffer = data;
            effect._load(buffer);
        }

        return effect;
    }

    /**
     * Load the effect package file (resources included in the package).
     * @param {string|ArrayBuffer} data A URL/ArrayBuffer of effect package file (*.efkpkg)
     * @param {import('jszip')} jszip A JSZip object
     * @param {number} scale A magnification rate for the effect. The effect is loaded magnificating with this specified number.
     * @param {() => void} onload A function that is called at loading complete
     * @param {(reason: any) => void} onerror A function that is called at loading error. First argument is a message. Second argument is an url.
     * @returns {Effect} The effect data
     */
    loadEffectPackage(data, jszip, scale = 1.0, onload, onerror) {
        this._makeContextCurrent();

        const effect = new Effect(this);
        effect.scale = scale;
        effect.onload = onload;
        effect.onerror = onerror;

        if (typeof data === 'string') {
            const dirIndex = data.lastIndexOf('/');
            effect.baseDir = (dirIndex >= 0) ? data.slice(0, dirIndex + 1) : '';
            _loadBuffer(data).then(buffer => {
                return effect._loadFromPackage(buffer, jszip);
            }).catch(reason => {
                effect.onerror(reason);
            });
        } else if (data instanceof ArrayBuffer) {
            const buffer = data;
            effect._loadFromPackage(buffer, jszip).catch(reason => {
                effect.onerror(reason);
            });
        }

        return effect;
    }

    /**
     * Release the specified effect. Don't touch the instance of effect after released.
     * @param {Effect} effect The loaded effect
     */
    releaseEffect(effect) {
        this._makeContextCurrent();

        if (effect == null) {
            console.warn('the effect is null.')
            return;
        }

        if (!effect.isLoaded) {
            console.warn('the effect has not be loaded yet.')
            return;
        }

        if (effect.nativeptr == null) {
            console.warn('the effect has been released.')
            return;
        }

        this.native.ReleaseEffect(effect.nativeptr);
        effect.nativeptr = null;
    }

    /**
     * Play the specified effect.
     * @param {Effect} effect The loaded effect
     * @param {number} x X value of location that is emited
     * @param {number} y Y value of location that is emited
     * @param {number} z Z value of location that is emited
     * @returns {Handle} The effect handle
     */
    play(effect, x, y, z) {
        if (!effect || !effect.isLoaded) {
            return null;
        }

        if (x === undefined) {
            x = 0;
        }
        if (y === undefined) {
            y = 0;
        }
        if (z === undefined) {
            z = 0;
        }

        const handle = this.native.PlayEffect(effect.nativeptr, x, y, z);
        return (handle >= 0) ? new Handle(this, handle) : null;
    }

    /**
     * Stop the all effects.
     */
    stopAll() {
        this.native.StopAllEffects();
    }

    /**
     * Gets the number of remaining allocated instances.
     */
    getRestInstancesCount() {
        return this.native.GetRestInstancesCount();
    }

    /**
     * Gets a time when updating
     */
    getUpdateTime() {
        return this.native.GetUpdateTime();
    }

    /**
     * Gets a time when drawing
     */
    getDrawTime() {
        return this.native.GetDrawTime();
    }

    /**
     * Get whether VAO is supported
     */
    isVertexArrayObjectSupported() {
        return this.native.IsVertexArrayObjectSupported();
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
        this.native.SetRestorationOfStatesFlag(flag);
    }

    /**
     * Capture current frame buffer and set the image as a background
     * @param {number} x captured image's x offset
     * @param {number} y captured image's y offset
     * @param {number} width captured image's width
     * @param {number} height captured image's height
     */
    captureBackground(x, y, width, height) {
        return this.native.CaptureBackground(x, y, width, height);
    }

    /**
     * Reset background
     */
    resetBackground() {
        return this.native.ResetBackground();
    }
}