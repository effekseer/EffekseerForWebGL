/// <reference path="./../effekseer.d.ts" />
/// <reference path="./typings/threejs/index.d.ts" />
var effects = {};
var context = null;
var main = function () {
    var canvas = document.getElementById("canvas");
    var scene = new THREE.Scene();
    var width = canvas.width;
    var height = canvas.height;
    var fov = 30;
    var aspect = width / height;
    var near = 1;
    var far = 1000;
    var camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    var target = new THREE.Vector3(0, 0, 0);
    camera.position.set(20, 20, 20);
    camera.lookAt(target);
    var clock = new THREE.Clock();
    var renderer = new THREE.WebGLRenderer({ canvas: canvas });
    renderer.setSize(width, height);
    effekseer.initRuntime("../effekseer.wasm", function () {
        context = effekseer.createContext();
        context.init(renderer.getContext(), {
            instanceMaxCount: 2000,
            squareMaxCount: 8000,
        });
        effects["Laser01"] = context.loadEffect("../Resources/Laser01.efk");
        effects["Laser02"] = context.loadEffect("../Resources/Laser02.efk");
        effects["Simple_Ring_Shape1"] = context.loadEffect("../Resources/Simple_Ring_Shape1.efk");
        effects["block"] = context.loadEffect("../Resources/block.efk");
        var grid = new THREE.GridHelper(20, 10, 0xffffff, 0xffffff);
        scene.add(grid);
        var directionalLight = new THREE.DirectionalLight(0xffffff);
        directionalLight.position.set(0, 0.7, 0.7);
        scene.add(directionalLight);
        var geometry = new THREE.BoxGeometry(2, 2, 2);
        var material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
        var mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        (function renderLoop() {
            requestAnimationFrame(renderLoop);
            mesh.rotation.set(0, mesh.rotation.y + .01, mesh.rotation.z + .01);
            context.update(clock.getDelta() * 60.0);
            renderer.render(scene, camera);
            context.setProjectionMatrix(Float32Array.from(camera.projectionMatrix.elements));
            context.setCameraMatrix(Float32Array.from(camera.matrixWorldInverse.elements));
            context.draw();
        })();
    }, function () { console.log("Failed to initialize."); });
};
window.addEventListener('DOMContentLoaded', main, false);
//# sourceMappingURL=renderer.js.map