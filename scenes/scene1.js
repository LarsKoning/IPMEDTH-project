import { FBXLoader, GLTFLoader, STLLoader } from 'three/examples/jsm/Addons.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

export function createScene1(scene, camera, renderer, gui, fileInput) {
    const loaderMap = {
        '.obj': new OBJLoader(),
        '.glb': new GLTFLoader(),
        '.fbx': new FBXLoader(),
        '.stl': new STLLoader(),
    };

    const filesList = ['Upload an object first'];
    const loadedObjects = {};
    let currentObject = null;

    // Add event listener and accept for file input change
    fileInput.accept = '.obj,.glb,.fbx,.stl'
    fileInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (file) {
            // Validate the file type
            const fileExtension = await file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
            
            if(['.obj', '.glb', '.fbx', '.stl'].includes(fileExtension)) {
                console.log(`File uploaded: ${file.name}`);

                const fileURL = URL.createObjectURL(file);

                try{
                    const object = await new Promise((resolve, reject) => {
                        loaderMap[fileExtension].load(
                            fileURL,
                            (loadedObjects) => resolve(loadedObjects),
                            undefined,
                            (error) => reject(error)
                        );
                    });

                    loadedObjects[file.name] = object;

                    if (filesList[0] === 'Upload an object first') {
                        filesList.shift();
                    }

                    if (currentObject) {
                        scene.remove(currentObject);
                    }
                    currentObject = object;
                    scene.add(currentObject);
                    selection.setValue(file.name);
                    
                    filesList.push(file.name);
                    selection.options(filesList);
                    alert(`Successfully loaded: ${file.name}`);
                } catch (error) {
                    console.error(`Error loading file: ${file.name}`, error)
                }                
            } else {
                alert('Invalid file type. Please upload a .obj, .glb, .fbx or .stl file.');
            }
        }
    });

    // Define all settings
    const obj = {
        upload: function() { fileInput.click() },
        select: 'Select',
        recieve: false,
        cast: false,
        rotate: false,
        zoom: 75,
        rotation: 0,
        panning: 50,
        strength: 75,
        color: '#FFFFFF',
    }

    // Initiate the settings and put in folders (IN ORDER FROM TOP TO BOTTOM)
    gui.add(obj, 'upload').name('Upload object');
    let selection = gui.add(obj, 'select', filesList).name('Select object');

    selection.onChange((selectedName) => {
        if (loadedObjects[selectedName]) {
            // Remove current object from the scene
            if (currentObject) {
                scene.remove(currentObject);
            }

            // Add the selected object to the scene
            currentObject = loadedObjects[selectedName];
            scene.add(currentObject);
        }
    });

    const Position = gui.addFolder('Positie en aanpassingen');

    Position.add(obj, 'panning', 0, 100).name('Positie');
    Position.add(obj, 'rotation', -100, 100).name('Rotatie')
    Position.add(obj, 'zoom', 0, 100).name('Schaal');

    const lighting = gui.addFolder('Belichting');

    lighting.add(obj, 'strength', 0, 100).name('Sterkte');
    lighting.addColor(obj, 'color').name('Kleur');
    lighting.add(obj, 'recieve').name('Schaduwen');
    lighting.add(obj, 'cast').name('Eigen schaduw');

    const animations = gui.addFolder('Animaties');

    animations.add(obj, 'rotate').name('Automatisch draaien');

    var inputs = document.getElementsByTagName('input');

    for(var i = 0; i < inputs.length; i++) {
        if(inputs[i].type.toLocaleLowerCase() == 'checkbox') {
            const span = document.createElement('span');
            span.classList.add('slider');
            inputs[i].parentElement.appendChild(span);
        }
    }

    function animate() {
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }
    animate();
}
