import { Context } from './context.js';
import { Effect } from './effect.js';
import { Handle } from './handle.js';

/**
 * Create a context to render in multiple scenes
 * @returns {Context} context
 */
export const createContext = () => {
    return new Context();
}

/**
* Release specified context. After that, don't touch a context
* @param {Context} context context
*/
export const releaseContext = (context) => {
    if (context.contextStates) {
        context.contextStates.release();
    }

    if (context._gl) {
        context._gl = null;
    }

    if (context.native == null) {
        return;
    }

    context.native.Terminate();
    context.native = null;
}

export { _loadEffectImage, _loadEffectCustomFile } from './loading.js';
export { Context, Effect, Handle };
