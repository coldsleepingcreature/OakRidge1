// --- Animation Loop ---
const clock = new THREE.Clock();
let previousTime = 0; // Keep track for deltaTime calculation

function animate() {
    requestAnimationFrame(animate); // Request next frame first

    const elapsedTime = clock.getElapsedTime();
    const deltaTime = elapsedTime - previousTime; // Time since last frame
    previousTime = elapsedTime;

    // --- Debugging Logs ---
    // console.log(`deltaTime: ${deltaTime.toFixed(5)}`); // Log delta time
    // console.log(`Keys Pressed: W=${!!keysPressed['KeyW']}, A=${!!keysPressed['KeyA']}, S=${!!keysPressed['KeyS']}, D=${!!keysPressed['KeyD']}`); // Log key states

    // --- Continuous Movement & Turning Logic ---
    let currentlyMovingForwardOrBackward = false; // Track for bobbing

    // Turning (A/D or Left/Right)
    if (keysPressed['KeyA'] || keysPressed['ArrowLeft']) {
        const turnAmount = turnSpeed * deltaTime;
        camera.rotation.y += turnAmount;
        // console.log(`Turning Left: ${turnAmount.toFixed(4)}, New Y Rot: ${camera.rotation.y.toFixed(4)}`); // Log turning
    }
    if (keysPressed['KeyD'] || keysPressed['ArrowRight']) {
        const turnAmount = turnSpeed * deltaTime;
        camera.rotation.y -= turnAmount;
        // console.log(`Turning Right: ${turnAmount.toFixed(4)}, New Y Rot: ${camera.rotation.y.toFixed(4)}`); // Log turning
    }

    // Movement (W/S or Up/Down)
    const currentMoveSpeed = moveSpeed * deltaTime; // Speed adjusted for frame duration
    if (keysPressed['KeyW'] || keysPressed['ArrowUp']) {
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyEuler(camera.rotation);
        camera.position.add(forward.multiplyScalar(currentMoveSpeed));
        // console.log(`Moving Forward: ${currentMoveSpeed.toFixed(4)}, New Pos Z: ${camera.position.z.toFixed(4)}`); // Log movement
        currentlyMovingForwardOrBackward = true;
    }
    if (keysPressed['KeyS'] || keysPressed['ArrowDown']) {
        const backward = new THREE.Vector3(0, 0, 1); // Use positive Z for backward relative to camera
        backward.applyEuler(camera.rotation);
        camera.position.add(backward.multiplyScalar(currentMoveSpeed));
        // console.log(`Moving Backward: ${currentMoveSpeed.toFixed(4)}, New Pos Z: ${camera.position.z.toFixed(4)}`); // Log movement
        currentlyMovingForwardOrBackward = true;
    }

    // Update bobbing state based on current frame's movement
    isMoving = currentlyMovingForwardOrBackward;

    // --- Apply Camera Bob ---
    if (isMoving) {
        // Use elapsedTime for consistent bob cycle regardless of movement start/stop
        const bobOffset = Math.sin(elapsedTime * bobFrequency * 2 * Math.PI) * bobAmplitude;
        camera.position.y = baseCameraY + bobOffset;
    } else {
        // Smooth return to base height
        if (Math.abs(camera.position.y - baseCameraY) > 0.001) {
             camera.position.y += (baseCameraY - camera.position.y) * 0.1; // Simple lerp
        } else {
             camera.position.y = baseCameraY; // Snap if close
        }
    }

    // --- Lock Pitch ---
    camera.rotation.x = 0;

    // Render
    renderer.render(scene, camera);
}

// --- Handle Window Resize ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// --- Start Animation ---
document.body.style.cursor = 'default';
previousTime = clock.getElapsedTime(); // Initialize previousTime
animate();

console.log("Continuous Arena-style controls active. Hold keys to move/turn. (Debug logs added)");
