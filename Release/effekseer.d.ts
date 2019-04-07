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
    exists(): boolean;

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

/**
	 * Effekseer Context
	 * @class
	 */
export class Effekseer {
    /**
     * Initialize graphics system.
     * @param {WebGLRenderingContext} webglContext WebGL Context
     * @param {object} settings Some settings with Effekseer initialization
     */
    init(webglContext, settings);

    /**
     * Advance frames.
     * @param {number=} deltaFrames number of advance frames
     */
    update(deltaFrames);

    /**
     * Main rendering.
     */
    draw();

    /**
     * Set camera projection from matrix.
     * @param {array} matrixArray An array that is requred 16 elements
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
     * @param {array} matrixArray An array that is requred 16 elements
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
     * @param {function=} onload A function that is called at loading complete
     * @param {function=} onerror A function that is called at loading error
     * @returns {EffekseerEffect} The effect data
     */
    loadEffect(path, onload, onerror);

    /**
     * Play the specified effect.
     * @param {EffekseerEffect} effect The loaded effect
     * @param {number} x X value of location that is emited
     * @param {number} y Y value of location that is emited
     * @param {number} z Z value of location that is emited
     * @returns {EffekseerHandle} The effect handle
     */
    play(effect, x, y, z);

    /**
     * Stop the all effects.
     */
    stopAll();

    /**
     * Set the resource loader function.
     * @param {function} loader
     */
    setResourceLoader(loader);
}