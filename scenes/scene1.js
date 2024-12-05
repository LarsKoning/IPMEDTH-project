import GUI from 'lil-gui';

export function createScene1(scene, camera, renderer, gui, fileInput) {
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);



    // Add event listener for file input change
    fileInput.accept = '.obj,.glb'

    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            // Validate the file type
            const allowedExtensions = ['.obj', '.glb'];
            const fileExtension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
            
            if (allowedExtensions.includes(fileExtension)) {
                console.log(`File uploaded: ${file.name}`);
                // Perform further actions here, such as reading the file or using it in your 3D scene
            } else {
                alert('Invalid file type. Please upload a .obj or .glb file.');
            }
        }
    });

    // Define all settings
    const obj = {
        upload: function() { fileInput.click() },
        autoRotate: false,
        zoom: 75,
        panning: 50,
        strength: 75,
        color: '#FFFFFF',
    }

    // Initiate the settings and put in folders (IN ORDER FROM TOP TO BOTTOM)
    gui.add(obj, 'upload').name('Upload object');

    const movement = gui.addFolder('Movement');

    movement.add(obj, 'autoRotate').name('Auto rotate');
    movement.add(obj, 'zoom', 0, 100).name('Zoom');
    movement.add(obj, 'panning', 0, 100).name('Panning');

    const lighting = gui.addFolder('Lighting');

    lighting.add(obj, 'strength', 0, 100).name('Strength');
    lighting.addColor(obj, 'color').name('Color');

    var inputs = document.getElementsByTagName('input');

    for(var i = 0; i < inputs.length; i++) {
        if(inputs[i].type.toLocaleLowerCase() == 'checkbox') {
            const span = document.createElement('span');
            span.classList.add('slider');
            inputs[i].parentElement.appendChild(span);
        }
    }

    function animate() {
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }
    animate();
}
