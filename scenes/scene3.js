import { PLYLoader } from 'three/addons/loaders/PLYLoader.js';

export function createScene3(scene, camera, renderer) {
  // Function to load and render PLY file
  function loadPLYFile(filePath) {
    const loader = new PLYLoader();
    loader.load(
      filePath,
      function (geometry) {

        geometry.computeVertexNormals();

        const material = new THREE.MeshStandardMaterial({ color: 0x0055ff, flatShading: true });
        const mesh = new THREE.Mesh(geometry, material);

        mesh.position.y = -0.2;
        mesh.position.z = 0.3;
        mesh.rotation.x = -Math.PI / 2;
        mesh.scale.multiplyScalar(0.001);

        mesh.castShadow = true;
        mesh.receiveShadow  = true;

        scene.add(mesh);
        console.log("PLY file loaded and added to the scene.");
      },
      function (xhr) {
        console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
      },
      function (error) {
        console.error('Error loading PLY file:', error);
        alert('Error loading PLY file: ' + error.message);
      }
    );
  }

  // Call the function to load the PLY file
  const filePath = 'your_file.ply'; // Ensure this path is correct and accessible
  console.log(`Attempting to load PLY file from path: ${filePath}`);
  loadPLYFile(filePath);

  // Render loop
  function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }
  animate();
}
