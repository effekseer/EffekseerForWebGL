import Effekseer from '../Effekseer.mjs';
import { _resourcesMap, _setLoadingEffect } from './loading.mjs';

export class Effect {
    /**
     * @type {import('./context.mjs').Context}
     */
    context;
    /**
     * @type {number}
     */
    nativeptr;
    /**
     * @type {string}
     */
    baseDir;
    /**
     * @type {boolean}
     */
    isLoaded;
    /**
     * @type {number}
     */
    scale;
    /**
     * @type {{
     * path: string,
     * isLoaded: boolean,
     * image: import('../Effekseer.mjs').TheImage,
     * customFile: ArrayBufferLike,
     * isRequired: boolean}[]}
     */
    resources;
    /**
     * @type {ArrayBufferLike}
     */
    mainBuffer;
    /**
     * @type {() => void}
     */
    onload;
    /**
     * @type {(reason: any) => void}
     */
    onerror;
    /**
     * @type {(path: string) => string}
     */
    redirect;

    /**
     * @param {import('./context.mjs').Context} context
     */
    constructor(context) {
        this.context = context;
        this.nativeptr = 0;
        this.baseDir = '';
        this.isLoaded = false;
        this.scale = 1.0;
        this.resources = [];
        this.mainBuffer = null;
        this.onload = null;
        this.onerror = null;
        this.redirect = null;
    }

    /**
     * @param {ArrayBufferLike} buffer
     * @param {import('jszip')} jszip
     */
    async _loadFromPackage(buffer, jszip) {
        if (jszip == null) {
            return Promise.reject('jszip is not defined');
        }

        const zip = await jszip.loadAsync(new Uint8Array(buffer));
        /**
         * @type {{version: string, files: { [file: string]: { type: string, dependencies: string[] } }}}
         */
        const metadata = await zip.file('metafile.json').async('arraybuffer').then(buffer => {
            const decoder = new TextDecoder('utf-8', { ignoreBOM: false });
            const text = decoder.decode(buffer);
            return JSON.parse(text);
        });

        let efkFile = '';
        const dependencies = [];
        for (const file in metadata.files) {
            const val = metadata.files[file];
            if (val.type === 'Effect') {
                efkFile = file;
                dependencies.push(...val.dependencies);
            }
        }

        Promise.all(dependencies.map(async (dependency) => {
            const buffer = await zip.file(dependency).async('arraybuffer');
            _resourcesMap[dependency] = buffer;
        }))

        const efkBuffer = await zip.file(efkFile).async('arraybuffer');
        this._load(efkBuffer);
    }

    /**
     * @param {ArrayBufferLike} buffer 
     */
    _load(buffer) {
        _setLoadingEffect(this);
        this.mainBuffer = buffer;
        const memptr = Effekseer._malloc(buffer.byteLength);
        Effekseer.HEAP8.set(new Uint8Array(buffer), memptr);
        this.nativeptr = this.context.native.LoadEffect(memptr, buffer.byteLength, this.scale);
        Effekseer._free(memptr);
        _setLoadingEffect(null);
        this._update();
    }

    _reload() {
        _setLoadingEffect(this);
        const memptr = Effekseer._malloc(this.mainBuffer.byteLength);
        Effekseer.HEAP8.set(new Uint8Array(this.mainBuffer), memptr);
        this.context.native.ReloadResources(this.nativeptr, memptr, this.mainBuffer.byteLength);
        Effekseer._free(memptr);
        _setLoadingEffect(null);
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
