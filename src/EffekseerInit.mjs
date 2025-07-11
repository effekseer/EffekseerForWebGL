import { createContext, releaseContext, Context, Effect, Handle } from './js/main.mjs';

/**
 * @param {{}} [moduleArg] 
 * @returns {Promise<{
 * createContext: typeof createContext;
 * releaseContext: typeof releaseContext;
 * Context: typeof Context;
 * Effect: typeof Effect;
 * Handle: typeof Handle;
 * } & import('./Effekseer.mjs').EffekseerModule>}
 */
const EffekseerInit = (moduleArg = {}) => { return; }
export default EffekseerInit;
