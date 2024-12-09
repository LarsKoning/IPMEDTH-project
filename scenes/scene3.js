import { load } from "@loaders.gl/core";
import { PCDLoader } from "@loaders.gl/pcd";
import { LASLoader } from "@loaders.gl/las";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function createScene3(scene, camera, renderer) {
  // Plane Geometry
  const geometry = new THREE.PlaneGeometry(10, 10, 50, 50);
  const material = new THREE.MeshPhongMaterial({
    color: 0x4488ff,
    wireframe: true,
  });

  const controls = new OrbitControls( camera, renderer.domElement );
  controls.update();
  const plane = new THREE.Mesh(geometry, material);
  plane.rotation.x = -Math.PI / 2;
  scene.add(plane);

  // Animate the plane vertices
  function animate() {
    const positions = geometry.attributes.position;
    const time = Date.now() * 0.001;

    controls.update();

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      positions.setZ(i, Math.sin(x + time) * 0.5 + Math.cos(y + time) * 0.5);
    }
    positions.needsUpdate = true;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();

  // Create and add file input to the document
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.id = "fileInput";
  fileInput.style.position = "absolute";
  fileInput.style.zIndex = 10;
  fileInput.style.top = "10px";
  fileInput.style.left = "10px";
  document.body.appendChild(fileInput);

  console.log("File input created and added to the DOM.");

  // Event listener for file input
  fileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
      const fileExtension = file.name.split(".").pop().toLowerCase();

      if (fileExtension !== "las") {
        console.error("Invalid file type. Please upload a .las file.");
        alert("Error: Invalid file type. Please upload a .las file.");
        fileInput.value = ""; // Reset file input
        return;
      }

      console.log("Valid .las file selected:", file.name);
      const reader = new FileReader();
      reader.onload = function (e) {
        console.log("File read successfully:", e.target.result);

        const fileContent = e.target.result; // Should be ArrayBuffer for LAS files

        try {
          // Load the LAS file content
          load(fileContent, LASLoader).then((pointCloudData) => {
            console.log("Point Cloud Data loaded:", pointCloudData);

            // Access the POSITION attribute which contains the point coordinates
            const positions = pointCloudData.attributes.POSITION.value;
            const colors = pointCloudData.attributes.COLOR_0 ? pointCloudData.attributes.COLOR_0.value : null;

            // Sanitize positions and colors
            const sanitizedPositions = sanitizePositions(positions);
            const sanitizedColors = colors ? sanitizeColors(colors) : [];

            const BATCH_SIZE = 100000;  // Smaller batch size to avoid memory overload
            let batchStart = 0;
            const renderNextBatch = () => {
              const batchEnd = Math.min(batchStart + BATCH_SIZE, sanitizedPositions.length);
              const positionArray = [];
              const colorArray = [];

              for (let i = batchStart; i < batchEnd; i += 3) {
                const x = sanitizedPositions[i];
                const y = sanitizedPositions[i + 1];
                const z = sanitizedPositions[i + 2];

                positionArray.push(x, y, z);

                if (sanitizedColors.length > 0) {
                  const r = sanitizedColors[i] || 1.0;
                  const g = sanitizedColors[i + 1] || 1.0;
                  const b = sanitizedColors[i + 2] || 1.0;
                  colorArray.push(r, g, b);
                } else {
                  colorArray.push(1.0, 1.0, 1.0); // Default to white
                }
              }

              const geometry = new THREE.BufferGeometry();
              geometry.setAttribute('position', new THREE.Float32BufferAttribute(positionArray, 3));
              geometry.setAttribute('color', new THREE.Float32BufferAttribute(colorArray, 3));

              if (geometry.attributes.position.count > 0) {
                geometry.computeBoundingSphere(); // This will compute the bounding sphere
              } else {
                console.error("Geometry has no valid points.");
              }

              const material = new THREE.PointsMaterial({
                size: 0.05,
                vertexColors: true,
                sizeAttenuation: true,
              });

              const points = new THREE.Points(geometry, material);
              scene.add(points);

              // Dispose of geometry and material to free memory after rendering
              geometry.dispose();
              material.dispose();

              batchStart = batchEnd;
              if (batchStart < sanitizedPositions.length) {
                requestAnimationFrame(renderNextBatch);
              }
            };

            renderNextBatch();
          }).catch((error) => {
            console.error("Error loading point cloud data:", error);
          });
        } catch (error) {
          console.error("Error processing .las file:", error);
        }
      };

      reader.onerror = function (error) {
        console.error("Error reading file:", error);
      };

      reader.readAsArrayBuffer(file);
    } else {
      console.log("No file selected.");
    }
  });
}

// Function to sanitize position data and filter out invalid values
function sanitizePositions(positions) {
  const sanitizedPositions = [];

  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];

    if (isNaN(x) || isNaN(y) || isNaN(z) || !isFinite(x) || !isFinite(y) || !isFinite(z)) {
      continue; // Skip invalid points
    }

    sanitizedPositions.push(x, y, z);
  }

  return sanitizedPositions;
}

// Function to sanitize color data and filter out invalid values
function sanitizeColors(colors) {
  const sanitizedColors = [];

  for (let i = 0; i < colors.length; i += 3) {
    const r = colors[i] / 255;
    const g = colors[i + 1] / 255;
    const b = colors[i + 2] / 255;

    // Check if the color values are valid
    if (isNaN(r) || isNaN(g) || isNaN(b) || !isFinite(r) || !isFinite(g) || !isFinite(b)) {
      continue; // Skip invalid colors
    }

    sanitizedColors.push(r, g, b);
  }

  return sanitizedColors;
}
