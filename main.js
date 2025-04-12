import * as THREE from 'three';
// OrbitControls are useful for debugging, PointerLockControls for FPS
// import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- Basic Setup ---

// Scene
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(
    75, // Field of View (you can adjust this later)
    window.innerWidth / window.innerHeight, // Aspect Ratio
    0.1, // Near clipping plane
    1000 // Far clipping plane
);
camera.position.z = 5; // Move camera back a bit

// Renderer
const canvas = document.getElementById('webgl-canvas');
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true // You might turn this off later depending on the dither shader
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Improve sharpness on high DPI screens

// --- Example Object ---

// Geometry
const geometry = new THREE.BoxGeometry(1, 1, 1); // A simple cube

// Material (using basic material for now)
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); // Bright green

// Mesh (combine geometry and material)
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// --- Animation Loop ---

const clock = new THREE.Clock();

function animate() {
    const elapsedTime = clock.getElapsedTime();

    // Example animation: Rotate the cube
    cube.rotation.x = elapsedTime * 0.5;
    cube.rotation.y = elapsedTime * 0.5;

    // Render the scene from the perspective of the camera
    renderer.render(scene, camera);

    // Request the next frame
    requestAnimationFrame(animate);
}

// --- Handle Window Resize ---

window.addEventListener('resize', () => {
    // Update camera aspect ratio
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    // Update renderer size
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// --- Start Animation ---
animate();

console.log("Three.js scene initialized!");
// Next steps:
// 1. Add room geometry (walls, floor, ceiling)
// 2. Implement FPS controls (PointerLockControls)
// 3. Add lighting (even if minimal)
// 4. Implement the dithering post-processing shader
// 5. Add frames and interactive content