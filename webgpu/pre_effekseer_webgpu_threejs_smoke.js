if (typeof Module === 'undefined') {
	var Module = {};
}

Module.__effekseerWebGPUTestResult = Module.effekseerWebGPUTestResult || null;
Object.defineProperty(Module, 'effekseerWebGPUTestResult', {
	configurable: true,
	get: function() {
		return Module.__effekseerWebGPUTestResult;
	},
	set: function(value) {
		Module.__effekseerWebGPUTestResult = value;
		if (typeof document !== 'undefined' && value) {
			document.documentElement.setAttribute('data-effekseer-webgpu-test-status', value.status || '');
			document.documentElement.setAttribute('data-effekseer-webgpu-test-message', value.message || '');
		}
	}
});

function effekseerGetWebGPUThreeJsParams() {
	var params = typeof URLSearchParams !== 'undefined' && typeof location !== 'undefined'
		? new URLSearchParams(location.search)
		: null;
	var get = function(name, fallback) {
		return params && params.get(name) ? params.get(name) : fallback;
	};

	return {
		effect: get('effect', '/TestData/Effects/10/SimpleLaser.efk'),
		width: get('width', '320'),
		height: get('height', '240'),
		frames: get('frames', '36'),
		minChangedPixels: get('minChangedPixels', '100')
	};
}

var effekseerWebGPUThreeJsParams = effekseerGetWebGPUThreeJsParams();

Module.arguments = Module.arguments || [
	'--effect=' + effekseerWebGPUThreeJsParams.effect,
	'--width=' + effekseerWebGPUThreeJsParams.width,
	'--height=' + effekseerWebGPUThreeJsParams.height,
	'--frames=' + effekseerWebGPUThreeJsParams.frames,
	'--min-changed-pixels=' + effekseerWebGPUThreeJsParams.minChangedPixels
];

function effekseerLoadScript(src) {
	return new Promise(function(resolve, reject) {
		var script = document.createElement('script');
		script.src = src;
		script.onload = resolve;
		script.onerror = function() {
			reject(new Error('Failed to load ' + src));
		};
		document.head.appendChild(script);
	});
}

function effekseerPrepareThreeJsCamera() {
	var width = Number(effekseerWebGPUThreeJsParams.width) || 320;
	var height = Number(effekseerWebGPUThreeJsParams.height) || 240;

	var camera = new THREE.PerspectiveCamera(30.0, width / height, 1.0, 1000.0);
	camera.position.set(20, 20, 20);
	camera.lookAt(new THREE.Vector3(0, 0, 0));
	camera.updateMatrixWorld(true);

	Module.effekseerThreeJsProjectionMatrix = Array.prototype.slice.call(camera.projectionMatrix.elements);
	Module.effekseerThreeJsCameraMatrix = Array.prototype.slice.call(camera.matrixWorldInverse.elements);
	Module.effekseerThreeJsCameraDescription = {
		fov: camera.fov,
		aspect: camera.aspect,
		near: camera.near,
		far: camera.far
	};

	console.log(
		'EFFEKSEER_THREEJS_CAMERA_READY fov=' + camera.fov +
		' aspect=' + camera.aspect +
		' near=' + camera.near +
		' far=' + camera.far
	);
}

function effekseerPrepareCanvas() {
	var canvas = Module.canvas || (typeof document !== 'undefined' ? document.getElementById('canvas') : null);
	if (!canvas) {
		return;
	}

	var width = Number(effekseerWebGPUThreeJsParams.width) || 320;
	var height = Number(effekseerWebGPUThreeJsParams.height) || 240;
	canvas.width = width;
	canvas.height = height;
	canvas.style.width = width + 'px';
	canvas.style.height = height + 'px';
}

async function effekseerRequestWebGPUDevice() {
	if (!navigator.gpu) {
		throw new Error('navigator.gpu is not available. Serve over localhost/https and use a WebGPU-capable browser.');
	}

	var adapter = await navigator.gpu.requestAdapter();
	if (!adapter) {
		throw new Error('Failed to request a WebGPU adapter.');
	}

	var optionalFeatures = ['float32-filterable', 'texture-formats-tier2'];
	var requiredFeatures = optionalFeatures.filter(function(feature) {
		return adapter.features && adapter.features.has(feature);
	});

	Module.preinitializedWebGPUDevice = await adapter.requestDevice({
		requiredFeatures: requiredFeatures
	});
	Module.preinitializedWebGPUDevice.addEventListener('uncapturederror', function(event) {
		Module.llgiLastWebGPUError = event.error && event.error.message ? event.error.message : String(event.error);
		console.error('EFFEKSEER_WEBGPU_ERROR', Module.llgiLastWebGPUError);
	});
}

Module.preRun = Module.preRun || [];
Module.preRun.push(function() {
	effekseerPrepareCanvas();

	var dependency = 'effekseer-webgpu-threejs-smoke';
	addRunDependency(dependency);

	Promise.all([
		effekseerLoadScript('three.min.js').then(effekseerPrepareThreeJsCamera),
		effekseerRequestWebGPUDevice()
	]).then(function() {
		removeRunDependency(dependency);
	}).catch(function(error) {
		Module.effekseerWebGPUTestResult = {
			status: 'failed',
			message: error && error.message ? error.message : String(error)
		};
		console.error('EFFEKSEER_TEST_FAIL', Module.effekseerWebGPUTestResult.message);
		removeRunDependency(dependency);
	});
});

Module.onAbort = function(reason) {
	Module.effekseerWebGPUTestResult = {
		status: 'failed',
		message: reason ? String(reason) : 'aborted'
	};
	console.error('EFFEKSEER_TEST_FAIL', Module.effekseerWebGPUTestResult.message);
};
