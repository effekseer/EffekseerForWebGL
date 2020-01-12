/// <reference path="./../effekseer.d.ts" />
/// <reference path="./typings/threejs/three.d.ts" />
var effects = {};
var main = function () {
    var canvas = document.getElementById("canvas");
    var scene = new THREE.Scene();
    var width = canvas.width;
    var height = canvas.height;
    var fov = 30;
    var aspect = width / height;
    var near = 1;
    var far = 1000;
    var clock = new THREE.Clock();
    var camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    var target = new THREE.Vector3(0, 0, 0);
    camera.position.set(20, 20, 20);
    camera.lookAt(target);
    var renderer = new THREE.WebGLRenderer({ canvas: canvas });
    renderer.setSize(width, height);
    //document.body.appendChild( renderer.domElement );
    effekseer.init(renderer.getContext(), {
        instanceMaxCount: 2000,
        squareMaxCount: 8000
    });
    effects["Laser01"] = effekseer.loadEffect("../Resources/Laser01.efk");
    effects["Laser02"] = effekseer.loadEffect("../Resources/Laser02.efk");
    effects["Simple_Ring_Shape1"] = effekseer.loadEffect("../Resources/Simple_Ring_Shape1.efk");
    effects["block"] = effekseer.loadEffect("../Resources/block.efk");
    var grid = new THREE.GridHelper(20, 10, 0xffffff, 0xffffff);
    scene.add(grid);
    var directionalLight = new THREE.DirectionalLight(0xffffff);
    directionalLight.position.set(0, 0.7, 0.7);
    scene.add(directionalLight);
    var geometry = new THREE.CubeGeometry(2, 2, 2);
    var material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    var mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    (function renderLoop() {
        requestAnimationFrame(renderLoop);
        mesh.rotation.set(0, mesh.rotation.y + .01, mesh.rotation.z + .01);
        effekseer.update(clock.getDelta() * 60.0);
        renderer.render(scene, camera);
        effekseer.setProjectionMatrix(camera.projectionMatrix.elements);
        effekseer.setCameraMatrix(camera.matrixWorldInverse.elements);
        effekseer.draw();
    })();
};
window.addEventListener('DOMContentLoaded', main, false);
