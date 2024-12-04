export function createScene2(scene, camera, renderer) {
  const loader = new THREE.TextureLoader();

  let fileInput = document.getElementById("fileInput");
  if (!fileInput) {
    fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".png,.jpg";
    fileInput.id = "fileInput";
    fileInput.style.position = "absolute";
    document.body.appendChild(fileInput);
  }

  fileInput.onchange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      const dataURL = e.target.result;

      // Laad de afbeelding in een HTMLImageElement
      const image = new Image();
      image.onload = () => {
        // Gebruik de breedte en hoogte van de afbeelding
        const imageWidth = image.width;
        const imageHeight = image.height;

        loader.load(
          dataURL,
          (texture) => {
            console.log("Texture geladen:", texture);

            // Gebruik de afmetingen van de afbeelding voor het vlak
            const geometry11 = new THREE.PlaneGeometry(
              imageWidth / 100,
              imageHeight / 100
            ); // Schaal de grootte
            const material11 = new THREE.MeshBasicMaterial({ map: texture });
            const plane11 = new THREE.Mesh(geometry11, material11);

            plane11.position.set(0, 0, -2); // Plaats het recht voor de camera
            scene.add(plane11);
          },
          undefined,
          (error) => {
            console.error("Fout bij het laden van texture:", error);
          }
        );
      };

      image.src = dataURL; // Stel de data-URL in als bron van de afbeelding
    };

    reader.readAsDataURL(file);
  };

  // Debug: Camera en renderer instellen
  camera.position.z = 10;
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }
  animate();
}
