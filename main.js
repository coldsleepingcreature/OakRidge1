import * as THREE from 'three';
// Later, you might need controls like PointerLockControls:
// import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// --- Basic Setup ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const canvas = document.getElementById('webgl-canvas');
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true // Keep true for now, might disable later for specific shader effects
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// --- Room Dimensions ---
const roomWidth = 10;
const roomHeight = 6;
const roomDepth = 15; // Making it deeper than wide

// --- Materials ---
// A simple black material for the room surfaces
const wallMaterial = new THREE.MeshBasicMaterial({
    color: #000000, // Black
    side: THREE.DoubleSide // Render both sides (important for walls viewed from inside)
});

// A contrasting material for the frames (e.g., Dark grey)
const frameMaterial = new THREE.MeshBasicMaterial({
    color: 0x333333, // Dark grey
    side: THREE.DoubleSide // Render both sides
});

// --- Geometry Creation ---

// Floor
const floorGeometry = new THREE.PlaneGeometry(roomWidth, roomDepth);
const floor = new THREE.Mesh(floorGeometry, wallMaterial);
floor.rotation.x = -Math.PI / 2; // Rotate plane to be horizontal
floor.position.y = -roomHeight / 2; // Position at the bottom
scene.add(floor);

// Ceiling
const ceilingGeometry = new THREE.PlaneGeometry(roomWidth, roomDepth);
const ceiling = new THREE.Mesh(ceilingGeometry, wallMaterial);
ceiling.rotation.x = Math.PI / 2; // Rotate plane to be horizontal and face down
ceiling.position.y = roomHeight / 2; // Position at the top
scene.add(ceiling);

// Walls
// Back Wall (negative Z)
const backWallGeometry = new THREE.PlaneGeometry(roomWidth, roomHeight);
const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
backWall.position.z = -roomDepth / 2; // Position at the back
backWall.position.y = 0; // Center vertically
scene.add(backWall);

// Left Wall (negative X)
const leftWallGeometry = new THREE.PlaneGeometry(roomDepth, roomHeight); // Note: Depth is width here
const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
leftWall.rotation.y = Math.PI / 2; // Rotate to face inwards
leftWall.position.x = -roomWidth / 2; // Position on the left
leftWall.position.y = 0; // Center vertically
scene.add(leftWall);

// Right Wall (positive X)
const rightWallGeometry = new THREE.PlaneGeometry(roomDepth, roomHeight); // Note: Depth is width here
const rightWall = new THREE.Mesh(rightWallGeometry, wallMaterial);
rightWall.rotation.y = -Math.PI / 2; // Rotate to face inwards
rightWall.position.x = roomWidth / 2; // Position on the right
rightWall.position.y = 0; // Center vertically
scene.add(rightWall);

// NOTE: We are omitting the Front Wall (positive Z) so we can see inside easily.

// --- Frames (Placeholders) ---
const frameWidth = 2.5;
const frameHeight = 1.8;
const frameDepthOffset = 0.01; // Tiny offset to prevent z-fighting with wall

// Frame 1 (on Back Wall)
const frame1Geometry = new THREE.PlaneGeometry(frameWidth, frameHeight);
const frame1 = new THREE.Mesh(frame1Geometry, frameMaterial);
frame1.position.set(
    -roomWidth / 4,      // Position horizontally on the back wall
    0,                   // Position vertically (centered for now)
    -roomDepth / 2 + frameDepthOffset // Slightly in front of the back wall
);
scene.add(frame1);

// Frame 2 (on Left Wall)
const frame2Geometry = new THREE.PlaneGeometry(frameWidth, frameHeight); // Can reuse geometry or make new if different size
const frame2 = new THREE.Mesh(frame2Geometry, frameMaterial);
frame2.rotation.y = Math.PI / 2; // Match left wall's rotation
frame2.position.set(
    -roomWidth / 2 + frameDepthOffset, // Slightly in front of the left wall
    0.5,                 // Position vertically (a bit higher)
    -roomDepth / 4       // Position along the depth of the left wall
);
scene.add(frame2);

// --- Camera Position ---
// Place the camera inside the room, near the front
camera.position.set(0, 0, roomDepth / 2 - 2); // Start slightly inside the front opening
camera.lookAt(0, 0, 0); // Look towards the center/back

// --- Animation Loop ---
// No objects are animated by default now, but the loop is needed for rendering
function animate() {
    // Update controls here later (e.g., controls.update())

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
});

// --- Start Animation ---
animate();

console.log("Three.js scene initialized with room geometry!");
// Next steps:
// 1. Implement FPS controls (e.g., PointerLockControls)
// 2. Add basic lighting (even if aiming for Obra Dinn style, some light helps define form initially)
// 3. Start working on the post-processing dithering shader
// 4. Replace frame placeholders with actual content/textures
