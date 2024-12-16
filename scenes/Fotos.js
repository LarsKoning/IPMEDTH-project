export function createScene0(scene, camera, renderer, gui, fileInput) {
    const filesList = []; // Initial placeholder

    // Add event listener and accept for file input change
    fileInput.accept = '.jpg, .jpeg, .png, .webp'
    fileInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (file) {
            // Validate the file type
            const fileExtension = await file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
            
            if(['.jpg', '.jpeg', '.png', '.webp'].includes(fileExtension)) {
                console.log(`File uploaded: ${file.name}`);
                     
            } else {
                alert('Invalid file type. Please upload a .jpg, .jpeg, .png or .webp file.');
            }
        }
    });

    // Define settings for GUI
    const settings = {
        upload: function() { fileInput.click() },
        exposure: 0,
        highlights: 0,
        shadows: 0,
    }

    // Initiate the settings and put in folders (IN ORDER FROM TOP TO BOTTOM)
    // File management
    gui.add(settings, 'upload').name("Upload Foto's");

    // Light settings
    const editing = gui.addFolder('Bewerkings opties');
    editing.add(settings, 'exposure', -100, 100).name('Helderheid');
    editing.add(settings, 'highlights', -100, 100).name('Highlights');
    editing.add(settings, 'shadows', -100, 100).name('Schaduwen');
    

    var inputs = document.getElementsByTagName('input');

    for(var i = 0; i < inputs.length; i++) {
        if(inputs[i].type.toLocaleLowerCase() == 'checkbox') {
            const span = document.createElement('span');
            span.classList.add('slider');
            inputs[i].parentElement.appendChild(span);
        }
    }

    function animate() {
        if (settings.autoRotate && currentObject) {
            currentObject.rotation.y += settings.rotationSpeed;
        }
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }
    animate();
}
