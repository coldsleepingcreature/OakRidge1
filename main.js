// Keep imports outside the listener
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'; // Keep if you plan to load models
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

// --- Wrap initialization code in DOMContentLoaded listener ---
window.addEventListener('DOMContentLoaded', () => {

    /**
     * Base
     */
    // Debug
    // const gui = new GUI(); // Keep if you need debugging controls

    // Canvas
    const canvas = document.querySelector('canvas.webgl'); // Now this will run after canvas exists

    // Scene
    const scene = new THREE.Scene();

    // --- ADJUSTED FOG & BACKGROUND ---
    const fogColor = 0x201808; // Dark brown/yellowish fog
    scene.fog = new THREE.Fog(fogColor, 5, 30); // Adjust near (5) and far (30) distances as needed
    scene.background = new THREE.Color(fogColor); // Match background to fog
    // ---------------------------------

    /**
     * Textures
     */
    const textureLoader = new THREE.TextureLoader();

    // --- HELPER FUNCTION FOR LOW-RES TEXTURE LOADING ---
    function loadTexture(path) {
        const texture = textureLoader.load(path);
        // --- CRITICAL FOR PIXELATED LOOK ---
        texture.colorSpace = THREE.SRGBColorSpace; // Important for color accuracy
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestMipmapNearestFilter; // Good balance of performance and look
        // Optional: If textures repeat, enable wrapping
        // texture.wrapS = THREE.RepeatWrapping;
        // texture.wrapT = THREE.RepeatWrapping;
        // ------------------------------------
        return texture;
    }

    // --- !!! REPLACE THESE PLACEHOLDER PATHS with your actual low-res texture files !!! ---
    const wallTexture = loadTexture('./Textures/stonewall1.png');   // <<-- YOUR STONE WALL TEXTURE
    const floorTexture = loadTexture('./Textures/stonefloor2.png');  // <<-- YOUR WOOD/STONE FLOOR TEXTURE
    // Load other textures needed using loadTexture(...)
    // const doorTexture = loadTexture('./textures/retro_wood_door.png');
    // const roofTexture = loadTexture('./textures/retro_roof_tiles.png'); // If needed
    // --- !!! ----------------------------------------------------------------------- !!! ---


    /**
     * Materials
     */
    // Use MeshStandardMaterial or MeshLambertMaterial for interaction with light
    // MeshBasicMaterial ignores light completely
    const wallMaterial = new THREE.MeshStandardMaterial({ map: wallTexture });
    const floorMaterial = new THREE.MeshStandardMaterial({ map: floorTexture });
    // const roofMaterial = new THREE.MeshStandardMaterial({ map: roofTexture }); // If needed
    // const doorMaterial = new THREE.MeshStandardMaterial({ map: doorTexture }); // If needed


    /**
     * House / Room Geometry
     * (Keep your existing geometry setup, just apply the new materials)
     */

    // Floor
    const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(20, 20), // Keep size or adjust
        floorMaterial // Apply new floor material
    );
    plane.rotation.x = -Math.PI * 0.5;
    scene.add(plane);

    // Walls (Example using a simple box - replace with your actual room geometry setup)
    // Assuming you have walls, apply the wallMaterial
    const room = new THREE.Mesh(
        new THREE.BoxGeometry(10, 5, 10), // Example size
        wallMaterial // Apply new wall material
    );
    room.position.y = 2.5; // Adjust position as needed
    scene.add(room); // Adding room/wallmesh to the scene

    // Add other elements (doors, windows, roof) applying appropriate materials


    /**
     * Lights
     */
    // --- ADJUSTED AMBIENT LIGHT ---
    const ambientLight = new THREE.AmbientLight(0x403010, 0.6); // Dim, brownish light (adjust color/intensity)
    scene.add(ambientLight);
    // ------------------------------

    // --- ADJUSTED DIRECTIONAL LIGHT (Optional, adjust or remove for desired mood) ---
    const directionalLight = new THREE.DirectionalLight(0xffdDB0, 0.25); // Dimmer, slightly yellow
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);
    // ------------------------------------------------------------------------------


    /**
     * Sizes
     */
    const sizes = {
        width: window.innerWidth,
        height: window.innerHeight
    };

    // --- NOTE: Resize listener moved INSIDE DOMContentLoaded ---

    /**
     * Camera
     */
    // Base camera
    const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
    camera.position.set(4, 5, 8); // Adjust starting position
    scene.add(camera);

    // Controls
    const controls = new OrbitControls(camera, canvas); // Now canvas should be valid
    controls.enableDamping = true;
    // Optional: Restrict controls if needed
    // controls.maxPolarAngle = Math.PI / 2 - 0.1; // Prevent looking straight down/up too far

    /**
     * Renderer
     */
    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: false // Turn OFF default antialiasing - we want sharp pixels for retro look
    });
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // Enable shadows on renderer if using them
    // renderer.shadowMap.enabled = true;
    // renderer.shadowMap.type = THREE.PCFSoftShadowMap;


    // ==============================================================
    // --- POST PROCESSING SETUP (EffectComposer & Dither Shader) ---
    // ==============================================================

    // --- 1. Define the Dither Shader ---
    const DitherShader = {
        uniforms: {
            'tDiffuse': { value: null }, // Input texture (rendered scene)
            'uResolution': { value: new THREE.Vector2(sizes.width, sizes.height) } // Screen resolution
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
            uniform vec2 uResolution;
            varying vec2 vUv;

            float bayer4(vec2 coord) {
                const mat4 B = mat4(
                     0.0,  8.0,  2.0, 10.0,
                    12.0,  4.0, 14.0,  6.0,
                     3.0, 11.0,  1.0,  9.0,
                    15.0,  7.0, 13.0,  5.0
                );
                int x = int(mod(coord.x, 4.0));
                int y = int(mod(coord.y, 4.0));
                float value = 0.0;
                if (x == 0) value = B[0][y];
                else if (x == 1) value = B[1][y];
                else if (x == 2) value = B[2][y];
                else value = B[3][y];
                return (value + 1.0) / 17.0;
            }

            float getLuminance(vec3 color) {
                return dot(color, vec3(0.299, 0.587, 0.114));
            }

            vec3 getPaletteColor(float lum) {
                 if (lum < 0.2) return vec3(0.1, 0.08, 0.02);
                 else if (lum < 0.5) return vec3(0.5, 0.35, 0.1);
                 else return vec3(0.9, 0.7, 0.2);
            }

            void main() {
                vec4 originalColor = texture2D(tDiffuse, vUv);
                float luminance = getLuminance(originalColor.rgb);
                float threshold = bayer4(gl_FragCoord.xy);
                float ditherAdjust = (threshold - 0.5) / 4.0;
                vec3 paletteColor = getPaletteColor(luminance + ditherAdjust);
                vec3 finalColor = paletteColor;
                gl_FragColor = vec4(finalColor, originalColor.a);
            }
        `
    };

    // --- 2. Create Composer and Passes ---
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera)); // Render the scene first

    const ditherPass = new ShaderPass(DitherShader); // Create the pass with our shader
    composer.addPass(ditherPass);
    // --- (Add more passes here if needed) ---

    // ==============================================================
    // --- END POST PROCESSING SETUP ---
    // ==============================================================

    /**
     * Animate
     */
    const clock = new THREE.Clock();

    // Define tick function inside DOMContentLoaded scope
    const tick = () => {
        const elapsedTime = clock.getElapsedTime();

        // Update controls
        controls.update();

        // Render using the composer instead of the direct renderer
        composer.render(); // <<<--- RENDER SCENE THROUGH COMPOSER

        // Call tick again on the next frame
        window.requestAnimationFrame(tick);
    };


    /**
     * Resize Listener (Now also inside DOMContentLoaded)
     */
    window.addEventListener('resize', () => {
        // Update sizes
        sizes.width = window.innerWidth;
        sizes.height = window.innerHeight;

        // Update camera
        camera.aspect = sizes.width / sizes.height;
        camera.updateProjectionMatrix();

        // Update renderer
        renderer.setSize(sizes.width, sizes.height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // UPDATE COMPOSER SIZE & SHADER UNIFORMS
        composer.setSize(sizes.width, sizes.height);
        if (ditherPass) { // Check if ditherPass exists
             ditherPass.uniforms.uResolution.value.set(sizes.width, sizes.height);
        }
    });


    // --- Initial call to start animation, inside DOMContentLoaded ---
    tick();

// --- End of the DOMContentLoaded listener ---
});
