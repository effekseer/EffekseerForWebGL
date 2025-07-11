/**
 * @typedef {HTMLImageElement | HTMLCanvasElement} TheImage
 */

/**
 * @typedef {{
 * alpha?: boolean;
 * depth?: boolean;
 * stencil?: boolean;
 * antialias?: boolean;
 * premultipliedAlpha?: boolean;
 * preserveDrawingBuffer?: boolean;
 * powerPreference?: 0 | 1 | 2;
 * failIfMajorPerformanceCaveat?: number;
 * majorVersion: 1 | 2;
 * minorVersion: 0;
 * enableExtensionsByDefault?: boolean;
 * explicitSwapControl?: boolean;
 * proxyContextToMainThread?: 0 | 1 | 2;
 * renderViaOffscreenBackBuffer?: boolean;
 * }} EmscriptenWebGLContextAttributes
 */

/**
 * @typedef {{
 * instanceMaxCount?: number;
 * squareMaxCount?: number;
 * enableExtensionsByDefault?: boolean;
 * enablePremultipliedAlpha?: boolean;
 * enableTimerQuery?: boolean;
 * onTimerQueryReport?: (time: number) => void;
 * timerQueryReportIntervalCount?: number;
 * }} EffekseerSettings
 */

/**
 * @typedef {import('../build_wasm/types.js').MainModule} EffekseerModule
 */

/**
 * @type {EffekseerModule}
 */
const Effekseer = exports;
export default Effekseer;
