import * as THREE from "../node_modules/three/build/three.module.js";
import { OrbitControls } from "../node_modules/three/examples/jsm/controls/OrbitControls.js";
import { STLLoader } from "../node_modules/three/examples/jsm/loaders/STLLoader.js";
import { OBJLoader } from "../node_modules/three/examples/jsm/loaders/OBJLoader.js";
import { GLTFLoader } from "../node_modules/three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "../node_modules/three/examples/jsm/loaders/DRACOLoader.js";
import { FBXLoader } from "../node_modules/three/examples/jsm/loaders/FBXLoader.js";

export function createScene4(scene, camera, renderer) {
  // Configure camera and renderer
  camera.position.set(0, 2, 5);

  // Add controls
  const controls = new OrbitControls(camera, renderer.domElement);

  // Add a basic ground plane
  const geometry = new THREE.PlaneGeometry(10, 10, 50, 50);
  const material = new THREE.MeshPhongMaterial({
    color: 0x4488ff,
    wireframe: true,
  });
  const plane = new THREE.Mesh(geometry, material);
  plane.rotation.x = -Math.PI / 2;
  scene.add(plane);

  // Lighting
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(5, 5, 5);
  scene.add(light);

  const ambientLight = new THREE.AmbientLight(0x404040); // Soft light
  scene.add(ambientLight);

  // File input element
  let fileInput = document.getElementById("fileInput");
  if (!fileInput) {
    fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".stl,.obj,.fbx,.glb,.gltf"; // Allow STL, OBJ, FBX, GLB, GLTF
    fileInput.id = "fileInput";
    fileInput.style.position = "absolute";
    fileInput.style.zIndex = 10;
    fileInput.style.top = "10px";
    fileInput.style.left = "10px";
    document.body.appendChild(fileInput);
  }

  console.log("File input ready.");

  // Event listener for file input
  fileInput.onchange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const fileExtension = file.name.split(".").pop().toLowerCase();

    if (fileExtension === "stl") {
      loadSTL(file);
    } else if (fileExtension === "obj") {
      loadOBJ(file);
    } else if (fileExtension === "fbx") {
      loadFBX(file);
    } else if (fileExtension === "gltf" || fileExtension === "glb") {
      loadGLTF(file);
    } else {
      alert(
        "Invalid file type. Please upload a .stl, .obj, .fbx, .glb, or .gltf file."
      );
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
      object.position.y = size.y - size.y + 0.5; // Zorg dat het op de grond staat
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

  // Load OBJ file
  function loadOBJ(file) {
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

  // Load FBX file
  function loadFBX(file) {
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

  // Load GLTF or GLB file (with Draco compression if available)
  function loadGLTF(file) {
    const gltfLoader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("/path-to-draco/"); // Set path to Draco decoder
    gltfLoader.setDRACOLoader(dracoLoader);

    const reader = new FileReader();
    reader.onload = function (e) {
      gltfLoader.parse(
        e.target.result,
        "",
        function (gltf) {
          gltf.scene.position.set(0, 0, 0); // Position it on top of the plane
          scaleModel(gltf.scene);
          scene.add(gltf.scene);
        },
        function (error) {
          console.error("Error loading GLTF model:", error);
        }
      );
    };
    reader.readAsArrayBuffer(file);
  }

  // Scale models to fit within a reasonable size
  function scaleModel(model) {
    const bbox = new THREE.Box3().setFromObject(model);
    const size = bbox.getSize(new THREE.Vector3());
    const maxDimension = Math.max(size.x, size.y, size.z);
    const scaleFactor = 5 / maxDimension; // Scale the model to fit within 5 units
    model.scale.set(scaleFactor, scaleFactor, scaleFactor);
  }

  // Animation loop
  function animate() {
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();
}

let scene, camera, renderer;

export function initScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xd9d9d9); // Move this line up
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  camera.position.z = 5;
  addLights();

  // Render the initial scene with the light gray background
  renderer.render(scene, camera);
}

function addLights() {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(5, 5, 5);
  scene.add(directionalLight);
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
