import * as THREE from "../node_modules/three/build/three.module.js";
import { OrbitControls } from "../node_modules/three/examples/jsm/controls/OrbitControls.js";
import { STLLoader } from "../node_modules/three/examples/jsm/loaders/STLLoader.js";
import { OBJLoader } from "../node_modules/three/examples/jsm/loaders/OBJLoader.js";
import { FBXLoader } from "../node_modules/three/examples/jsm/loaders/FBXLoader.js";

export function createScene4(scene, camera, renderer) {
  camera.position.set(0, 2, 5);

  const controls = new OrbitControls(camera, renderer.domElement);

  const geometry = new THREE.PlaneGeometry(10, 10, 50, 50);
  const material = new THREE.MeshPhongMaterial({
    color: 0x4488ff,
    wireframe: true,
  });
  const plane = new THREE.Mesh(geometry, material);
  plane.rotation.x = -Math.PI / 2;
  plane.position.set(0, 0, 0);
  scene.add(plane);

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(5, 5, 5);
  scene.add(light);

  const ambientLight = new THREE.AmbientLight(0x404040);
  scene.add(ambientLight);

  let fileInput = document.getElementById("fileInput");
  if (!fileInput) {
    fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".stl,.obj,.fbx";
    fileInput.id = "fileInput";
    fileInput.style.position = "absolute";
    fileInput.style.zIndex = 10;
    fileInput.style.top = "10px";
    fileInput.style.left = "10px";
    document.body.appendChild(fileInput);
  }

  console.log("File input ready.");

  fileInput.onchange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const fileExtension = file.name.split(".").pop().toLowerCase();

    if (fileExtension === "stl") {
      handleSTL(file);
    } else if (fileExtension === "obj") {
      handleOBJ(file);
    } else if (fileExtension === "fbx") {
      handleFBX(file);
    } else {
      alert("Invalid file type. Please upload a .stl, .obj, or .fbx file.");
    }
  };

  function resizeAndPosition(object) {
    const box = new THREE.Box3();
    object.traverse((child) => {
      if (child.isMesh) {
        box.expandByObject(child);
      }
    });

    if (!box.isEmpty()) {
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();

      box.getSize(size);
      box.getCenter(center);

      const maxDimension = Math.max(size.x, size.y, size.z);
      const desiredSize = 2;
      const scaleFactor = desiredSize / maxDimension;

      object.scale.set(scaleFactor, scaleFactor, scaleFactor);

      object.position.x = 0;
      object.position.y = size.y - size.y; // Zorg dat het op de grond staat
    } else {
      console.warn("Bounding box is leeg. Controleer het model.");
    }
    return object;
  }

  function handleSTL(file) {
    const stlLoader = new STLLoader();
    const reader = new FileReader();
    reader.onload = function (e) {
      const geometry = stlLoader.parse(e.target.result);
      const material = new THREE.MeshStandardMaterial({ color: 0x0077ff });
      const mesh = new THREE.Mesh(geometry, material);

      mesh.geometry.center(); // Centreer de geometrie naar lokale coördinaten
      resizeAndPosition(mesh);
      scene.add(mesh);
    };
    reader.readAsArrayBuffer(file);
  }

  function handleOBJ(file) {
    const objLoader = new OBJLoader();
    const reader = new FileReader();
    reader.onload = function (e) {
      const object = objLoader.parse(e.target.result);

      object.traverse((child) => {
        if (child.isMesh) {
          child.geometry.center(); // Centreer elk kind
        }
      });

      resizeAndPosition(object);
      scene.add(object);
    };
    reader.readAsText(file);
  }

  function handleFBX(file) {
    const fbxLoader = new FBXLoader();
    const reader = new FileReader();
    reader.onload = function (e) {
      const object = fbxLoader.parse(e.target.result);

      // Transformeer naar lokale coördinaten als nodig
      object.traverse((child) => {
        if (child.isMesh) {
          child.geometry.applyMatrix4(child.matrixWorld);
          child.position.set(0, 0, 0);
          child.rotation.set(0, 0, 0);
          child.updateMatrixWorld();
        }
      });

      resizeAndPosition(object);
      scene.add(object);
    };
    reader.readAsArrayBuffer(file);
  }

  function animate() {
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();
}
