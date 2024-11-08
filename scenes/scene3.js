export function createScene3(scene, camera, renderer) {
    const geometry = new THREE.PlaneGeometry(10, 10, 50, 50);
    const material = new THREE.MeshPhongMaterial({
        color: 0x4488ff,
        wireframe: true
    });
    const plane = new THREE.Mesh(geometry, material);
    plane.rotation.x = -Math.PI / 2;
    scene.add(plane);

    function animate() {
        const positions = geometry.attributes.position;
        const time = Date.now() * 0.001;

        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const y = positions.getY(i);
            positions.setZ(i, Math.sin(x + time) * 0.5 + Math.cos(y + time) * 0.5);
        }
        positions.needsUpdate = true;
        
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }
    animate();
}
