
function writeResult(text) {
    document.getElementById("result").innerHTML += text + "</br>";
}

function writeResultGPUTime(text) {
    document.getElementById("result_gputime").innerHTML += text + "</br>";
}

class RenderContext {
    constructor() {
        this.context = null;
        this.renderer = null;
        this.filePaths = [];
        this.effects = [];
        this.currentIndex = 0;
        this.currentTime = -1;
        this.updateTime = 0;
        this.drawTime = 0;
        this.scene = null;
        this.camera = null;
    }

    progress() {
        if (this.currentTime == -1) {
            if (this.filePaths.length <= this.currentIndex) {

                // Unload all resources
                for (var i = 0; i < 5; i++) {
                    this.context.update();
                    this.context.draw();
                }

                for (var i = 0; i < this.effects.length; i += 1) {
                    this.context.releaseEffect(renderContext.effects[i]);
                }

                return;
            }
            this.context.play(this.effects[this.currentIndex]);
            this.currentTime = 0;
            this.updateTime = 0;
            this.drawTime = 0;
        }

        var startUpdateTime = performance.now();
        this.context.update();
        var endUpdateTime = performance.now();

        this.renderer.render(this.scene, this.camera);
        this.context.setProjectionMatrix(this.camera.projectionMatrix.elements);
        this.context.setCameraMatrix(this.camera.matrixWorldInverse.elements);

        var startDrawTime = performance.now()
        this.context.draw();
        var endDrawTime = performance.now();

        // effekseer make states dirty
        this.renderer.resetGLState();

        this.currentTime += 1;

        this.updateTime += (endUpdateTime - startUpdateTime);
        this.drawTime += (endDrawTime - startDrawTime);

        if (this.currentTime > 60) {
            writeResult(this.filePaths[this.currentIndex] + "," + this.updateTime + "," + this.drawTime);
            this.context.stopAll();
            this.currentIndex += 1;
            this.currentTime = -1;
        }
        requestAnimationFrame(() => { this.progress(); });
    }
};

writeResult("Path,Update,Draw");

var renderContext = new RenderContext();

var canvas = document.getElementById("canvas");

renderContext.scene = new THREE.Scene();
var width = canvas.width;
var height = canvas.height;
var fov = 30;
var aspect = width / height;
var near = 1;
var far = 1000;
renderContext.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
var target = new THREE.Vector3(0, 0, 0);
renderContext.camera.position.set(10, 10, 10);
renderContext.camera.lookAt(target);
three_camera = renderContext.camera;

renderContext.filePaths = [
    "Resources/Arrow1.efkefc",
    "Resources/Blow1.efkefc",
    "Resources/Cure1.efkefc",
    "Resources/Light.efkefc",
    "Resources/ToonHit.efkefc",
    "Resources/ToonWater.efkefc",
];

renderContext.effects = [];

renderContext.renderer = new THREE.WebGLRenderer({ canvas: canvas, preserveDrawingBuffer: true });
renderContext.renderer.setSize(width, height);

effekseer.initRuntime('../Release/effekseer.wasm', () => {
    // effekseer.setSetLogEnabled(true);
    renderContext.context = effekseer.createContext();

    renderContext.context.init(renderContext.renderer.context, {
        enableTimerQuery: true, // enable GPU timer query
        onTimerQueryReport: (nanoTime) => { // called when GPU timer query is reported
            writeResultGPUTime(`Effekseer timer query report: ${nanoTime} ns`);
        },
        timerQueryReportIntervalCount: 60, // interval dray count to report GPU timer query
    });

    // renderContext.context.setRestorationOfStatesFlag(false);

    for (let fi = 0; fi < renderContext.filePaths.length; fi++) {
        renderContext.effects.push(renderContext.context.loadEffect(renderContext.filePaths[fi], 1.0, () => {
            canStart = true;
            for (var i = 0; i < renderContext.effects.length; i++) {
                if (!renderContext.effects[i].isLoaded) {
                    canStart = false;
                }
            }

            if (canStart) {
                renderContext.progress();
            }
        }));
    }

    var grid = new THREE.GridHelper(20, 10, 0xffffff, 0xffffff);
    renderContext.scene.add(grid);

    var directionalLight = new THREE.DirectionalLight(0xffffff);
    directionalLight.position.set(0, 0.7, 0.7);
    renderContext.scene.add(directionalLight);
});