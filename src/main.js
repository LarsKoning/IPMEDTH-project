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
document.body.appendChild(VRButton.createButton(renderer));

document.body.appendChild(renderer.domElement);
renderer.xr.enabled = true;

//lights
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.4);
directionalLight.position.set(0, 10, 10);
scene.add(directionalLight);

const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight, 5);
scene.add(directionalLightHelper);

// Geometry
const platformGeometry = new THREE.CylinderGeometry(5, 5, 1, 64);

const geometry = new THREE.ConeGeometry( 2, 5, 32 ); 
const material = new THREE.MeshBasicMaterial( {color: 'red'} );
const cone = new THREE.Mesh(geometry, material ); scene.add( cone );
cone.position.set(-50, -10, 0);

const scale = new THREE.Vector3(1, -1, 1);
cone.scale.multiply(scale);

// Create platforms
const platforms = [];
const platformData = [
  { x: -50, y: -20, z: 0, color: 'red' },
  { x: 0, y: -20, z: 70, color: 'yellow' },
  { x: 50, y: -20, z: 0, color: 'blue' },
  { x: 0, y: -20, z: -70, color: 'green' },
];

platformData.forEach((data, index) => {
  const platformMaterial = new THREE.MeshBasicMaterial({ color: data.color });
  const platform = new THREE.Mesh(platformGeometry, platformMaterial);
  platform.position.set(data.x, data.y, data.z);
  scene.add(platform);
  platforms.push(platform);
});

let counter = 0;

const controls = new OrbitControls(camera, renderer.domElement);
controls.minDistance = 10;
controls.maxDistance = 100;
controls.mouseButtons.RIGHT = false;
controls.listenToKeyEvents(window);
controls.keys = {
    LEFT: 'KeyA',
    UP: 'KeyW', 
    RIGHT: 'KeyD',
    BOTTOM: 'KeyS'
};

window.addEventListener('keydown', (event) => {
  if (event.key === 'l') {
    if(counter < 3) {
      counter++;
    }
    else {
      counter = 0;
    }
    teleport();
  }
  if (event.key === 'j') {
    if(counter > 0) {
      counter--;
    }
    else{
      counter = 3;
    }
    teleport();
  }
});

function teleport() {  
  switch (counter) {
    case 0:
      camera.position.set(-50, 0, 0);
      cone.position.set(-50, -10, 0);
      cone.material.color.set('red');
      break;
    case 1:
      camera.position.set(0, 0, 70);
      cone.position.set(0, -10, 70);
      cone.material.color.set('yellow');
      break;
    case 2:
      camera.position.set(50, 0, 0);
      cone.position.set(50, -10, 0);
      cone.material.color.set('blue');
      break;
    case 3:
      camera.position.set(0, 0, -70);
      cone.position.set(0, -10, -70);
      cone.material.color.set('green');
      break;
  }
}

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

camera.position.set(-50, 0, 0);

function animate() {
  controls.update();

  renderer.render(scene, camera);
}