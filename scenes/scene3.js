export function createScene3(scene, camera, renderer, gui, fileInput) {
        // Event listener and accept for file input
    fileInput.accept = '.las,.laz,.ply'; 
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const fileExtension = file.name.split('.').pop().toLowerCase();

            if (['.las', '.laz', '.ply'].includes(fileExtension)) {
                console.log(`File uploaded: ${file.name}`);
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
            }
        } else {
            alert('Invalid file type. Please upload a .las, .laz or .ply file.');
        }
    });

    const settings = {
        upload: function() { fileInput.click() },
        positionX: 0,
        positionY: 0,
        positionZ: 0,
        rotationX: 0,
        rotationY: 0,
        rotationZ: 0,
        pointSize: 0,
        colorType: 'Hoogte-gebaseerd',
        density: 1,
    }

    gui.add(settings, 'upload').name('Upload Puntenwolk');
    
    // Position, Rotation and Scale
    // TODO: Adding controls and see if we need rotation on the X and Z
    const position = gui.addFolder('Positie en aanpassingen');
    position.add(settings, 'positionX', -10, 10).name('Links - Rechts').onChange(() => { if (mesh) mesh.position.x = settings.positionX; });
    position.add(settings, 'positionY', -10, 10).name('Omlaag - Omhaag').onChange(() => { if (mesh) mesh.position.y = settings.positionY; });
    position.add(settings, 'positionZ', -10, 10).name('Zoom').onChange(() => { if (mesh) mesh.position.z = settings.positionZ; });
    // position.add(settings, 'rotationX', 0, Math.PI * 2).name('Kantelen (Voor - Achter)').onChange(() => { if (mesh) mesh.rotation.x = settings.rotationX; });
    position.add(settings, 'rotationY', 0, Math.PI * 2).name('Draaien').onChange(() => { if (mesh) mesh.rotation.y = settings.rotationY; });
    // position.add(settings, 'rotationZ', 0, Math.PI * 2).name('Kantelen (Links - Rechts)').onChange(() => { if (mesh) mesh.rotation.z = settings.rotationZ; });


    // Pointcloud settings
    const pointcloud = gui.addFolder('Puntenwolk weergave en verfijning');
    pointcloud.add(settings, 'pointSize', -10, 10).name('Puntgrootte');
    pointcloud.add(settings, 'colorType', ['RGB-kleuren', 'Hoogte-gebaseerd', 'Intensiteti-gebaseerd']).name('Kleurenmodus');
    pointcloud.add(settings, 'density', -10, 10).name('Dichtheid');


    // Animate the plane vertices
    function animate() {
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }
    animate();
}
