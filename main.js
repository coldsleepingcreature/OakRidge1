import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

/**
 * Base Setup
 */
// Canvas
const canvas = document.querySelector('canvas.webgl');

// Scene
const scene = new THREE.Scene();
// Set background color to match fog
scene.background = new THREE.Color(0x201808);

// Fog - Adds atmospheric depth and retro feel
// Fog( color, near_start_distance, far_end_distance )
scene.fog = new THREE.Fog(0x201808, 5, 30); // Dark brown fog

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader();

// Helper function to load textures and apply retro filtering
function loadTexture(path) {
    const texture = textureLoader.load(path);
    // --- CRITICAL FOR PIXELATED LOOK ---
    // Magnification Filter (when texture is larger on screen than original size)
    texture.magFilter = THREE.NearestFilter;
    // Minification Filter (when texture is smaller on screen than original size)
    // NearestMipmapNearestFilter is often a good balance for retro look + performance
    texture.minFilter = THREE.NearestMipmapNearestFilter;
    // --- Optional: Texture Wrapping (if textures should repeat) ---
    // texture.wrapS = THREE.RepeatWrapping;
    // texture.wrapT = THREE.RepeatWrapping;
    // texture.repeat.set(4, 4); // Example: repeat texture 4 times
    // ------------------------------------
    return texture;
}

// --- IMPORTANT: Replace these paths with your actual low-res texture files ---
const wallTexture = loadTexture('./textures/lowres_stone_wall.png'); // << REPLACE THIS
const floorTexture = loadTexture('./textures/lowres_wood_floor.png'); // << REPLACE THIS
// --------------------------------------------------------------------------

/**
 * Materials using the loaded textures
 */
const wallMaterial = new THREE.MeshStandardMaterial({
    map: wallTexture,
    side: THREE.BackSide // Render texture on the inside of the box
});

const floorMaterial = new THREE.MeshStandardMaterial({
    map: floorTexture
});


/**
 * Objects
 */
// Room (using BoxGeometry - Walls)
// Adjust size as needed
const roomGeometry = new THREE.BoxGeometry(10, 5, 10); // width, height, depth
const room = new THREE.Mesh(roomGeometry, wallMaterial);
scene.add(room);

// Floor Plane
const planeGeometry = new THREE.PlaneGeometry(10, 10); // width, depth
const plane = new THREE.Mesh(planeGeometry, floorMaterial);
plane.rotation.x = -Math.PI * 0.5; // Rotate plane to be horizontal
plane.position.y = -2.5; // Position it at the bottom of the room box
scene.add(plane);


/**
 * Lights
 */
// Ambient Light - Provides base illumination, tinted for mood
const ambientLight = new THREE.AmbientLight(0x403010, 0.6); // Dim, brownish light (Hex color, Intensity)
scene.add(ambientLight);

// Directional Light - Simulates a light source like the sun, provides shadows
// Made dimmer and slightly colored to fit the retro mood
const directionalLight = new THREE.DirectionalLight(0xffdDB0, 0.3); // Slightly yellow, dim light
directionalLight.position.set(5, 10, 7.5); // Position the light source
// --- Enable Shadows (Optional but adds depth) ---
// directionalLight.castShadow = true;
// // Configure shadow map resolution (lower might fit retro style)
// directionalLight.shadow.mapSize.width = 512;
// directionalLight.shadow.mapSize.height = 512;
// directionalLight.shadow.camera.near = 0.5;
// directionalLight.shadow.camera.far = 50;
// ----------------------------------------------
scene.add(directionalLight);


/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
};

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
camera.position.z = 5; // Start inside the room
camera.position.y = 0; // Adjust starting height if needed
scene.add(camera);

/**
 * Controls
 */
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true; // Smooth camera movement
// Optional: Limit zoom/pan to stay inside the room
// controls.maxDistance = 4.5;
// controls.minDistance = 0.5;
// controls.enablePan = false; // Disable panning if desired

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: false // Turn OFF antialiasing for a sharper, more retro pixel look
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
// --- Enable Shadows in Renderer (if using light shadows) ---
// renderer.shadowMap.enabled = true;
// renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Or other shadow types
// ---------------------------------------------------------


/**
 * Post Processing - Effect Composer for Dithering
 */
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera)); // Render the scene first

// --- Dithering Shader Definition ---
const DitherShader = {
    uniforms: {
        'tDiffuse': { value: null }, // Input texture from the RenderPass
        'uResolution': { value: new THREE.Vector2(sizes.width * renderer.getPixelRatio(), sizes.height * renderer.getPixelRatio()) }, // Screen resolution for pixel calculation
        // Add more uniforms if needed (e.g., dither pattern scale, color palette info)
    },
    // Vertex shader usually stays simple for post-processing
    vertexShader: /* glsl */`
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    // Fragment shader applies the dithering effect
    fragmentShader: /* glsl */`
        uniform sampler2D tDiffuse; // Rendered scene texture
        uniform vec2 uResolution;   // Screen resolution
        varying vec2 vUv;           // UV coordinates from vertex shader

        // Function to get Bayer matrix value (4x4) for dithering threshold
        // Returns a value between ~0 and 1 based on screen pixel coordinate
        float bayer4(vec2 coord) {
            // 4x4 Bayer matrix pattern
            const mat4 B = mat4(
                 0.0,  8.0,  2.0, 10.0,
                12.0,  4.0, 14.0,  6.0,
                 3.0, 11.0,  1.0,  9.0,
                15.0,  7.0, 13.0,  5.0
            );
            // Get integer coordinates modulo 4
            ivec2 iCoord = ivec2(mod(coord, 4.0));
            // Look up value in the matrix and normalize (dividing by 16, plus small offset)
            return (B[iCoord.x][iCoord.y] + 1.0) / 17.0;
        }

        void main() {
            // Get the original color of the pixel from the rendered scene
            vec4 originalColor = texture2D(tDiffuse, vUv);

            // Calculate luminance (brightness) of the pixel - standard conversion
            float luminance = dot(originalColor.rgb, vec3(0.299, 0.587, 0.114));

            // Get the dithering threshold for this specific pixel coordinate
            // gl_FragCoord.xy gives the pixel's screen coordinate
            float ditherThreshold = bayer4(gl_FragCoord.xy);

            // --- Simple Grayscale Dithering ---
            // Compare luminance to the threshold. If brighter, output white, else black.
            // float ditheredLuminance = (luminance > ditherThreshold) ? 1.0 : 0.0;
            // vec3 finalColor = vec3(ditheredLuminance); // Grayscale output

            // --- Color Dithering Attempt (Basic Quantization + Dither) ---
            // Reduce the number of color levels (e.g., 4 levels per channel)
            float levels = 4.0;
            vec3 quantizedColor = floor(originalColor.rgb * levels) / levels;

            // Calculate error and add scaled dither pattern
            // This is a simplified approach; more advanced methods exist
            vec3 error = originalColor.rgb - quantizedColor;
            float ditherAmount = (ditherThreshold - 0.5) / levels; // Centered dither value

            // Add dither based on error or directly (experiment!)
            vec3 ditheredColor = clamp(quantizedColor + ditherAmount, 0.0, 1.0);
            // vec3 ditheredColor = clamp(quantizedColor + error * (ditherThreshold * 2.0 - 1.0), 0.0, 1.0); // Error diffusion style (approx)


            // --- Final Color Adjustment (Tinting towards yellow/brown) ---
            // Mix the dithered color with a target tint color
            vec3 tintColor = vec3(0.8, 0.65, 0.2); // Yellow/brown target
            float tintAmount = 0.5; // How much tint to apply (0.0 to 1.0)
            vec3 finalColor = mix(ditheredColor, tintColor * dot(ditheredColor, vec3(1.0))/1.5, tintAmount); // Mix based on brightness


            // Output the final calculated color
            gl_FragColor = vec4(finalColor, originalColor.a); // Keep original alpha
        }
    `
};

// Create a ShaderPass using the custom DitherShader
const ditherPass = new ShaderPass(DitherShader);
composer.addPass(ditherPass); // Add the pass to the composer pipeline
// ------------------------------------


/**
 * Animation Loop
 */
const clock = new THREE.Clock();

const tick = () => {
    const elapsedTime = clock.getElapsedTime();

    // Update controls
    controls.update();

    // Render using the Effect Composer instead of the direct renderer
    composer.render();
    // renderer.render(scene, camera); // This line is replaced by composer.render()

    // Call tick again on the next frame
    window.requestAnimationFrame(tick);
};


/**
 * Resize Handling
 */
window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    // Update camera aspect ratio
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    // Update renderer size and pixel ratio
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Update Effect Composer size
    composer.setSize(sizes.width, sizes.height);

    // Update shader resolution uniform (important for pixel-based effects)
    ditherPass.uniforms.uResolution.value.set(
        sizes.width * renderer.getPixelRatio(),
        sizes.height * renderer.getPixelRatio()
    );
});


// Start the animation loop
tick();
