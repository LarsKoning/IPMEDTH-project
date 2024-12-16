export function createScene2(scene, camera, renderer, gui, fileInput) {
    fileInput.accpet = '.jpg,.jpeg,.png'
    fileInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (file) {
            const fileExtension = await file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
            
            if(['.jpg', '.jpeg', '.png'].includes(fileExtension)) {
                console.log(`File uploaded: ${file.name}`);
            } else {
                alert('Invalid file type. Please upload a .jpg, .jpeg or .png')
            }
        }
    })

    const settings = {
        upload: function() { fileInput.click() }
    }

    gui.add(settings, 'upload').name('Upload een Panorama');


    function animate() {
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }
    animate();
}
