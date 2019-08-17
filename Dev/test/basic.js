var latestHandle = null;
var latestEffect = null;

var effects = {};
var three_camera = null;

// whether does effect exists?
var callExists = function () {
  if (latestHandle == null) return;

  if (latestHandle.exists) {
    console.log("an effect exists.");
  }
  else {
    console.log("an effect doesn't exists.");
  }
}

var playEffect = function (name) {
  latestEffect = effects[name];
  latestHandle = effekseer.play(effects[name], 0, 0, 0);
};

var stopAll = function () {
  effekseer.stopAll();
  latestHandle = null;
}

var showEffect = function () {
  if (latestHandle == null) return;
  latestHandle.setShown(true);
}

var hideEffect = function () {
  if (latestHandle == null) return;
  latestHandle.setShown(false);
}

var pauseEffect = function () {
  if (latestHandle == null) return;
  latestHandle.setPaused(true);
}

var resumeEffect = function () {
  if (latestHandle == null) return;
  latestHandle.setPaused(false);
}

var setLocation = function () {
  if (latestHandle == null) return;

  let x = parseFloat(document.getElementById("x").value);
  let y = parseFloat(document.getElementById("y").value);
  let z = parseFloat(document.getElementById("z").value);

  latestHandle.setLocation(x, y, z);
}

var setRotation = function () {
  if (latestHandle == null) return;

  let x = parseFloat(document.getElementById("x").value);
  let y = parseFloat(document.getElementById("y").value);
  let z = parseFloat(document.getElementById("z").value);

  latestHandle.setRotation(x, y, z);
}

var setScale = function () {
  if (latestHandle == null) return;

  let x = parseFloat(document.getElementById("x").value);
  let y = parseFloat(document.getElementById("y").value);
  let z = parseFloat(document.getElementById("z").value);

  latestHandle.setScale(x, y, z);
}

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
  three_camera = camera;

  var renderer = new THREE.WebGLRenderer({ canvas: canvas });
  renderer.setSize(width, height);
  //document.body.appendChild( renderer.domElement );

  effekseer.init(renderer.context);
  effects["Laser01"] = effekseer.loadEffect("../../Release/Resources/Laser01.efk");
  effects["Laser02"] = effekseer.loadEffect("../../Release/Resources/Laser02.efk");
  effects["Simple_Ring_Shape1"] = effekseer.loadEffect("../../Release/Resources/Simple_Ring_Shape1.efk");
  effects["block"] = effekseer.loadEffect("../../Release/Resources/block.efk");

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
    mesh.rotation.set(
      0,
      mesh.rotation.y + .01,
      mesh.rotation.z + .01
    );

    effekseer.update();

    renderer.render(scene, camera);
    effekseer.setProjectionMatrix(camera.projectionMatrix.elements);
    effekseer.setCameraMatrix(camera.matrixWorldInverse.elements);
    effekseer.draw();

  })();
};
window.addEventListener('DOMContentLoaded', main, false);