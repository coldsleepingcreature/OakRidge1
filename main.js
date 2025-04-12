import * as THREE from 'three';
// PointerLockControls are no longer needed

// --- Basic Setup ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const canvas = document.getElementById('webgl-canvas');
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// --- Room Dimensions ---
const roomWidth = 10;
const roomHeight = 6;
const roomDepth = 15;

// --- Materials ---
const wallMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000, // Black
    side: THREE.DoubleSide
});
const frameMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ff00, // Neon Green
    side: THREE.DoubleSide
});

// --- Geometry Creation ---
// (Floor, Ceiling, Walls, Frames code remains the same)
// Floor
const floorGeometry = new THREE.PlaneGeometry(roomWidth, roomDepth);
const floor = new THREE.Mesh(floorGeometry, wallMaterial);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -roomHeight / 2;
scene.add(floor);
// Ceiling
const ceilingGeometry = new THREE.PlaneGeometry(roomWidth, roomDepth);
const ceiling = new THREE.Mesh(ceilingGeometry, wallMaterial);
ceiling.rotation.x = Math.PI / 2;
ceiling.position.y = roomHeight / 2;
scene.add(ceiling);
// Back Wall
const backWallGeometry = new THREE.PlaneGeometry(roomWidth, roomHeight);
const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
backWall.position.z = -roomDepth / 2;
backWall.position.y = 0;
scene.add(backWall);
// Left Wall
const leftWallGeometry = new THREE.PlaneGeometry(roomDepth, roomHeight);
const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
leftWall.rotation.y = Math.PI / 2;
leftWall.position.x = -roomWidth / 2;
leftWall.position.y = 0;
scene.add(leftWall);
// Right Wall
const rightWallGeometry = new THREE.PlaneGeometry(roomDepth, roomHeight);
const rightWall = new THREE.Mesh(rightWallGeometry, wallMaterial);
rightWall.rotation.y = -Math.PI / 2;
rightWall.position.x = roomWidth / 2;
rightWall.position.y = 0;
scene.add(rightWall);
// Frame 1
const frameWidth = 2.5; const frameHeight = 1.8; const frameDepthOffset = 0.01;
const frame1Geometry = new THREE.PlaneGeometry(frameWidth, frameHeight);
const frame1 = new THREE.Mesh(frame1Geometry, frameMaterial);
frame1.position.set(-roomWidth / 4, 0, -roomDepth / 2 + frameDepthOffset);
scene.add(frame1);
// Frame 2
const frame2Geometry = new THREE.PlaneGeometry(frameWidth, frameHeight);
const frame2 = new THREE.Mesh(frame2Geometry, frameMaterial);
frame2.rotation.y = Math.PI / 2;
frame2.position.set(-roomWidth / 2 + frameDepthOffset, 0.5, -roomDepth / 4);
scene.add(frame2);


// --- Camera Setup ---
const playerHeight = 1.7; // Approx height of camera from floor
camera.position.set(0, -roomHeight / 2 + playerHeight, roomDepth / 2 - 2);
camera.rotation.order = 'YXZ'; // Ensure Y rotation (left/right) happens first
camera.rotation.x = 0; // Lock pitch (up/down look)

// --- Arena Controls Parameters ---
const turnAngle = Math.PI / 12; // 15 degrees per turn (adjust as needed)
const gridSize = 1.0;          // How far to move in one step
const actionCooldown = 150;    // Milliseconds between actions
let canPerformAction = true;   // Cooldown flag

// --- Camera Bobbing Parameters ---
const bobFrequency = 1.8;      // How fast the bobbing is (Hz)
const bobAmplitude = 0.04;     // How high the bobbing goes
let isMoving = false;          // Is the player currently moving forward/backward?
const baseCameraY = camera.position.y; // Store the non-bobbing Y position

// --- Keyboard Input ---
const keysPressed = {}; // Still useful to know if a key *is* down, even if action is discrete

document.addEventListener('keydown', (event) => {
    if (!keysPressed[event.code]) { // Process only on the first press
        keysPressed[event.code] = true;

        if (canPerformAction) {
            let actionTaken = false;

            // Turning (A/D or Left/Right)
            if (event.code === 'KeyA' || event.code === 'ArrowLeft') {
                camera.rotation.y += turnAngle;
                actionTaken = true;
            } else if (event.code === 'KeyD' || event.code === 'ArrowRight') {
                camera.rotation.y -= turnAngle;
                actionTaken = true;
            }

            // Movement (W/S or Up/Down)
            else if (event.code === 'KeyW' || event.code === 'ArrowUp') {
                // Calculate forward vector based on current Y rotation
                const forward = new THREE.Vector3(0, 0, -1);
                forward.applyEuler(camera.rotation); // Apply camera's rotation
                camera.position.add(forward.multiplyScalar(gridSize));
                isMoving = true; // Start bobbing
                actionTaken = true;
            } else if (event.code === 'KeyS' || event.code === 'ArrowDown') {
                // Calculate backward vector
                const backward = new THREE.Vector3(0, 0, 1);
                backward.applyEuler(camera.rotation); // Apply camera's rotation
                camera.position.add(backward.multiplyScalar(gridSize));
                isMoving = true; // Start bobbing
                actionTaken = true;
            }

            if (actionTaken) {
                canPerformAction = false;
                setTimeout(() => {
                    canPerformAction = true;
                }, actionCooldown);
            }
        }
    }
});

document.addEventListener('keyup', (event) => {
    keysPressed[event.code] = false;
    // Stop bobbing ONLY if the specific move keys are released
    if ((event.code === 'KeyW' || event.code === 'ArrowUp' || event.code === 'KeyS' || event.code === 'ArrowDown')) {
        // Check if *any* move key is still pressed
        if (!keysPressed['KeyW'] && !keysPressed['ArrowUp'] && !keysPressed['KeyS'] && !keysPressed['ArrowDown']) {
           isMoving = false;
        }
    }
});


// --- Animation Loop ---
const clock = new THREE.Clock();

function animate() {
    const elapsedTime = clock.getElapsedTime();

    // --- Apply Camera Bob ---
    if (isMoving) {
        const bobOffset = Math.sin(elapsedTime * bobFrequency * 2 * Math.PI) * bobAmplitude;
        // Apply bob relative to the base height, not current potentially bobbed height
        camera.position.y = baseCameraY + bobOffset;
    } else {
        // Smoothly return to base height when stopping (optional, could just snap)
        if (camera.position.y !== baseCameraY) {
             camera.position.y += (baseCameraY - camera.position.y) * 0.1; // Simple lerp back
             // Snap if very close to prevent infinite small adjustments
             if (Math.abs(camera.position.y - baseCameraY) < 0.001) {
                 camera.position.y = baseCameraY;
             }
        }
    }

    // --- Lock Pitch ---
    // Force camera pitch to 0 every frame to prevent accidental drift
    camera.rotation.x = 0;

    // Render the scene
    renderer.render(scene, camera);

    // Request the next frame
    requestAnimationFrame(animate);
}

// --- Handle Window Resize ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // Note: Resizing might slightly affect the perceived bobbing, but base Y is constant
});

// --- Start Animation ---
animate();

console.log("Arena-style controls initialized. Use WASD/Arrows.");
