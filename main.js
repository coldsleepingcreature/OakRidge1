import * as THREE from 'three';
// Import post-processing modules
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

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
renderer.setClearColor(0x222222); // Keep clear color dark gray

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

// --- Room Dimensions ---
const roomWidth = 10;
const roomHeight = 6;
const roomDepth = 15;

// --- Materials ---
const wallMaterial = new THREE.MeshBasicMaterial({
    color: 0x222222, // Wall color set to dark gray
    side: THREE.DoubleSide
});
const frameMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ff00, // Neon Green
    side: THREE.DoubleSide
});

// --- Geometry Creation ---
// Floor, Ceiling, Walls, Frames use wallMaterial or frameMaterial
// (Code omitted for brevity - no changes here)
// Floor
const floorGeometry = new THREE.PlaneGeometry(roomWidth, roomDepth);
const floor = new THREE.Mesh(floorGeometry, wallMaterial); // Uses updated wallMaterial
floor.rotation.x = -Math.PI / 2;
floor.position.y = -roomHeight / 2;
scene.add(floor);
// Ceiling
const ceilingGeometry = new THREE.PlaneGeometry(roomWidth, roomDepth);
const ceiling = new THREE.Mesh(ceilingGeometry, wallMaterial); // Uses updated wallMaterial
ceiling.rotation.x = Math.PI / 2;
ceiling.position.y = roomHeight / 2;
scene.add(ceiling);
// Back Wall
const backWallGeometry = new THREE.PlaneGeometry(roomWidth, roomHeight);
const backWall = new THREE.Mesh(backWallGeometry, wallMaterial); // Uses updated wallMaterial
backWall.position.z = -roomDepth / 2;
backWall.position.y = 0;
scene.add(backWall);
// Left Wall
const leftWallGeometry = new THREE.PlaneGeometry(roomDepth, roomHeight);
const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial); // Uses updated wallMaterial
leftWall.rotation.y = Math.PI / 2;
leftWall.position.x = -roomWidth / 2;
leftWall.position.y = 0;
scene.add(leftWall);
// Right Wall
const rightWallGeometry = new THREE.PlaneGeometry(roomDepth, roomHeight);
const rightWall = new THREE.Mesh(rightWallGeometry, wallMaterial); // Uses updated wallMaterial
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
// (Code omitted for brevity - no changes here)
const playerHeight = 1.7;
camera.position.set(0, -roomHeight / 2 + playerHeight, roomDepth / 2 - 2);
camera.rotation.order = 'YXZ';
camera.rotation.x = 0;
const baseCameraY = camera.position.y;


// --- Controls & Input ---
// (Code omitted for brevity - no changes here)
const moveSpeed = 4.0;
const turnSpeed = Math.PI / 1.5;
const bobFrequency = 1.8;
const bobAmplitude = 0.04;
let isMoving = false;
const keysPressed = {};
const controlKeys = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
document.addEventListener('keydown', (event) => { if (controlKeys.includes(event.code)) { document.body.style.cursor = 'none'; } keysPressed[event.code] = true; });
document.addEventListener('keyup', (event) => { keysPressed[event.code] = false; });
document.addEventListener('click', () => { document.body.style.cursor = 'default'; });


// --- Post Processing ---
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

// 2. Custom Dithering Shader (WITH TEMPORARY DEBUG MAIN FUNCTION)
const DitheringShader = {
    uniforms: { // Uniforms are still needed even if not used in debug main
        'tDiffuse': { value: null },
        'resolution': { value: new THREE.Vector2(window.innerWidth * window.devicePixelRatio, window.innerHeight * window.devicePixelRatio) },
        'uDitherPatternLevel': { value: 1 }
    },
    vertexShader: /* glsl */` varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); } `,
    fragmentShader: /* glsl */`
        uniform sampler2D tDiffuse; // Input texture
        uniform vec2 resolution; // Unused in debug
        uniform int uDitherPatternLevel; // Unused in debug
        varying vec2 vUv;

        // Bayer matrices etc are still here but not used by main()

        // --- TEMPORARY DEBUG ---
        // Output the raw color received from the RenderPass directly
        void main() {
            vec4 texColor = texture2D(tDiffuse, vUv);
            gl_FragColor = texColor; // Just output the input color
        }
        // --- END TEMPORARY DEBUG ---
    `
};
const ditherPass = new ShaderPass(DitheringShader);
composer.addPass(ditherPass);

// --- Animation Loop ---
// (Code omitted for brevity - no changes here)
const clock = new THREE.Clock();
let previousTime = 0;
function animate() {
    requestAnimationFrame(animate);
    const elapsedTime = clock.getElapsedTime(); const deltaTime = elapsedTime - previousTime; previousTime = elapsedTime;
    let currentlyMovingForwardOrBackward = false;
    if (keysPressed['KeyA'] || keysPressed['ArrowLeft']) { camera.rotation.y += turnSpeed * deltaTime; }
    if (keysPressed['KeyD'] || keysPressed['ArrowRight']) { camera.rotation.y -= turnSpeed * deltaTime; }
    const currentMoveSpeed = moveSpeed * deltaTime;
    if (keysPressed['KeyW'] || keysPressed['ArrowUp']) { const forward = new THREE.Vector3(0, 0, -1).applyEuler(camera.rotation); camera.position.add(forward.multiplyScalar(currentMoveSpeed)); currentlyMovingForwardOrBackward = true; }
    if (keysPressed['KeyS'] || keysPressed['ArrowDown']) { const backward = new THREE.Vector3(0, 0, 1).applyEuler(camera.rotation); camera.position.add(backward.multiplyScalar(currentMoveSpeed)); currentlyMovingForwardOrBackward = true; }
    isMoving = currentlyMovingForwardOrBackward;
    if (isMoving) { const bobOffset = Math.sin(elapsedTime * bobFrequency * 2 * Math.PI) * bobAmplitude; camera.position.y = baseCameraY + bobOffset; }
    else { if (Math.abs(camera.position.y - baseCameraY) > 0.001) { camera.position.y += (baseCameraY - camera.position.y) * 0.1; } else { camera.position.y = baseCameraY; } }
    camera.rotation.x = 0;
    composer.render(deltaTime);
}


// --- Handle Window Resize ---
// (Code omitted for brevity - no changes here)
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

console.log("DEBUG: Dither shader modified to output raw RenderPass color.");
