//Imports
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
// import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'; // Make sure all needed imports are here
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

window.addEventListener('DOMContentLoaded', () => {

    // --- Base Setup (Keep as is) ---
    const canvas = document.querySelector('canvas.webgl');
    const scene = new THREE.Scene();
    // ... (Fog, Background)

    // --- ADD: Loading Manager ---
    const loadingManager = new THREE.LoadingManager();

    // --- Define what happens when all loading is done ---
    loadingManager.onLoad = () => {
        console.log('Loading complete!');
        // Call the function that sets up materials and generates the level
        initializeSceneContent();
    };
    loadingManager.onError = (url) => {
        console.error('Error loading resource:', url);
        // Handle errors, maybe show a message
    };
    // --- END ADD ---


    // --- MODIFY: Texture Loading ---
    // Tell TextureLoader to use the manager
    const textureLoader = new THREE.TextureLoader(loadingManager); // <<< PASS loadingManager HERE

    // Define texture variables here (they will be populated by the loader)
    // Remove the old loadTexture helper function if you aren't using it elsewhere
    console.log("Starting texture loading...");
    const wallTexture = textureLoader.load('./Textures/stonewall1.png');
    const floorTexture = textureLoader.load('./Textures/stonefloor2.png');

    // --- Setup Texture Properties (Can do this immediately, applies once loaded) ---
    // Wall Texture
    wallTexture.colorSpace = THREE.SRGBColorSpace;
    wallTexture.magFilter = THREE.NearestFilter;
    wallTexture.minFilter = THREE.NearestMipmapNearestFilter;

    // Floor Texture
    floorTexture.colorSpace = THREE.SRGBColorSpace;
    floorTexture.magFilter = THREE.NearestFilter;
    floorTexture.minFilter = THREE.NearestMipmapNearestFilter;
    // --- END MODIFY ---


    // --- Lights ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Soft white light
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    // --- Sizes ---
    const sizes = {
        width: window.innerWidth,
        height: window.innerHeight
    };

    // --- Camera ---
    const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
    camera.position.set(0, 5, 10);
    scene.add(camera);

    // --- Controls ---
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;

    // --- Renderer ---
    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true
    });
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    // --- Post Processing Setup (Keep definitions for later) ---
    // const DitherShader = { /* ... */ };
    // let composer, ditherPass;


    // --- Procedural Generation Functions (Keep definitions as they are) ---
    const TILE = { /* ... */ };
    const GRID_WIDTH = 100; /* ... */
    let levelGrid, leafPartitions;
    const MIN_PARTITION_SIZE = 10; /* ... */
    class Partition { /* ... */ }
    function bspPartition(partition) { /* ... */ }
    function createRooms(leaves) { /* ... */ }
    function getRoomFromPartition(partition) { /* ... */ }
    function carveCorridor(startX, startY, endX, endY) { /* ... */ }
    function connectRooms(partition) { /* ... */ }
    function generateLevelData() { /* ... returns grid ... */ }
    function generateLevelGeometry(gridData, wallMat, floorMat) { /* ... implementation ... */ } // Keep this definition


    // --- ADD: Function to run AFTER loading ---
    function initializeSceneContent() {
        console.log("Initializing scene content...");

        // --- MOVE Material Creation here ---
        // (Create materials *after* textures are loaded)
        const wallMaterial = new THREE.MeshStandardMaterial({
            map: wallTexture, // wallTexture object is populated now
            side: THREE.DoubleSide
        });
        const floorMaterial = new THREE.MeshStandardMaterial({
            map: floorTexture // floorTexture object is populated now
        });
        console.log("Materials created.");

        // --- MOVE Level Generation Calls here ---
        const generatedGrid = generateLevelData();
        generateLevelGeometry(generatedGrid, wallMaterial, floorMaterial); // Pass materials

        // --- MOVE Animation Start here ---
        startAnimation();
    }
    // --- END ADD ---


    // --- Animation Loop Definition (Keep as is) ---
    const clock = new THREE.Clock();
    function tick() {
        const elapsedTime = clock.getElapsedTime();

        // Update controls
        controls.update();

        // Render
        renderer.render(scene, camera);

        // Call tick again on the next frame
        window.requestAnimationFrame(tick);
    }


    // --- ADD: Separate function to start animation ---
    // (This is called by the loadingManager.onLoad via initializeSceneContent)
    function startAnimation() {
        console.log("Starting animation loop.");
        tick(); // Call the first tick
    }
    // --- END ADD ---

    // --- Resize Listener (Keep as is) ---
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
    });

}); // --- End of DOMContentLoaded listener ---
