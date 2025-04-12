// Revert to this version (continuous movement, no debug logs)
import * as THREE from 'three';

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
const playerHeight = 1.7;
camera.position.set(0, -roomHeight / 2 + playerHeight, roomDepth / 2 - 2);
camera.rotation.order = 'YXZ';
camera.rotation.x = 0;
const baseCameraY = camera.position.y;

// --- Continuous Controls Parameters ---
const moveSpeed = 4.0;   // Units per second
const turnSpeed = Math.PI / 1.5; // Radians per second (adjust for desired turn rate)

// --- Camera Bobbing Parameters ---
const bobFrequency = 1.8; // Hz
const bobAmplitude = 0.04;
let isMoving = false; // Will be updated continuously in animate()

// --- Keyboard Input ---
const keysPressed = {};
const controlKeys = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

document.addEventListener('keydown', (event) => {
    // Hide Cursor on relevant key press
    if (controlKeys.includes(event.code)) {
        document.body.style.cursor = 'none';
    }
    // Just record the key press state
    keysPressed[event.code] = true;
});

document.addEventListener('keyup', (event) => {
    // Record the key release state
    keysPressed[event.code] = false;
});

// --- Show Cursor on Click ---
document.addEventListener('click', () => {
    document.body.style.cursor = 'default';
});


// --- Animation Loop ---
const clock = new THREE.Clock();
let previousTime = 0; // Keep track for deltaTime calculation

function animate() {
    requestAnimationFrame(animate); // Request next frame first

    const elapsedTime = clock.getElapsedTime();
    const deltaTime = elapsedTime - previousTime; // Time since last frame
    previousTime = elapsedTime;

    // --- Continuous Movement & Turning Logic ---
    let currentlyMovingForwardOrBackward = false; // Track for bobbing

    // Turning (A/D or Left/Right)
    if (keysPressed['KeyA'] || keysPressed['ArrowLeft']) {
        camera.rotation.y += turnSpeed * deltaTime;
    }
    if (keysPressed['KeyD'] || keysPressed['ArrowRight']) {
        camera.rotation.y -= turnSpeed * deltaTime;
    }

    // Movement (W/S or Up/Down)
    const currentMoveSpeed = moveSpeed * deltaTime; // Speed adjusted for frame duration
    if (keysPressed['KeyW'] || keysPressed['ArrowUp']) {
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyEuler(camera.rotation);
        camera.position.add(forward.multiplyScalar(currentMoveSpeed));
        currentlyMovingForwardOrBackward = true;
    }
    if (keysPressed['KeyS'] || keysPressed['ArrowDown']) {
        const backward = new THREE.Vector3(0, 0, 1); // Use positive Z for backward relative to camera
        backward.applyEuler(camera.rotation);
        camera.position.add(backward.multiplyScalar(currentMoveSpeed));
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

console.log("Continuous Arena-style controls active. Hold keys to move/turn.");
