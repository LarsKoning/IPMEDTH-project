import { FBXLoader, GLTFLoader, STLLoader } from 'three/examples/jsm/Addons.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

export function createScene1(scene, camera, renderer, gui, fileInput) {
    const hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 2 );
    hemiLight.color.setHSL( 0.6, 1, 0.6 );
    hemiLight.groundColor.setHSL( 0.095, 1, 0.75 );
    hemiLight.position.set( 0, 50, 0 );
    scene.add( hemiLight );

    const dirLight = new THREE.DirectionalLight( 0xffffff, 3 );
    dirLight.color.setHSL( 0.1, 1, 0.95 );
    dirLight.position.set( - 1, 1.75, 1 );
    dirLight.position.multiplyScalar( 30 );
    scene.add( dirLight );

    dirLight.castShadow = true;
    
    // Map of loaders for different file formats
    const loaderMap = {
        '.obj': new OBJLoader(),
        '.glb': new GLTFLoader(),
        '.fbx': new FBXLoader(),
        '.stl': new STLLoader(),
    };

    const filesList = ['Upload an object first']; // Initial placeholder
    const loadedObjects = {}; // To store loaded objects
    let currentObject = null; // Track currently displayed object

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
                    // Load object using appropriate loader
                    const object = await new Promise((resolve, reject) => {
                        loaderMap[fileExtension].load(
                            fileURL,
                            (loadedObjects) => resolve(loadedObjects),
                            undefined,
                            (error) => reject(error)
                        );
                    });

                    loadedObjects[file.name] = object;

                    // Remove placeholder if it's still in the list
                    if (filesList[0] === 'Upload an object first') {
                        filesList.shift();
                    }

                    // Automatically display the uploaded object
                    if (currentObject) {
                        scene.remove(currentObject);
                    }
                    currentObject = object;
                    scene.add(currentObject);
                    selection.setValue(file.name); // Update dropdown to reflect current object
                    
                    filesList.push(file.name);
                    selection.options(filesList);
                    alert(`Successfully loaded: ${file.name}`);
                } catch (error) {
                    alert(`Error loading file: ${file.name}`)
                    console.error(error);
                }                
            } else {
                alert('Invalid file type. Please upload a .obj, .glb, .fbx or .stl file.');
            }
        }
    });

    // Define settings for GUI
    const obj = {
        upload: function() { fileInput.click() },
        select: 'Select',
        positionX: 0,
        positionY: 0,
        positionZ: 0,
        rotationX: 0,
        rotationY: 0,
        rotationZ: 0,
        castShadow: false,
        receiveShadow: false,
        autoRotate: false,
        rotationSpeed: 0.01,
        color: '#FFFFFF',
    }

    // Initiate the settings and put in folders (IN ORDER FROM TOP TO BOTTOM)
    // File management
    gui.add(obj, 'upload').name('Upload 3D object');
    let selection = gui.add(obj, 'select', filesList).name('Select 3D object');

    // TODO: Reset gui when new model is loaded
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

    // Position, Rotation, and Scale
    // TODO: Adding controls and see if we need rotation on the X and Z
    const position = gui.addFolder('Positie en aanpassingen');
    position.add(obj, 'positionX', -10, 10).name('Links - Rechts').onChange(() => { if (currentObject) currentObject.position.x = obj.positionX; });
    position.add(obj, 'positionY', -10, 10).name('Omlaag - Omhaag').onChange(() => { if (currentObject) currentObject.position.y = obj.positionY; });
    position.add(obj, 'positionZ', -10, 10).name('Zoom').onChange(() => { if (currentObject) currentObject.position.z = obj.positionZ; });
    // position.add(obj, 'rotationX', 0, Math.PI * 2).name('Kantelen (Voor - Achter)').onChange(() => { if (currentObject) currentObject.rotation.x = obj.rotationX; });
    position.add(obj, 'rotationY', 0, Math.PI * 2).name('Draaien').onChange(() => { if (currentObject) currentObject.rotation.y = obj.rotationY; });
    // position.add(obj, 'rotationZ', 0, Math.PI * 2).name('Kantelen (Links - Rechts)').onChange(() => { if (currentObject) currentObject.rotation.z = obj.rotationZ; });


    // Lighting and Shadows
    // TODO: Lighting isn't right yet
    const lighting = gui.addFolder('Belichting');
    // lighting.add(obj, 'castShadow').name('Schaduw omgeving').onChange(() => { if (currentObject) {currentObject.traverse((child) => { if (child.isMesh) { child.castShadow = obj.castShadow }}) }});
    // lighting.add(obj, 'receiveShadow').name('Schaduw object').onChange(() => { if (currentObject) {currentObject.traverse((child) => { if (child.isMesh) { child.receiveShadow = obj.receiveShadow }}) }});
    // lighting.addColor(obj, 'color').name('Kleur licht').onChange(() => { hemiLight.color.set(obj.color); dirLight.color.set(obj.color) });

    // Animations
    const animations = gui.addFolder('Animaties');
    animations.add(obj, 'autoRotate').name('Automatisch draaien');
    animations.add(obj, 'rotationSpeed', 0, 0.1).name('Draai snelheid');

    // TODO: Reset button, animatie van een model zelf, save states?

    var inputs = document.getElementsByTagName('input');

    for(var i = 0; i < inputs.length; i++) {
        if(inputs[i].type.toLocaleLowerCase() == 'checkbox') {
            const span = document.createElement('span');
            span.classList.add('slider');
            inputs[i].parentElement.appendChild(span);
        }
    }

    function animate() {
        if (obj.autoRotate && currentObject) {
            currentObject.rotation.y += obj.rotationSpeed;
        }
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }
    animate();
}
