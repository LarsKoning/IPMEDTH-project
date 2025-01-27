import { getDownloadURL, listAll } from "firebase/storage";
import { panoramaRef } from "../API.js";

export function createScene2(scene, camera, renderer, gui, controls) {
	controls.enabled = true;
	let currentFile = null;

	function loadPanoramasFromStorage() {
		listAll(panoramaRef).then((result) => {
			const promises = result.items.map((itemRef) => {
				return getDownloadURL(itemRef).then((url) => ({
					name: itemRef.name,
					url,
				}));
			});

			// Wait for all download URLs to be resolved
			Promise.all(promises).then((files) => {
				// Sort files by name in ascending order
				files.sort((a, b) => a.name.localeCompare(b.name));

				// Add sorted files to the GUI
				files.forEach((file, index) => {
					// Add the image to the GUI with a click handler
					const elementController = mediaViewerFolder.add(
						{ [file.name]: () => selectFile(file) },
						file.name
					);

					// Create a thumbnail for the image
					const thumbnail = document.createElement("img");
					thumbnail.src = file.url;
					thumbnail.style.width = "50px"; // Adjust thumbnail size as needed
					thumbnail.style.height = "50px";
					thumbnail.style.margin = "5px";
					thumbnail.style.cursor = "pointer";

					thumbnail.addEventListener("click", () => {
						selectFile(file);
						highlightThumbnail(thumbnail);
					});

					// Append the thumbnail to the GUI element
					const domElement = elementController.domElement;
					domElement.style.backgroundImage = `url(${file.url})`;
				});
			});
		});
	}

	// Highlight geselecteerde thumbnail
	function highlightThumbnail(selectedThumbnail) {
		const allThumbnails = document.querySelectorAll("img");
		allThumbnails.forEach(
			(img) => (img.style.border = "2px solid transparent")
		);
		selectedThumbnail.style.border = "2px solid #00f";
	}

	// Selecteer een bestand
	function selectFile(file) {
		currentFile = file;

		// Direct proberen om als panorama te laden
		while (scene.children.length > 0) {
			const object = scene.children[0];
			if (object.geometry) object.geometry.dispose();
			if (object.material) {
				if (object.material.map) object.material.map.dispose();
				object.material.dispose();
			}
			scene.remove(object);
		}
		sphereMesh = null;
		const loader = new THREE.ImageLoader();

		loader.load(
			file.url,
			(image) => {
				// Valideer of het bestand een panorama is
				if (image.width / image.height == 2) {
					// Maak een texture van de geladen afbeelding
					const texture = new THREE.Texture();
					texture.image = image;
					texture.needsUpdate = true;

					// Maak een bolvorm voor het panorama
					const sphereGeometry = new THREE.SphereGeometry(500, 32, 32); // Verminder segmenten voor performance
					sphereGeometry.scale(-1, 1, 1);

					const sphereMaterial = new THREE.MeshBasicMaterial({ map: texture });
					sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);

					scene.add(sphereMesh);
					console.log("Panorama succesvol geladen.");
				} else {
					alert(
						"Dit bestand lijkt geen geldig panorama te zijn, ga naar de Foto's omgeving."
					);
				}
			},
			undefined,
			(error) => {
				console.error("Error loading panorama image:", error);
				alert(
					"De panorama kon niet worden geladen. Controleer het bestand of contacteer de beheerder."
				);
			}
		);
	}

	loadPanoramasFromStorage();

	// GUI instellingen
	const settings = {
		// No settings yet
	};

	var mediaViewerFolder = gui.addFolder("Galerij");
	const folderElement = mediaViewerFolder.domElement;
	folderElement.classList.add("photosFolder");

	function animate() {
		controls.update();
		renderer.render(scene, camera);
		requestAnimationFrame(animate);
	}

	animate();
}
