import { load } from "@loaders.gl/core";
import { LASLoader } from "@loaders.gl/las";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { log } from "three/webgpu";

export function createScene3(scene, camera, renderer) {
  

  // Animate the plane vertices
  function animate() {
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();

  // Create and add file input to the document
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.id = "fileInput";
  fileInput.accept = ".las,.laz";
  fileInput.style.position = "absolute";
  fileInput.style.zIndex = 10;
  fileInput.style.top = "10px";
  fileInput.style.left = "10px";
  document.body.appendChild(fileInput);

  console.log("File input created and added to the DOM.");

  // Event listener for file input
  fileInput.addEventListener("change", async function (event) {
    const file = event.target.files[0];
    if (!file) {
      console.error("No file selected.");
      return;
    }

    const reader = new FileReader();
    reader.onload =  function (event) {
      console.log("Doing something with the file...");
      
      const arrayBuffer =  event.target.result;

      // Use LASLoader to parse the file
      const pointCloudData =  load(arrayBuffer, LASLoader);
      console.log("Point cloud data loaded:", pointCloudData);
      

      // Render
      renderPointCloud(pointCloudData);
    };
    reader.onerror = function () {
      console.error("Error reading the file:". reader.error);
      alert("Error reading the file.");
    };
  });
}

function renderPointCloud(pointCloudData) {
  console.log("Rendering point cloud data...");

  // Create a new geometry
  const geometry = new THREE.BufferGeometry();

  // Add positions attribute
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(pointCloudData.attributes.POSITION.value, 3)
  );

  // Add colors attribute
  geometry.setAttribute(
    "color",
    new THREE.BufferAttribute(pointCloudData.attributes.COLOR_0.value, 3)
  );

  // Create a new material
  const material = new THREE.PointsMaterial({
    size: 0.01,
    vertexColors: true,
  });

  // Create a new point cloud
  const pointCloud = new THREE.Points(geometry, material);

  // Add the point cloud to the scene
  scene.add(pointCloud);
}
