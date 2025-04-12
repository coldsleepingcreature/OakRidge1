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
    antialias: true // Antialiasing might interfere slightly with sharp dithering, but let's keep it for now
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
// Set clear color (optional, if you want a specific background behind potential transparency)
// renderer.setClearColor(0x111111); // Dark grey example

// --- Lighting ---
// Add subtle ambient light
const ambientLight = new THREE.AmbientLight(0x404040); // Soft white light (adjust color/intensity as needed)
scene.add(ambientLight);

// --- Room Dimensions ---
const roomWidth = 10;
const roomHeight = 6;
const roomDepth = 15;

// --- Materials ---
// Using MeshBasicMaterial for now - won't react to light, but dithering will affect it.
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
const playerHeight = 1.7;
camera.position.set(0, -roomHeight / 2 + playerHeight, roomDepth / 2 - 2);
camera.rotation.order = 'YXZ';
camera.rotation.x = 0;
const baseCameraY = camera.position.y;

// --- Continuous Controls Parameters ---
const moveSpeed = 4.0;
const turnSpeed = Math.PI / 1.5;

// --- Camera Bobbing Parameters ---
const bobFrequency = 1.8;
const bobAmplitude = 0.04;
let isMoving = false;

// --- Keyboard Input ---
const keysPressed = {};
const controlKeys = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

document.addEventListener('keydown', (event) => {
    if (controlKeys.includes(event.code)) {
        document.body.style.cursor = 'none';
    }
    keysPressed[event.code] = true;
});

document.addEventListener('keyup', (event) => {
    keysPressed[event.code] = false;
});

document.addEventListener('click', () => {
    document.body.style.cursor = 'default';
});


// --- Post Processing ---

// 1. Effect Composer
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera)); // Render scene as base

// 2. Custom Dithering Shader
const DitheringShader = {
    uniforms: {
        'tDiffuse': { value: null }, // Texture from previous pass (RenderPass)
        'resolution': { value: new THREE.Vector2(window.innerWidth * window.devicePixelRatio, window.innerHeight * window.devicePixelRatio) }, // Screen resolution for Bayer matrix mapping
        'uDitherPatternLevel': { value: 1 } // 0: 2x2, 1: 4x4, 2: 8x8 Bayer Matrix
    },

    vertexShader: /* glsl */`
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,

    fragmentShader: /* glsl */`
        uniform sampler2D tDiffuse; // Input texture (rendered scene)
        uniform vec2 resolution;    // Screen resolution
        uniform int uDitherPatternLevel; // Bayer matrix level selection

        varying vec2 vUv;

        // Function to get Bayer matrix threshold
        float getBayerThreshold(int x, int y, int level) {
            // Bayer matrices (normalized to 0..1 range)
            // Using integer modulo arithmetic, requires pattern size to be power of 2
            const mat2 bayer2 = mat2(
                0.0, 2.0,
                3.0, 1.0) / 4.0;

            const mat4 bayer4 = mat4(
                 0.0,  8.0,  2.0, 10.0,
                12.0,  4.0, 14.0,  6.0,
                 3.0, 11.0,  1.0,  9.0,
                15.0,  7.0, 13.0,  5.0) / 16.0;

            const mat4 bayer8_1 = mat4( // 8x8 broken into 4 4x4 matrices for GLSL limits
                 0., 32.,  8., 40.,  2., 34., 10., 42.,
                48., 16., 56., 24., 50., 18., 58., 26.,
                12., 44.,  4., 36., 14., 46.,  6., 38.,
                60., 28., 52., 20., 62., 30., 54., 22.
                ) / 64.0;
            const mat4 bayer8_2 = mat4(
                 3., 35., 11., 43.,  1., 33.,  9., 41.,
                51., 19., 59., 27., 49., 17., 57., 25.,
                15., 47.,  7., 39., 13., 45.,  5., 37.,
                63., 31., 55., 23., 61., 29., 53., 21.
                ) / 64.0;

            // Select matrix based on level
            if (level == 0) { // 2x2
                 ivec2 p = ivec2(mod(float(x), 2.0), mod(float(y), 2.0));
                 return bayer2[p.x][p.y];
            } else if (level == 1) { // 4x4
                 ivec2 p = ivec2(mod(float(x), 4.0), mod(float(y), 4.0));
                 return bayer4[p.x][p.y];
            } else { // 8x8 (Default)
                ivec2 p = ivec2(mod(float(x), 8.0), mod(float(y), 8.0));
                // Need to select the correct 4x4 sub-matrix and element
                if (p.x < 4 && p.y < 4) return bayer8_1[p.x][p.y];
                if (p.x >=4 && p.y < 4) return bayer8_2[p.x-4][p.y];
                if (p.x < 4 && p.y >=4) return bayer8_1[p.x][p.y-4]; // Indices adjusted based on how matrices were filled
                /*if (p.x >=4 && p.y >=4)*/ return bayer8_2[p.x-4][p.y-4];
            }
        }

        // Simple grayscale conversion
        float luminance(vec3 color) {
            return dot(color, vec3(0.299, 0.587, 0.114));
        }

        void main() {
            // Get screen coordinate for dithering
            ivec2 screenCoord = ivec2(gl_FragCoord.xy);

            // Get Bayer threshold for current pixel
            float threshold = getBayerThreshold(screenCoord.x, screenCoord.y, uDitherPatternLevel);

            // Get color from the rendered scene texture
            vec4 texColor = texture2D(tDiffuse, vUv);

            // Calculate luminance (brightness)
            float lum = luminance(texColor.rgb);

            // Simple black & original color dither
            // If luminance is less than the threshold, output black, otherwise output original color
            vec3 ditheredColor = (lum < threshold) ? vec3(0.0, 0.0, 0.0) : texColor.rgb;

            // --- Alternative: Quantize and Dither ---
            // Example: Reduce to a few brightness levels and dither between them
            // float levels = 4.0;
            // float quantizedLum = floor(lum * levels) / levels;
            // float dither = (lum - quantizedLum) * levels; // How far into the next level we are
            // vec3 ditheredColor = (dither < threshold) ? vec3(quantizedLum) : vec3(quantizedLum + 1.0/levels);
            // ditheredColor = clamp(ditheredColor, 0.0, 1.0); // Ensure valid color range
            // -----------------------------------------

            gl_FragColor = vec4(ditheredColor, texColor.a); // Output final color
        }
    `
};

// 3. Create ShaderPass using the custom shader
const ditherPass = new ShaderPass(DitheringShader);
composer.addPass(ditherPass);


// --- Animation Loop ---
const clock = new THREE.Clock();
let previousTime = 0;

function animate() {
    requestAnimationFrame(animate);

    const elapsedTime = clock.getElapsedTime();
    const deltaTime = elapsedTime - previousTime;
    previousTime = elapsedTime;

    // --- Continuous Movement & Turning Logic ---
    // (Same as before)
    let currentlyMovingForwardOrBackward = false;
    if (keysPressed['KeyA'] || keysPressed['ArrowLeft']) { camera.rotation.y += turnSpeed * deltaTime; }
    if (keysPressed['KeyD'] || keysPressed['ArrowRight']) { camera.rotation.y -= turnSpeed * deltaTime; }
    const currentMoveSpeed = moveSpeed * deltaTime;
    if (keysPressed['KeyW'] || keysPressed['ArrowUp']) {
        const forward = new THREE.Vector3(0, 0, -1).applyEuler(camera.rotation);
        camera.position.add(forward.multiplyScalar(currentMoveSpeed));
        currentlyMovingForwardOrBackward = true;
    }
    if (keysPressed['KeyS'] || keysPressed['ArrowDown']) {
        const backward = new THREE.Vector3(0, 0, 1).applyEuler(camera.rotation);
        camera.position.add(backward.multiplyScalar(currentMoveSpeed));
        currentlyMovingForwardOrBackward = true;
    }
    isMoving = currentlyMovingForwardOrBackward;

    // --- Apply Camera Bob ---
    // (Same as before)
     if (isMoving) {
        const bobOffset = Math.sin(elapsedTime * bobFrequency * 2 * Math.PI) * bobAmplitude;
        camera.position.y = baseCameraY + bobOffset;
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
    // renderer.render(scene, camera); // Old way
    composer.render(deltaTime);      // New way: Render passes
}

// --- Handle Window Resize ---
window.addEventListener('resize', () => {
    // Update camera
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    // Update renderer
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Update composer
    composer.setSize(window.innerWidth, window.innerHeight);
    composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Update shader resolution uniform
    ditherPass.uniforms.resolution.value.set(window.innerWidth * window.devicePixelRatio, window.innerHeight * window.devicePixelRatio);
});

// --- Start Animation ---
document.body.style.cursor = 'default';
previousTime = clock.getElapsedTime();
animate();

console.log("Ambient light and dithering post-processing effect added.");
