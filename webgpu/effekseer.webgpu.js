const effekseerWebGPU = (() => {
	let Module = null;
	let Core = null;

	function runtimeUrlFor(wasmUrl) {
		return function(file) {
			if (file.endsWith('.wasm') && wasmUrl) {
				return wasmUrl;
			}
			return file;
		};
	}

	async function requestDevice() {
		if (!navigator.gpu) {
			throw new Error('navigator.gpu is not available. Serve over localhost/https and use a WebGPU-capable browser.');
		}

		const adapter = await navigator.gpu.requestAdapter();
		if (!adapter) {
			throw new Error('Failed to request a WebGPU adapter.');
		}

		const optionalFeatures = ['float32-filterable', 'texture-formats-tier2'];
		const requiredFeatures = optionalFeatures.filter((feature) => adapter.features && adapter.features.has(feature));
		return adapter.requestDevice({requiredFeatures});
	}

	function bindCore() {
		Core = {
			CreateContext: Module.cwrap('EffekseerWebGPUCreateContext', 'number', ['number', 'number', 'number', 'number']),
			Terminate: Module.cwrap('EffekseerWebGPUTerminate', 'void', ['number']),
			LoadEffect: Module.cwrap('EffekseerWebGPULoadEffect', 'number', ['number', 'number', 'number', 'number']),
			PlayEffect: Module.cwrap('EffekseerWebGPUPlayEffect', 'number', ['number', 'number', 'number', 'number', 'number']),
			StopAllEffects: Module.cwrap('EffekseerWebGPUStopAllEffects', 'void', ['number']),
			SetProjectionMatrix: Module.cwrap('EffekseerWebGPUSetProjectionMatrix', 'void', ['number', 'number']),
			SetCameraMatrix: Module.cwrap('EffekseerWebGPUSetCameraMatrix', 'void', ['number', 'number']),
			UpdateAndCapture: Module.cwrap('EffekseerWebGPUUpdateAndCapture', 'number', ['number', 'number'], {async: true}),
			GetPixelsPointer: Module.cwrap('EffekseerWebGPUGetPixelsPointer', 'number', ['number']),
			GetWidth: Module.cwrap('EffekseerWebGPUGetWidth', 'number', ['number']),
			GetHeight: Module.cwrap('EffekseerWebGPUGetHeight', 'number', ['number']),
		};
	}

	function copyMatrixToWasm(elements, pointer) {
		Module.HEAPF32.set(elements, pointer >> 2);
	}

	class Effect {
		constructor(context, id) {
			this.context = context;
			this.id = id;
		}
	}

	class Context {
		constructor(options) {
			const width = options && options.width ? options.width : 320;
			const height = options && options.height ? options.height : 240;
			const instanceMaxCount = options && options.instanceMaxCount ? options.instanceMaxCount : 8000;
			const spriteMaxCount = options && options.spriteMaxCount ? options.spriteMaxCount : 2000;

			this.nativeptr = Core.CreateContext(width, height, instanceMaxCount, spriteMaxCount);
			if (!this.nativeptr) {
				throw new Error('Failed to create Effekseer WebGPU context.');
			}

			this.width = Core.GetWidth(this.nativeptr);
			this.height = Core.GetHeight(this.nativeptr);
			this.matrixPointer = Module._malloc(16 * 4);
			this.imageData = new ImageData(this.width, this.height);
		}

		terminate() {
			if (this.matrixPointer) {
				Module._free(this.matrixPointer);
				this.matrixPointer = 0;
			}
			if (this.nativeptr) {
				Core.Terminate(this.nativeptr);
				this.nativeptr = 0;
			}
		}

		async loadEffect(url, magnification = 1.0) {
			const response = await fetch(url);
			if (!response.ok) {
				throw new Error(`Failed to load effect: ${response.status} ${url}`);
			}

			const buffer = await response.arrayBuffer();
			const pointer = Module._malloc(buffer.byteLength);
			try {
				Module.HEAPU8.set(new Uint8Array(buffer), pointer);
				const id = Core.LoadEffect(this.nativeptr, pointer, buffer.byteLength, magnification);
				if (!id) {
					throw new Error(`Effekseer failed to create effect: ${url}`);
				}
				return new Effect(this, id);
			} finally {
				Module._free(pointer);
			}
		}

		play(effect, x = 0, y = 0, z = 0) {
			return Core.PlayEffect(this.nativeptr, effect.id, x, y, z);
		}

		stopAll() {
			Core.StopAllEffects(this.nativeptr);
		}

		setProjectionMatrix(elements) {
			copyMatrixToWasm(elements, this.matrixPointer);
			Core.SetProjectionMatrix(this.nativeptr, this.matrixPointer);
		}

		setCameraMatrix(elements) {
			copyMatrixToWasm(elements, this.matrixPointer);
			Core.SetCameraMatrix(this.nativeptr, this.matrixPointer);
		}

		async draw(camera, deltaFrames = 1) {
			if (camera) {
				this.setProjectionMatrix(camera.projectionMatrix.elements);
				this.setCameraMatrix(camera.matrixWorldInverse.elements);
			}

			const byteLength = await Core.UpdateAndCapture(this.nativeptr, deltaFrames);
			const pixelsPointer = Core.GetPixelsPointer(this.nativeptr);
			if (!byteLength || !pixelsPointer) {
				throw new Error('Effekseer WebGPU frame capture failed.');
			}

			this.imageData.data.set(Module.HEAPU8.subarray(pixelsPointer, pixelsPointer + byteLength));
			return this.imageData;
		}

		async drawToCanvas(canvas, camera, deltaFrames = 1) {
			const imageData = await this.draw(camera, deltaFrames);
			canvas.getContext('2d').putImageData(imageData, 0, 0);
			return imageData;
		}
	}

	async function initRuntime(options = {}) {
		const device = options.device || await requestDevice();
		Module = await effekseer_webgpu_native({
			locateFile: runtimeUrlFor(options.wasmUrl),
			preinitializedWebGPUDevice: device,
		});
		bindCore();

		return {
			createContext(contextOptions) {
				return new Context(contextOptions);
			},
			device,
		};
	}

	return {
		initRuntime,
	};
})();

globalThis.effekseerWebGPU = effekseerWebGPU;
