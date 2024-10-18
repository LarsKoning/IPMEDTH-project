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
controls.maxDistance = 100;
controls.minDistance = 10;

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
const controlSettings = {
  autoRotate: controls.autoRotate,
}

const cameraSettings = {
  Zoom: 50,
  reset: () => {
    cameraFolder.reset();
  }
}

const lightSettings = {
  Intensity: directionalLight.intensity,
  Color: '#ffffff',
  Depth: directionalLight.position.x,
  Height: directionalLight.position.y,
  Angle: directionalLight.position.z,
  reset: () => {
    lightingFolder.reset();
  }
};

  // Initiate settings
gui.add( controlSettings, 'autoRotate')
  .name('Auto Rotate')
  .onChange( value =>{
    controls.autoRotate = value;
  });

const cameraFolder = gui.addFolder('Camera')
cameraFolder.add( cameraSettings, 'Zoom', 10, 100)
  .onChange(value => {
    // Bereken huidige hoek in het XZ vlak
    const angle = Math.atan2(camera.position.z, camera.position.x);
    
    // Update x en z posities om de cirkelvormige beweging te behouden
    camera.position.x = value * Math.cos(angle);
    camera.position.z = value * Math.sin(angle);
  });
cameraFolder.add(cameraSettings, 'reset').name('Reset Camera');

const lightingFolder = gui.addFolder('Lighting');
lightingFolder.add(lightSettings, 'Intensity', 0, 10)
  .onChange(value => directionalLight.intensity = value);
lightingFolder.addColor(lightSettings, 'Color')
  .onChange(value => directionalLight.color.set(value));
lightingFolder.add(lightSettings, 'Depth', -20, 20)
  .onChange(value => directionalLight.position.x = value);
lightingFolder.add(lightSettings, 'Height', -20, 20)
  .onChange(value => directionalLight.position.y = value);
lightingFolder.add(lightSettings, 'Angle', -20, 20)
  .onChange(value => directionalLight.position.z = -value);
lightingFolder.add(lightSettings, 'reset').name('Reset Lighting');


// Initiate Scene
function animate() {  
  controls.update();
  
  renderer.render(scene, camera);
}
