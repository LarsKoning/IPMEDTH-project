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

// Geometry and Material
const platformGeometry = new THREE.CylinderGeometry(5, 5, 1, 64);
const platformMaterial = new THREE.MeshBasicMaterial({ color: 0x808080 });

// Create platforms
const platforms = [];
const positions = [
  { x: -50, y: 0, z: 0 },
  { x: 50, y: 0, z: 0 },
  { x: 0, y: 0, z: -70 },
  { x: 0, y: 0, z: 70 }
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
  console.log('Before Teleport:');
  console.log('Camera Position:', {
    x: camera.position.x.toFixed(2),
    y: camera.position.y.toFixed(2),
    z: camera.position.z.toFixed(2)
  });
  console.log('Camera Rotation:', {
    x: camera.rotation.x.toFixed(2),
    y: camera.rotation.y.toFixed(2),
    z: camera.rotation.z.toFixed(2)
  });
  console.log('Controls Target:', {
    x: controls.target.x.toFixed(2),
    y: controls.target.y.toFixed(2),
    z: controls.target.z.toFixed(2)
  });

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

  console.log('\nAfter Teleport:');
  console.log('Camera Position:', {
    x: camera.position.x.toFixed(2),
    y: camera.position.y.toFixed(2),
    z: camera.position.z.toFixed(2)
  });
  console.log('Camera Rotation:', {
    x: camera.rotation.x.toFixed(2),
    y: camera.rotation.y.toFixed(2),
    z: camera.rotation.z.toFixed(2)
  });
  console.log('Controls Target:', {
    x: controls.target.x.toFixed(2),
    y: controls.target.y.toFixed(2),
    z: controls.target.z.toFixed(2)
  });
  console.log('------------------------');
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
  // Store current position
  const currentPos = {
    x: camera.position.x,
    y: camera.position.y,
    z: camera.position.z
  };

  // Update controls
  controls.update();

  // Reset position while keeping rotation
  camera.position.set(currentPos.x, currentPos.y, currentPos.z);

  renderer.render(scene, camera);
}