import GUI from 'lil-gui';

export function createScene1(scene, camera, renderer, gui) {
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    const obj = {
        upload: function() { alert( 'hi' ) },
        autoRotate: false,
        zoom: 75,
        panning: 50,
        strength: 75,
        color: '#FFFFFF',
    }

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
