import {LASLoader} from '@loaders.gl/las';
import {load} from '@loaders.gl/core';

export function createScene3(scene, camera, renderer) {
    // Plane Geometry
    const geometry = new THREE.PlaneGeometry(10, 10, 50, 50);
    const material = new THREE.MeshPhongMaterial({
        color: 0x4488ff,
        wireframe: true
    });
    const plane = new THREE.Mesh(geometry, material);
    plane.rotation.x = -Math.PI / 2;
    scene.add(plane);

    // Animate the plane vertices
    function animate() {
        const positions = geometry.attributes.position;
        const time = Date.now() * 0.001;

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
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'fileInput';
    fileInput.style.position = 'absolute';
    fileInput.style.zIndex = 10;
    fileInput.style.top = '10px';
    fileInput.style.left = '10px';
    document.body.appendChild(fileInput);

    console.log('File input created and added to the DOM.');

    // Event listener for file input
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const fileExtension = file.name.split('.').pop().toLowerCase();

            if (fileExtension !== 'las') {
                console.error('Invalid file type. Please upload a .las file.');
                alert('Error: Invalid file type. Please upload a .las file.');
                fileInput.value = ''; // Reset file input
                return;
            }

            console.log('Valid .las file selected:', file.name);
            const reader = new FileReader();

            reader.onload = function (e) {
                console.log('File read successfully:', e.target.result);

                // Placeholder for handling .las file content
                console.log('Ready to process .las file content.');
            };

            reader.onerror = function (error) {
                console.error('Error reading file:', error);
            };

            reader.readAsArrayBuffer(file); // Read the file as a binary buffer
        } else {
            console.log('No file selected.');
        }
    });
}
