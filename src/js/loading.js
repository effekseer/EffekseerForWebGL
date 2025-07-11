/**
 * @type {{ [path: string]: ArrayBufferLike }}
 */
export const _resourcesMap = {};

/**
 * @type {import('./effect.js').Effect}
 */
let _loadingEffect = null;

/**
 * @param {typeof _loadingEffect} effect
 */
export const _setLoadingEffect = (effect) => {
    _loadingEffect = effect;
}

export const _getLoadingEffect = () => {
    return _loadingEffect;
}

/**
 * @param {string} path 
 * @returns {Promise<ArrayBufferLike>}
 */
export const _loadBuffer = (path) => {
    return new Promise((resolve, reject) => {
        fetch(path, { method: 'get' }).then((response) => {
            if (response.ok) {
                return Promise.resolve(response.arrayBuffer());
            } else {
                return Promise.reject(new Error(response.statusText));
            }
        }).then(buffer => {
            resolve(buffer);
        }).catch(reason => {
            reject(reason);
        });
    });
}

/**
 * @param {number} value 
 * @returns {number}
 */
const _calcNextPowerOfTwo = (value) => {
    if (value === 0) {
        return 1;
    }

    value--;
    value |= value >> 1;
    value |= value >> 2;
    value |= value >> 4;
    value |= value >> 8;
    value |= value >> 16;

    return value + 1;
}

/**
 * @param {number} value 
 * @returns {boolean}
 */
const _isPowerOfTwo = (value) => {
    return !(value & (value - 1));
}

/**
 * @param {string} path 
 * @returns {string | null}
 */
const _getMimeType = (path) => {
    const extension = path.split('.').pop().toLowerCase();
    const mimeTypes = {
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg'
    };
    return mimeTypes[extension] ?? null;
}

/**
 * @param {import('../Effekseer.js').TheImage} image 
 * @returns {import('../Effekseer.js').TheImage}
 */
export const _drawEffectImage = (image) => {
    if (!_isPowerOfTwo(image.width) || !_isPowerOfTwo(image.height)) {
        const canvas = document.createElement('canvas');
        canvas.width = _calcNextPowerOfTwo(image.width);
        canvas.height = _calcNextPowerOfTwo(image.height);

        const context2d = canvas.getContext('2d');
        context2d.drawImage(image, 0, 0, image.width, image.height, 0, 0, canvas.width, canvas.height);

        image = canvas;
    }

    return image;
}

/**
 * @param {string} path 
 * @returns {import('../Effekseer.js').TheImage | null}
 */
export const _loadEffectImage = (path) => {
    const effect = _loadingEffect;
    effect.context._makeContextCurrent();

    const resource = effect.resources.find(resource => {
        return resource.path == path;
    }) || {
        path: path,
        isLoaded: false,
        image: null,
        customFile: null,
        isRequired: true
    };

    if (resource.isLoaded) {
        return resource.image;
    }

    effect.resources.push(resource);

    path = effect.baseDir + path;
    if (effect.redirect) {
        path = effect.redirect(path);
    }

    const type = _getMimeType(path);

    const buffer = _resourcesMap[path];
    if (buffer) {
        const arrayBufferView = new Uint8Array(buffer);
        const blob = new Blob([arrayBufferView], { type: type });
        path = URL.createObjectURL(blob);
    }

    if (type) {
        const image = new Image();
        image.onload = () => {
            resource.image = _drawEffectImage(image);
            resource.isLoaded = true;
            effect._update();
        }
        image.onerror = () => {
            effect.onerror(new Error(`Failed to load the image from ${path}`));
        }
        image.src = path;
    }

    return null;
}

/**
 * @param {string} path 
 * @param {boolean} isRequired 
 * @returns {ArrayBufferLike | null}
 */
export const _loadEffectCustomFile = (path, isRequired) => {
    const effect = _loadingEffect;
    effect.context._makeContextCurrent();

    const resource = effect.resources.find(resource => {
        return resource.path == path;
    }) || {
        path: path,
        isLoaded: false,
        image: null,
        customFile: null,
        isRequired: isRequired
    };

    if (resource.isLoaded) {
        return resource.customFile;
    }

    effect.resources.push(resource);

    path = effect.baseDir + path;
    if (effect.redirect) {
        path = effect.redirect(path);
    }

    const buffer = _resourcesMap[path];
    if (buffer) {
        resource.customFile = buffer;
        resource.isLoaded = true;
        effect._update();
    } else {
        _loadBuffer(path).then(buffer => {
            resource.customFile = buffer;
            resource.isLoaded = true;
            effect._update();
        }).catch(reason => {
            effect.onerror(new Error(`[${reason}] Failed to load the file from ${path}`));
        });
    }

    return null;
}
