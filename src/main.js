import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { VRButton } from 'three/addons/webxr/VRButton.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(new THREE.Color(0xe1e1ea));
renderer.setAnimationLoop(animate);
document.body.appendChild( VRButton.createButton( renderer ) );

document.body.appendChild(renderer.domElement);
renderer.xr.enabled = true;

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.4);
directionalLight.position.set(0, 10, 10);
scene.add(directionalLight);

const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight, 5);
scene.add(directionalLightHelper);

const loader = new GLTFLoader();
loader.load(
  "../public/gun.glb",
  function (gltf) {
    scene.add(gltf.scene);
  },
  undefined,
  function (error) {
    console.error(error);
  }
);

const controls = new OrbitControls(camera, renderer.domElement);
controls.mouseButtons.RIGHT = false;
controls.listenToKeyEvents(window);
controls.keys = {
	LEFT: 'KeyA',
	UP: 'KeyW', 
	RIGHT: 'KeyD',
	BOTTOM: 'KeyS'
};
camera.position.set(-50, 0, 0 );

function animate() {
  controls.update();

  renderer.render(scene, camera);
}
