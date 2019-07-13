
// create and delete test

var createAndDeleteContext = function(context) {
  let effekseerContext = effekseer.createContext();
  effekseerContext.init(context);
  effekseer.releaseContext(effekseerContext);
}

let setupScene = function (name, effectpath, cubecolor) {
  var canvas = document.getElementById(name);

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

  var renderer = new THREE.WebGLRenderer({ canvas: canvas });
  renderer.setSize(width, height);

  // create and delete test
  createAndDeleteContext(renderer.context);

  let effekseerContext = effekseer.createContext();

  effekseerContext.init(renderer.context);
  let effect = effekseerContext.loadEffect(effectpath);

  var grid = new THREE.GridHelper(20, 10, 0xffffff, 0xffffff);
  scene.add(grid);

  var directionalLight = new THREE.DirectionalLight(0xffffff);
  directionalLight.position.set(0, 0.7, 0.7);
  scene.add(directionalLight);

  var geometry = new THREE.CubeGeometry(2, 2, 2);
  var material = new THREE.MeshPhongMaterial({ color: cubecolor });
  var mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  let timer = 0;

  (function renderLoop() {
    requestAnimationFrame(renderLoop);
    mesh.rotation.set(
      0,
      mesh.rotation.y + .01,
      mesh.rotation.z + .01
    );

    if (timer == 100) {
      effekseerContext.play(effect, 0, 0, 0);
    }
    timer += 1;

    effekseerContext.update();

    renderer.render(scene, camera);
    effekseerContext.setProjectionMatrix(camera.projectionMatrix.elements);
    effekseerContext.setCameraMatrix(camera.matrixWorldInverse.elements);
    effekseerContext.draw();

  })();
};

var main = function () {
  setupScene('canvas1', '../../Release/Resources/Laser01.efk', 0xff0000);
  setupScene('canvas2', '../../Release/Resources/Laser02.efk', 0x00ff00);
};
window.addEventListener('DOMContentLoaded', main, false);