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
renderer.setClearColor(0x000000); // Set clear color to black for consistency
renderer.outputColorSpace = THREE.SRGBColorSpace;

// --- Lighting ---
// --- DRASTICALLY REDUCE AMBIENT LIGHT ---
const ambientLight = new THREE.AmbientLight(0x404040, 0.1); // Very low intensity
scene.add(ambientLight);
// --- END REDUCE ---

// --- ADJUST POINT LIGHT ---
// Keep distance 0, maybe slightly increase intensity, ensure central position
const pointLight = new THREE.PointLight(0xffffff, 18.0, 0); // Intensity 18.0, Distance 0
pointLight.position.set(0, 1.5, 0); // Central position
scene.add(pointLight);
// --- END ADJUST ---

// --- Room Dimensions ---
const roomWidth = 10;
const roomHeight = 6;
const roomDepth = 15;

// --- Materials ---
// Wall material still needs to calculate lighting, even if shader makes it black often
const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff, // Set base color to white - lighting will darken it. Shader does the rest.
    roughness: 0.9,  // High roughness
    metalness: 0.1,
    side: THREE.DoubleSide
});
// Frame material - let's make this react to light too for consistency, but keep color
const frameMaterial = new THREE.MeshStandardMaterial({
    color: 0x00ff00, // Neon Green base color
    emissive: 0x003300, // Optional: Slight emission to make it pop a bit
    roughness: 0.8,
    metalness: 0.1,
    side: THREE.DoubleSide
});

// --- Geometry Creation ---
const collidableObjects = [];
// Floor, Ceiling, Walls, Frames code remains the same, but uses updated materials
// Floor
const floorGeometry = new THREE.PlaneGeometry(roomWidth, roomDepth);
const floor = new THREE.Mesh(floorGeometry, wallMaterial);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -roomHeight / 2;
scene.add(floor);
collidableObjects.push(floor);
// Ceiling
const ceilingGeometry = new THREE.PlaneGeometry(roomWidth, roomDepth);
const ceiling = new THREE.Mesh(ceilingGeometry, wallMaterial);
ceiling.rotation.x = Math.PI / 2;
ceiling.position.y = roomHeight / 2;
scene.add(ceiling);
collidableObjects.push(ceiling);
// Back Wall
const backWallGeometry = new THREE.PlaneGeometry(roomWidth, roomHeight);
const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
backWall.position.z = -roomDepth / 2;
backWall.position.y = 0;
scene.add(backWall);
collidableObjects.push(backWall);
// Left Wall
const leftWallGeometry = new THREE.PlaneGeometry(roomDepth, roomHeight);
const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
leftWall.rotation.y = Math.PI / 2;
leftWall.position.x = -roomWidth / 2;
leftWall.position.y = 0;
scene.add(leftWall);
collidableObjects.push(leftWall);
// Right Wall
const rightWallGeometry = new THREE.PlaneGeometry(roomDepth, roomHeight);
const rightWall = new THREE.Mesh(rightWallGeometry, wallMaterial);
rightWall.rotation.y = -Math.PI / 2;
rightWall.position.x = roomWidth / 2;
rightWall.position.y = 0;
scene.add(rightWall);
collidableObjects.push(rightWall);
// Front Wall
const frontWallGeometry = new THREE.PlaneGeometry(roomWidth, roomHeight);
const frontWall = new THREE.Mesh(frontWallGeometry, wallMaterial);
frontWall.position.z = roomDepth / 2;
frontWall.rotation.y = Math.PI;
frontWall.position.y = 0;
scene.add(frontWall);
collidableObjects.push(frontWall);
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
const initialCameraZ = roomDepth / 2 - 3;
camera.position.set(0, -roomHeight / 2 + playerHeight, initialCameraZ);
camera.rotation.order = 'YXZ';
camera.rotation.x = 0;
const baseCameraY = camera.position.y;

// --- Collision Parameters ---
const playerRadius = 0.3;
const raycaster = new THREE.Raycaster();

// --- Controls & Input ---
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

// --- MODIFY DITHER SHADER ---
const CornerDitheringShader = {
    uniforms: {
        'tDiffuse': { value: null },
        'resolution': { value: new THREE.Vector2(window.innerWidth * window.devicePixelRatio, window.innerHeight * window.devicePixelRatio) },
        'uDitherPatternLevel': { value: 1 }, // 0=2x2, 1=4x4, 2=8x8
        'uCornerLuminanceThreshold': { value: 0.15 } // Lower value = only very darkest areas dither
    },
    vertexShader: /* glsl */`
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: /* glsl */`
        uniform sampler2D tDiffuse;
        uniform vec2 resolution;
        uniform int uDitherPatternLevel;
        uniform float uCornerLuminanceThreshold; // New uniform
        varying vec2 vUv;

        // Bayer matrices (keep these)
        const mat2 bayer2 = mat2(0.0, 2.0, 3.0, 1.0) / 4.0;
        const mat4 bayer4 = mat4( 0.0,  8.0,  2.0, 10.0, 12.0,  4.0, 14.0,  6.0, 3.0, 11.0,  1.0,  9.0, 15.0,  7.0, 13.0,  5.0) / 16.0;
        // ... (keep 8x8 matrices if uDitherPatternLevel can be 2)
        const mat4 bayer8_TL = mat4( 0.0, 32.0,  8.0, 40.0, 48.0, 16.0, 56.0, 24.0, 12.0, 44.0,  4.0, 36.0, 60.0, 28.0, 52.0, 20.0); const mat4 bayer8_TR = mat4( 2.0, 34.0, 10.0, 42.0, 50.0, 18.0, 58.0, 26.0, 14.0, 46.0,  6.0, 38.0, 62.0, 30.0, 54.0, 22.0); const mat4 bayer8_BL = mat4( 3.0, 35.0, 11.0, 43.0, 51.0, 19.0, 59.0, 27.0, 15.0, 47.0,  7.0, 39.0, 63.0, 31.0, 55.0, 23.0); const mat4 bayer8_BR = mat4( 1.0, 33.0,  9.0, 41.0, 49.0, 17.0, 57.0, 25.0, 13.0, 45.0,  5.0, 37.0, 61.0, 29.0, 53.0, 21.0);

        float getBayerThreshold(int x, int y, int level) {
             if (level == 0) { ivec2 p = ivec2(mod(float(x), 2.0), mod(float(y), 2.0)); return bayer2[p.x][p.y]; }
             else if (level == 1) { ivec2 p = ivec2(mod(float(x), 4.0), mod(float(y), 4.0)); return bayer4[p.x][p.y]; }
             else { // level == 2 (8x8)
                 ivec2 p = ivec2(mod(float(x), 8.0), mod(float(y), 8.0));
                 float value;
                 if (p.x < 4 && p.y < 4) { value = bayer8_TL[p.x][p.y]; } else if (p.x >= 4 && p.y < 4) { value = bayer8_TR[p.x - 4][p.y]; } else if (p.x < 4 && p.y >= 4) { value = bayer8_BL[p.x][p.y - 4]; } else { value = bayer8_BR[p.x - 4][p.y - 4]; }
                 return value / 64.0;
             }
        }

        float luminance(vec3 color) {
            return dot(color, vec3(0.299, 0.587, 0.114));
        }

        void main() {
            ivec2 screenCoord = ivec2(gl_FragCoord.xy);
            vec4 texColor = texture2D(tDiffuse, vUv);
            float lum = luminance(texColor.rgb);

            vec3 finalColor;

            if (lum < uCornerLuminanceThreshold) {
                // Area is dark enough, apply black/white dithering
                float ditherPatternValue = getBayerThreshold(screenCoord.x, screenCoord.y, uDitherPatternLevel);

                // Map the low luminance (0 to uCornerLuminanceThreshold) to a 0-1 range
                // This determines the 'density' of white pixels in the dither pattern
                float mappedLum = smoothstep(0.0, uCornerLuminanceThreshold, lum); // Use smoothstep for nicer transition

                // If mapped luminance is less than the Bayer threshold, output black, otherwise white
                finalColor = (mappedLum < ditherPatternValue) ? vec3(0.0) : vec3(1.0);
            } else {
                // Area is too bright, output pure black
                finalColor = vec3(0.0);
            }

            // Handle frame color separately - dither green/black always? Or make it black too?
            // Let's try making frames black unless they fall in the 'corner' threshold too.
            // For a distinct frame style, you might need a separate pass or different logic.


            gl_FragColor = vec4(finalColor, texColor.a);
        }
    `
};
const cornerDitherPass = new ShaderPass(CornerDitheringShader); // Use the new shader object
composer.addPass(cornerDitherPass); // Add the pass
// --- END MODIFY ---


// --- Animation Loop ---
const clock = new THREE.Clock();
let previousTime = 0;
function animate() {
    requestAnimationFrame(animate);
    const elapsedTime = clock.getElapsedTime();
    const deltaTime = elapsedTime - previousTime;
    previousTime = elapsedTime;
    // (Movement, Collision, Bobbing code remains the same)
    let currentlyMovingForwardOrBackward = false;
    const currentMoveSpeed = moveSpeed * deltaTime;
    const moveDirection = new THREE.Vector3();
    let applyMovement = false;
    let collisionDetected = false;
    if (keysPressed['KeyA'] || keysPressed['ArrowLeft']) { camera.rotation.y += turnSpeed * deltaTime; }
    if (keysPressed['KeyD'] || keysPressed['ArrowRight']) { camera.rotation.y -= turnSpeed * deltaTime; }
    if (keysPressed['KeyW'] || keysPressed['ArrowUp']) { moveDirection.set(0, 0, -1).applyEuler(camera.rotation); currentlyMovingForwardOrBackward = true; applyMovement = true; }
    if (keysPressed['KeyS'] || keysPressed['ArrowDown']) { moveDirection.set(0, 0, 1).applyEuler(camera.rotation); currentlyMovingForwardOrBackward = true; applyMovement = true; }
    if (applyMovement) {
        const moveVector = moveDirection.clone().multiplyScalar(currentMoveSpeed);
        const moveLength = moveVector.length();
        raycaster.set(camera.position, moveDirection.normalize());
        const intersects = raycaster.intersectObjects(collidableObjects);
        if (intersects.length > 0 && intersects[0].distance < moveLength + playerRadius) {
            collisionDetected = true;
        }
        if (!collisionDetected) {
            camera.position.add(moveVector);
        }
    }
    isMoving = currentlyMovingForwardOrBackward && !collisionDetected;
     if (isMoving) {
        const bobOffset = Math.sin(elapsedTime * bobFrequency * 2 * Math.PI) * bobAmplitude;
        const potentialY = baseCameraY + bobOffset;
        const ceilingLimit = roomHeight / 2 - playerRadius;
        const floorLimit = -roomHeight / 2 + playerRadius;
        camera.position.y = THREE.MathUtils.clamp(potentialY, floorLimit, ceilingLimit);
    } else {
        if (Math.abs(camera.position.y - baseCameraY) > 0.001) { camera.position.y += (baseCameraY - camera.position.y) * 0.1; }
        else { camera.position.y = baseCameraY; }
    }
    camera.rotation.x = 0;

    // Render using the composer
    composer.render(deltaTime);
}


// --- Handle Window Resize ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight); renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    composer.setSize(window.innerWidth, window.innerHeight);
    composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // Update new dither pass resolution uniform
    if (cornerDitherPass && cornerDitherPass.uniforms.resolution) {
        cornerDitherPass.uniforms.resolution.value.set(window.innerWidth * window.devicePixelRatio, window.innerHeight * window.devicePixelRatio);
    }
});

// --- Start Animation ---
document.body.style.cursor = 'default';
previousTime = clock.getElapsedTime();
animate();

console.log("Applied corner dithering shader and adjusted lighting for high contrast.");
