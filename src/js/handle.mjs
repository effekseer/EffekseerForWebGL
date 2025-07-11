import Effekseer from '../Effekseer.mjs';

export class Handle {
    /**
     * @param {import('./context.mjs').Context} context
     * @param {number} nativeptr
     */
    constructor(context, nativeptr) {
        this.context = context;
        this.nativeptr = nativeptr;
    }

    /**
     * Stop this effect instance.
     */
    stop() {
        this.context.native.StopEffect(this.nativeptr);
    }

    /**
     * Stop the root node of this effect instance.
     */
    stopRoot() {
        this.context.native.StopRoot(this.nativeptr);
    }

    /**
     * if returned false, this effect is end of playing.
     * @property {boolean}
     */
    get exists() {
        return this.context.native.Exists(this.nativeptr);
    }

    /**
     * Set frame of this effect instance.
     * @param {number} frame Frame of this effect instance.
     */
    setFrame(frame) {
        this.context.native.SetFrame(this.nativeptr, frame);
    }

    /**
     * Set the location of this effect instance.
     * @param {number} x X value of location
     * @param {number} y Y value of location
     * @param {number} z Z value of location
     */
    setLocation(x, y, z) {
        this.context.native.SetLocation(this.nativeptr, x, y, z);
    }

    /**
     * Set the rotation of this effect instance.
     * @param {number} x X value of euler angle
     * @param {number} y Y value of euler angle
     * @param {number} z Z value of euler angle
     */
    setRotation(x, y, z) {
        this.context.native.SetRotation(this.nativeptr, x, y, z);
    }

    /**
     * Set the scale of this effect instance.
     * @param {number} x X value of scale factor
     * @param {number} y Y value of scale factor
     * @param {number} z Z value of scale factor
     */
    setScale(x, y, z) {
        this.context.native.SetScale(this.nativeptr, x, y, z);
    }

    /**
     * Set the model matrix of this effect instance.
     * @param {array} matrixArray An array that is requred 16 elements
     */
    setMatrix(matrixArray) {
        const stack = Effekseer.stackSave();
        const arrmem = Effekseer.stackAlloc(4 * 16);
        Effekseer.HEAPF32.set(matrixArray, arrmem >> 2);
        this.context.native.SetMatrix(this.nativeptr, arrmem);
        Effekseer.stackRestore(stack);
    }

    /**
     * Set the color of this effect instance.
     * @param {number} r R channel value of color
     * @param {number} g G channel value of color
     * @param {number} b B channel value of color
     * @param {number} a A channel value of color
     */
    setAllColor(r, g, b, a) {
        this.context.native.SetAllColor(this.nativeptr, r, g, b, a);
    }

    /**
     * Set the target location of this effect instance.
     * @param {number} x X value of target location
     * @param {number} y Y value of target location
     * @param {number} z Z value of target location
     */
    setTargetLocation(x, y, z) {
        this.context.native.SetTargetLocation(this.nativeptr, x, y, z);
    }

    /**
     * get a dynamic parameter, which changes effect parameters dynamically while playing
     * @param {number} index slot index
     * @returns {number} value
     */
    getDynamicInput(index) {
        return this.context.native.GetDynamicInput(this.nativeptr, index);
    }

    /**
     * specfiy a dynamic parameter, which changes effect parameters dynamically while playing
     * @param {number} index slot index
     * @param {number} value value
     */
    setDynamicInput(index, value) {
        this.context.native.SetDynamicInput(this.nativeptr, index, value);
    }

    /**
     * Sends the specified trigger to the currently playing effect
     * @param {number} index trigger index
     */
    sendTrigger(index) {
        this.context.native.SendTrigger(this.nativeptr, index);
    }

    /**
     * Set the paused flag of this effect instance.
     * if specified true, this effect playing will not advance.
     * @param {boolean} paused Paused flag
     */
    setPaused(paused) {
        this.context.native.SetPaused(this.nativeptr, paused);
    }

    /**
     * Set the shown flag of this effect instance.
     * if specified false, this effect will be invisible.
     * @param {boolean} shown Shown flag
     */
    setShown(shown) {
        this.context.native.SetShown(this.nativeptr, shown);
    }

    /**
     * Set playing speed of this effect.
     * @param {number} speed Speed ratio
     */
    setSpeed(speed) {
        this.context.native.SetSpeed(this.nativeptr, speed);
    }

    /**
     * Set random seed of this effect.
     * @param {number} seed Random seed
     */
    setRandomSeed(seed) {
        this.context.native.SetRandomSeed(this.nativeptr, seed);
    }
}