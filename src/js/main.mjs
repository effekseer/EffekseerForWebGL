import { Context } from './context.mjs';
import { Effect } from './effect.mjs';
import { Handle } from './handle.mjs';

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

export { _loadEffectImage, _loadEffectCustomFile } from './loading.mjs';
export { Context, Effect, Handle };
