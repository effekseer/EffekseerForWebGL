
declare namespace effekseer {

    /**
    * Initialize Effekseer.js.
    * This function must be called at first if use WebAssembly
    * @param {string} path A file of webassembply
    * @param {function=} onload A function that is called at loading complete
    * @param {function=} onerror A function that is called at loading error.
    */
    export function initRuntime(path, onload, onerror);

    /**
    * Create a context to render in multiple scenes
    * @returns {EffekseerContext} context
    */
    export function createContext(): EffekseerContext;

    /**
    * Release specified context. After that, don't touch a context
    * @param {EffekseerContext} context context
    */
    export function releaseContext(context: EffekseerContext);

    /**
     * Set the flag whether Effekseer show logs
     * @param {boolean} flag
     */
    export function setSetLogEnabled(flag);

    /**
         * Initialize graphics system.
         * @param {WebGLRenderingContext} webglContext WebGL Context
         * @param {object} settings Some settings with Effekseer initialization
         */
    export function init(webglContext, settings?: object);

    /**
     * Advance frames.
     * @param {number=} deltaFrames number of advance frames
     */
    export function update(deltaFrames?: number);

    /**
     * Main rendering.
     */
    export function draw();

    /**
     * Set camera projection from matrix.
     * @param matrixArray An array that is requred 16 elements
     */
    export function setProjectionMatrix(matrixArray);

    /**
     * Set camera projection from perspective parameters.
     * @param {number} fov Field of view in degree
     * @param {number} aspect Aspect ratio
     * @param {number} near Distance of near plane
     * @param {number} aspect Distance of far plane
     */
    export function setProjectionPerspective(fov, aspect, near, far);

    /**
     * Set camera projection from orthographic parameters.
     * @param {number} width Width coordinate of the view plane
     * @param {number} height Height coordinate of the view plane
     * @param {number} near Distance of near plane
     * @param {number} aspect Distance of far plane
     */
    export function setProjectionOrthographic(width, height, near, far);

    /**
     * Set camera view from matrix.
     * @param matrixArray An array that is requred 16 elements
     */
    export function setCameraMatrix(matrixArray);

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
    export function setCameraLookAt(
        positionX,
        positionY,
        positionZ,
        targetX,
        targetY,
        targetZ,
        upvecX,
        upvecY,
        upvecZ
    );

    /**
     * Set camera view from lookat vector parameters.
     * @param {object} position camera position
     * @param {object} target target position
     * @param {object=} upvec upper vector
     */
    export function setCameraLookAtFromVector(position, target, upvec);

    /**
     * Load the effect data file (and resources).
     * @param {string} path A URL of effect file (*.efk)
     * @param {number} scale A magnification rate for the effect. The effect is loaded magnificating with this specified number.
     * @param {function=} onload A function that is called at loading complete
     * @param {function=} onerror A function that is called at loading error. First argument is a message. Second argument is an url.
     * @returns {EffekseerEffect} The effect data
     */
    export function loadEffect(path: string, scale?: number, onload?, onerror?): EffekseerEffect;

    /**
    * Release the specified effect. Don't touch the instance of effect after released.
    * @param {EffekseerEffect} effect The loaded effect
    */
    export function releaseEffect(effect: EffekseerEffect);

    /**
     * Play the specified effect.
     * @param {EffekseerEffect} effect The loaded effect
     * @param {number} x X value of location that is emited
     * @param {number} y Y value of location that is emited
     * @param {number} z Z value of location that is emited
     * @returns {EffekseerHandle} The effect handle
     */
    export function play(effect: EffekseerEffect, x, y, z): EffekseerHandle;

    /**
     * Stop the all effects.
     */
    export function stopAll();

    /**
     * Set the resource loader function.
     * @param {function} loader
     */
    export function setResourceLoader(loader);

    /**
    * Get whether VAO is supported
    */
    export function isVertexArrayObjectSupported();

    export class EffekseerContext {
        /**
             * Initialize graphics system.
             * @param {WebGLRenderingContext} webglContext WebGL Context
             * @param {object} settings Some settings with Effekseer initialization
             */
        init(webglContext, settings?: object);

        /**
         * Advance frames.
         * @param {number=} deltaFrames number of advance frames
         */
        update(deltaFrames?: number);

        /**
         * Main rendering.
         */
        draw();

        /**
         * Set camera projection from matrix.
         * @param matrixArray An array that is requred 16 elements
         */
        setProjectionMatrix(matrixArray);

        /**
         * Set camera projection from perspective parameters.
         * @param {number} fov Field of view in degree
         * @param {number} aspect Aspect ratio
         * @param {number} near Distance of near plane
         * @param {number} aspect Distance of far plane
         */
        setProjectionPerspective(fov, aspect, near, far);

        /**
         * Set camera projection from orthographic parameters.
         * @param {number} width Width coordinate of the view plane
         * @param {number} height Height coordinate of the view plane
         * @param {number} near Distance of near plane
         * @param {number} aspect Distance of far plane
         */
        setProjectionOrthographic(width, height, near, far);

        /**
         * Set camera view from matrix.
         * @param matrixArray An array that is requred 16 elements
         */
        setCameraMatrix(matrixArray);

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
        );

        /**
         * Set camera view from lookat vector parameters.
         * @param {object} position camera position
         * @param {object} target target position
         * @param {object=} upvec upper vector
         */
        setCameraLookAtFromVector(position, target, upvec);

        /**
         * Load the effect data file (and resources).
         * @param {string} path A URL of effect file (*.efk)
         * @param {number} scale A magnification rate for the effect. The effect is loaded magnificating with this specified number.
         * @param {function=} onload A function that is called at loading complete
         * @param {function=} onerror A function that is called at loading error. First argument is a message. Second argument is an url.
         * @param {function=} redirect A function to redirect a path. First argument is an url and return redirected url.
         * @returns {EffekseerEffect} The effect data
         */
        loadEffect(path: string, scale?: number, onload?, onerror?, redirect?): EffekseerEffect;

        /**
        * Release the specified effect. Don't touch the instance of effect after released.
        * @param {EffekseerEffect} effect The loaded effect
        */
        releaseEffect(effect: EffekseerEffect);

        /**
         * Play the specified effect.
         * @param {EffekseerEffect} effect The loaded effect
         * @param {number} x X value of location that is emited
         * @param {number} y Y value of location that is emited
         * @param {number} z Z value of location that is emited
         * @returns {EffekseerHandle} The effect handle
         */
        play(effect: EffekseerEffect, x, y, z): EffekseerHandle;

        /**
         * Stop the all effects.
         */
        stopAll();

        /**
         * Set the resource loader function.
         * @param {function} loader
         */
        setResourceLoader(loader);

        /**
        * Get whether VAO is supported
        */
        isVertexArrayObjectSupported();

        /**
         * Gets the number of remaining allocated instances.
         */
        getRestInstancesCount(): Number;

        /**
         * Gets a time when updating
         */
        getUpdateTime(): Number;

        /**
         * Gets a time when drawing
         */
        getDrawTime(): Number;

        /**
         * Set the flag whether the library restores OpenGL states 
         * if specified true, it makes slow.
         * if specified false, You need to restore OpenGL states by yourself
         * it must be called after init
         * @param {boolean} flag
         */
        setRestorationOfStatesFlag(flag);

    export class EffekseerEffect {
        constructor();
    }

    export class EffekseerHandle {
        constructor(native: any);

        /**
         * Stop this effect instance.
         */
        stop();

        /**
         * Stop the root node of this effect instance.
         */
        stopRoot();

        /**
         * if returned false, this effect is end of playing.
         */
        readonly exists: boolean;

        /**
         * Set the location of this effect instance.
         * @param {number} x X value of location
         * @param {number} y Y value of location
         * @param {number} z Z value of location
         */
        setLocation(x, y, z);
        /**
         * Set the rotation of this effect instance.
         * @param {number} x X value of euler angle
         * @param {number} y Y value of euler angle
         * @param {number} z Z value of euler angle
         */
        setRotation(x, y, z);

        /**
         * Set the scale of this effect instance.
         * @param {number} x X value of scale factor
         * @param {number} y Y value of scale factor
         * @param {number} z Z value of scale factor
         */
        setScale(x, y, z);

        /**
         * Set the model matrix of this effect instance.
         * @param {array} matrixArray An array that is requred 16 elements
         */
        setMatrix(matrixArray);

        /**
         * Set the target location of this effect instance.
         * @param {number} x X value of target location
         * @param {number} y Y value of target location
         * @param {number} z Z value of target location
         */
        setTargetLocation(x, y, z);

        /**
         * get a dynamic parameter, which changes effect parameters dynamically while playing
         * @param {number} index slot index
         * @returns {number} value
         */
        getDynamicInput(index) : number;

        /**
         * specfiy a dynamic parameter, which changes effect parameters dynamically while playing
         * @param {number} index slot index
         * @param {number} value value
         */
        setDynamicInput(index, value);

        /**
         * Set the paused flag of this effect instance.
         * if specified true, this effect playing will not advance.
         * @param {boolean} paused Paused flag
         */
        setPaused(paused);

        /**
         * Set the shown flag of this effect instance.
         * if specified false, this effect will be invisible.
         * @param {boolean} shown Shown flag
         */
        setShown(shown);
        /**
         * Set playing speed of this effect.
         * @param {number} speed Speed ratio
         */
        setSpeed(speed);
    }
}

declare module "effekseer" {
    export = effekseer;
}
