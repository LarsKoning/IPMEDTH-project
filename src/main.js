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
camera.position.set(-50, 0, 0);


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

// Geometry and Material
const platformGeometry = new THREE.CylinderGeometry(5, 5, 1, 64);
const platformMaterial = new THREE.MeshBasicMaterial({ color: 0x808080 });

// Create platforms
const platforms = [];
const positions = [
  { x: -50, y: -1.7, z: 0 },
  { x: 50, y: -1.7, z: 0 },
  { x: 0, y: -1.7, z: -70 },
  { x: 0, y: -1.7, z: 70 }
];

positions.forEach((position, index) => {
  const platform = new THREE.Mesh(platformGeometry, platformMaterial);
  platform.position.set(position.x, position.y, position.z);
  scene.add(platform);
  platforms.push(platform);
});

let counter = 0;

const controls = new OrbitControls(camera, renderer.domElement);
controls.mouseButtons.RIGHT = false;
controls.listenToKeyEvents(window);
controls.keys = {
    LEFT: 'KeyA',
    UP: 'KeyW', 
    RIGHT: 'KeyD',
    BOTTOM: 'KeyS'
};

window.addEventListener('keydown', (event) => {
  if (event.key === 't') {
    if(counter <= 3) {
      counter++;
    }
    if (counter == 4) {
      counter = 0;
    }
    teleport();
  }
});

function teleport() {
  // Store the current rotation
  let currentRotation

  switch (counter) {
    case 1:
      camera.position.set(0, 0, -70);
      currentRotation = camera.rotation.set(-90, 0, 0); // Rotated to face back (180 degrees)
      controls.target.set(0, 0, -70);
      break;
    case 2:
      camera.position.set(50, 0, 0);
      currentRotation = camera.rotation.set(0, -90, 0); // Facing towards positive X
      controls.target.set(50, 0, 0);
      break;
    case 3:
      camera.position.set(0, 0, 70);
      currentRotation = camera.rotation.set(0, 135, 0); // Rotated to face forward (270 degrees)
      controls.target.set(0, 0, 70);
      break;
    case 0:
      camera.position.set(-50, 0, 0);
      currentRotation = camera.rotation.set(135, 90, 0); // Rotated to face back (180 degrees)
      controls.target.set(-50, 0, 0);
      break;
  }

  // Restore the rotation
  camera.rotation.copy(currentRotation);
  controls.target.set(
    camera.position.x + Math.sin(currentRotation.y),
    camera.position.y,
    camera.position.z + Math.cos(currentRotation.y)
  );
}

const cameraGroup = new THREE.Group();
cameraGroup.position.set(-50, 0, 0);  // Set the initial VR Headset Position.

renderer.xr.addEventListener('sessionstart', () => {
  if (gun) {
    gun.scale.set(0.1, 0.1, 0.1); 
    scene.add(cameraGroup);
    cameraGroup.add(camera);
  }
});

renderer.xr.addEventListener('sessionend', () => {
  if (gun) {
    gun.scale.set(1, 1, 1);
    scene.remove(cameraGroup);
    cameraGroup.remove(camera);
    camera.position.set(-50, 0, 0);
  }
});
const loader = new GLTFLoader();
let gun;

loader.load(
  "../public/gun.glb",
  function (gltf) {
    gun = gltf.scene;

    gun.scale.set(1, 1, 1); // Adjust scale for VR
    scene.add(gun);
  },
  undefined,
  function (error) {
    console.error(error);
  }
);


let controller1, controller2;

controller1 = renderer.xr.getController(0); // First controller
controller2 = renderer.xr.getController(1); // Second controller
scene.add(controller1);
scene.add(controller2);

// Store controllers' previous positions to detect movement
const prevPos1 = new THREE.Vector3();
const prevPos2 = new THREE.Vector3();

function animate() {
  // Store current position
  const currentPos = {
    x: camera.position.x,
    y: camera.position.y,
    z: camera.position.z
  };

  moveController();

  // Update controls
  controls.update();

  // Reset position while keeping rotation
  camera.position.set(currentPos.x, currentPos.y, currentPos.z);

  renderer.render(scene, camera);
}

function moveController() {
  const controller1Pos = new THREE.Vector3();
  controller1.getWorldPosition(controller1Pos);
  const controller2Pos = new THREE.Vector3();
  controller2.getWorldPosition(controller2Pos);

  const moveDirection = new THREE.Vector3();
  moveDirection.subVectors(controller1Pos, prevPos1);
  
  // You can scale the movement vector to adjust movement speed
  moveDirection.multiplyScalar(5);

  camera.position.add(moveDirection);

  // Update previous positions
  prevPos1.copy(controller1Pos);
  prevPos2.copy(controller2Pos);
}