// All imports
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { VRButton } from 'three/addons/webxr/VRButton.js';
import GUI from 'lil-gui';


// Create Scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(50, 0, 1.5);


// Enable VR
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

  // Auto resize
window.addEventListener('resize', function () {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

renderer.setClearColor(new THREE.Color(0xe1e1ea));
renderer.setAnimationLoop(animate);
document.body.appendChild( VRButton.createButton( renderer ) );
renderer.xr.enabled = true;


// Add lighting
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.4);
directionalLight.position.set(0, 10, 10);
scene.add(directionalLight);


// Load in model
const loader = new GLTFLoader();
loader.load(
  "/gun.glb",
  function (gltf) {
    scene.add(gltf.scene);

    console.log(scene);
    
  },
  function ( xhr ) {
		console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
	},
  function (error) {
    console.error(error);
  }
);


// Control settings
const controls = new OrbitControls(camera, renderer.domElement);
  // Mouse
controls.mouseButtons.RIGHT = false;

  // Keys
controls.listenToKeyEvents(window);
controls.keys = {
	LEFT: 'KeyA',
	UP: 'KeyW', 
	RIGHT: 'KeyD',
	BOTTOM: 'KeyS'
};

  // GUI
const gui = new GUI();

  // Define settings
const controlSetting = {
  autoRotate: controls.autoRotate,
}

  // Initiate settings
gui.add( controlSetting, 'autoRotate').name('Auto rotate');
gui.add( camera.position, 'x', 10, 100).name('Zoom');


 // Handle setting changes
gui.onChange( event =>{
  controls[event.property] = event.value;
});


// Initiate Scene
function animate() {
  controls.update();

  renderer.render(scene, camera);
}
