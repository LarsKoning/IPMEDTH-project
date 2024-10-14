import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

console.log("Script is running...");

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(new THREE.Color(0xe1e1ea))
renderer.setAnimationLoop(animate);
document.body.appendChild(renderer.domElement);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.4);
directionalLight.position.set(0, 10, 10);
scene.add(directionalLight);

const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight, 5);
scene.add(directionalLightHelper)

const loader = new GLTFLoader();
loader.load(
  "../assets/gun.glb",
  function (gltf) {
    scene.add(gltf.scene);
  },
  undefined,
  function (error) {
    console.error(error);
  }
);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enablePan = false
controls.mouseButtons.RIGHT = THREE.MOUSE.ROTATE;
camera.position.set(-50, 4, 0 );

function animate() {
  controls.update();

  renderer.render(scene, camera);
}
