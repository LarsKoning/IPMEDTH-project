import * as THREE from "../node_modules/three/build/three.module.js";
import { OrbitControls } from "../node_modules/three/examples/jsm/controls/OrbitControls.js";
import { STLLoader } from "../node_modules/three/examples/jsm/loaders/STLLoader.js";
import { OBJLoader } from "../node_modules/three/examples/jsm/loaders/OBJLoader.js";

export function createScene4(scene, camera, renderer, setAnimationFrame) {
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
    fileInput.accept = ".stl,.obj"; // Allow only STL and OBJ files
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
      const stlLoader = new STLLoader();
      const reader = new FileReader();
      reader.onload = function (e) {
        const geometry = stlLoader.parse(e.target.result);
        const material = new THREE.MeshStandardMaterial({ color: 0x0077ff });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.x = -Math.PI / 2;
        scene.add(mesh);
      };
      reader.readAsArrayBuffer(file);
    } else if (fileExtension === "obj") {
      const objLoader = new OBJLoader();
      const reader = new FileReader();
      reader.onload = function (e) {
        const object = objLoader.parse(e.target.result);
        scene.add(object);
      };
      reader.readAsText(file);
    } else {
      alert("Invalid file type. Please upload a .stl or .obj file.");
    }
  };

  // Animation loop using setAnimationFrame for consistency
  function animate() {
    controls.update();
    renderer.render(scene, camera);
    setAnimationFrame(animate); // Correctly use the passed setAnimationFrame function
  }
  setAnimationFrame(animate); // Start the animation loop
}
