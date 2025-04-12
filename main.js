// Keep all code before this the same...

// --- Animation Loop ---
const clock = new THREE.Clock();
let previousTime = 0;

function animate() {
    requestAnimationFrame(animate);

    const elapsedTime = clock.getElapsedTime();
    const deltaTime = elapsedTime - previousTime;
    previousTime = elapsedTime;

    // --- Calculate Movement ---
    let currentlyMovingForwardOrBackward = false;
    const currentMoveSpeed = moveSpeed * deltaTime;
    const moveDirection = new THREE.Vector3();
    let applyMovement = false;

    // --- FIX: Declare collisionDetected outside the if block ---
    let collisionDetected = false;
    // --- END FIX ---

    // Turning
    if (keysPressed['KeyA'] || keysPressed['ArrowLeft']) { camera.rotation.y += turnSpeed * deltaTime; }
    if (keysPressed['KeyD'] || keysPressed['ArrowRight']) { camera.rotation.y -= turnSpeed * deltaTime; }

    // Forward/Backward intention
    if (keysPressed['KeyW'] || keysPressed['ArrowUp']) {
        moveDirection.set(0, 0, -1).applyEuler(camera.rotation);
        currentlyMovingForwardOrBackward = true;
        applyMovement = true;
    }
    if (keysPressed['KeyS'] || keysPressed['ArrowDown']) {
        moveDirection.set(0, 0, 1).applyEuler(camera.rotation);
        currentlyMovingForwardOrBackward = true; // Will be true if W or S is pressed
        applyMovement = true;
    }

    // --- Collision Detection ---
    if (applyMovement) {
        const moveVector = moveDirection.clone().multiplyScalar(currentMoveSpeed); // Clone before multiplying
        const moveLength = moveVector.length();

        raycaster.set(camera.position, moveDirection); // Direction should be normalized

        const intersects = raycaster.intersectObjects(collidableObjects);

        // No need to re-declare collisionDetected here
        if (intersects.length > 0) {
            if (intersects[0].distance < moveLength + playerRadius) {
                collisionDetected = true;
                console.log("Collision detected!");
            }
        }

        // --- Apply Movement (if no collision) ---
        if (!collisionDetected) {
            camera.position.add(moveVector);
        }
    }

    // Update isMoving based on *intention* and *actual* movement
    isMoving = currentlyMovingForwardOrBackward && !collisionDetected;

    // --- Apply Camera Bob ---
     if (isMoving) {
        const bobOffset = Math.sin(elapsedTime * bobFrequency * 2 * Math.PI) * bobAmplitude;
        const potentialY = baseCameraY + bobOffset;
        const ceilingLimit = roomHeight / 2 - playerRadius;
        const floorLimit = -roomHeight / 2 + playerRadius;
        camera.position.y = THREE.MathUtils.clamp(potentialY, floorLimit, ceilingLimit);
    } else {
        if (Math.abs(camera.position.y - baseCameraY) > 0.001) {
             camera.position.y += (baseCameraY - camera.position.y) * 0.1;
        } else {
             camera.position.y = baseCameraY;
        }
    }

    // --- Lock Pitch ---
    camera.rotation.x = 0;

    // Render using the composer
    composer.render(deltaTime);
}

// Keep all code after this the same...

// --- Handle Window Resize ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight); renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    composer.setSize(window.innerWidth, window.innerHeight); composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    if (ditherPass && ditherPass.uniforms.resolution) {
        ditherPass.uniforms.resolution.value.set(window.innerWidth * window.devicePixelRatio, window.innerHeight * window.devicePixelRatio);
    }
});

// --- Start Animation ---
document.body.style.cursor = 'default';
previousTime = clock.getElapsedTime();
animate();

console.log("Basic wall collision detection added (Scope Fixed).");
