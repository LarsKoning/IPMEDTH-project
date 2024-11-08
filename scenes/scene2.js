export function createScene2(scene, camera, renderer) {
    const spheres = [];
    for (let i = 0; i < 5; i++) {
        const geometry = new THREE.SphereGeometry(0.3, 32, 32);
        const material = new THREE.MeshPhongMaterial({
            color: new THREE.Color(`hsl(${i * 72}, 100%, 50%)`)
        });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.x = (i - 2) * 1.2;
        spheres.push(sphere);
        scene.add(sphere);
    }

    function animate() {
        spheres.forEach((sphere, i) => {
            sphere.position.y = Math.sin(Date.now() * 0.001 + i) * 0.5;
        });
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }
    animate();
}
