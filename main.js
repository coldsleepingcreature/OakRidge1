import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
// import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'; // Keep if you plan to load models later
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js'; // <<<--- ADD THIS IMPORT

// --- Wrap initialization code in DOMContentLoaded listener ---
window.addEventListener('DOMContentLoaded', () => {

    /**
     * Base Setup (Keep as is)
     */
    const canvas = document.querySelector('canvas.webgl');
    const scene = new THREE.Scene();
    const fogColor = 0x201808;
    scene.fog = new THREE.Fog(fogColor, 5, 30);
    scene.background = new THREE.Color(fogColor);

    /**
     * Texture Loading (Keep as is)
     */
    const textureLoader = new THREE.TextureLoader();
    function loadTexture(path) { /* ... */ }
    const wallTexture = loadTexture('./Textures/stonewall1.png');
    const floorTexture = loadTexture('./Textures/stonefloor2.png');

    /**
     * Materials (Keep definitions, maybe add more later)
     */
    const wallMaterial = new THREE.MeshStandardMaterial({ map: wallTexture, side: THREE.DoubleSide });
    const floorMaterial = new THREE.MeshStandardMaterial({ map: floorTexture });
    // const ceilingMaterial = wallMaterial; // Or define a separate one

    /**
     * Lights (Keep as is)
     */
    const ambientLight = new THREE.AmbientLight(0x403010, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffdDB0, 0.25);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    /**
     * Sizes (Keep as is)
     */
    const sizes = { /* ... */ };

    /**
     * Camera (Keep as is, but position might need adjustment later)
     */
    const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
    camera.position.set(4, 5, 8); // You'll likely adjust this based on generated level
    scene.add(camera);

    /**
     * Controls (Keep as is for now)
     */
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;

    /**
     * Renderer (Keep as is)
     */
    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false });
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    /**
     * Post Processing Setup (Keep defined, but leave bypassed for now)
     */
    // --- Define the Dither Shader ---
    const DitherShader = { /* ... shader code ... */ };
    // --- Create Composer and Passes ---
    // const composer = new EffectComposer(renderer);
    // composer.addPass(new RenderPass(scene, camera));
    // const ditherPass = new ShaderPass(DitherShader);
    // composer.addPass(ditherPass);


    // ==================================================
    // === START PROCEDURAL GENERATION CODE PLACEMENT ===
    // ==================================================

    // --- Phase 1: Constants, Grid, Params ---
    // (Place these definitions here, inside DOMContentLoaded but before functions that use them)
    const TILE = { VOID: 0, FLOOR: 1, WALL: 2, DOOR: 3, CORRIDOR_FLOOR: 4 };
    const GRID_WIDTH = 100;
    const GRID_HEIGHT = 100;
    let levelGrid; // Define scope here
    let leafPartitions; // Define scope here
    const MIN_PARTITION_SIZE = 10;
    const MIN_ROOM_SIZE = 5;
    const ROOM_PADDING = 2;

    // --- Phase 2 & 3 & 4: BSP, Room, Corridor Functions ---
    // (Define all the helper functions here: Partition class, bspPartition, createRooms, getRoomFromPartition, carveCorridor, connectRooms)
    class Partition { /* ... constructor ... */ }
    function bspPartition(partition) { /* ... implementation ... */ }
    function createRooms(leaves) { /* ... implementation ... */ }
    function getRoomFromPartition(partition) { /* ... implementation ... */ }
    function carveCorridor(startX, startY, endX, endY) { /* ... implementation ... */ }
    function connectRooms(partition) { /* ... implementation ... */ }

    // --- Phase 5: Wall Placement Function (Optional, can be handled in geometry generation) ---
    // function placeWalls() { /* ... implementation ... */ }

    // --- Main Function to Orchestrate Data Generation ---
    function generateLevelData() {
         levelGrid = Array(GRID_WIDTH).fill(null).map(() => Array(GRID_HEIGHT).fill(TILE.VOID)); // Initialize grid
         leafPartitions = []; // Initialize leaves array
         const rootPartition = new Partition(0, 0, GRID_WIDTH, GRID_HEIGHT);
         bspPartition(rootPartition);
         createRooms(leafPartitions);
         connectRooms(rootPartition);
         // placeWalls();
         return levelGrid;
    }

    // --- Phase 6: Geometry Generation Function ---
    // (Define the function that takes grid data and creates Three.js meshes)
    function generateLevelGeometry(gridData) {
        // Clear previous level meshes here if regenerating levels dynamically later
        // Example: scene.remove(...meshesToRemove); meshesToRemove = [];

        const TILE_SIZE = 1; // Or your desired scale
        const ROOM_HEIGHT_3D = 5; // Or your desired height
        let floorGeometries = [];
        let corridorFloorGeometries = [];
        let wallGeometries = [];
        let ceilingGeometries = [];

        // Loop through gridData...
        // Create PlaneGeometry/BoxGeometry...
        // Translate/Rotate geometry...
        // Push to respective geometry arrays...
        for (let x = 0; x < GRID_WIDTH; x++) {
             for (let y = 0; y < GRID_HEIGHT; y++) {
                 // ... (geometry creation logic as provided in previous answer) ...
             }
        }

        // Merge geometries...
        // Create Meshes...
        // Add Meshes to scene...
         if (floorGeometries.length > 0) { /* ... merge and add floorMesh ... */ }
         if (corridorFloorGeometries.length > 0) { /* ... merge and add corridorMesh ... */ }
         if (wallGeometries.length > 0) { /* ... merge and add wallMesh ... */ }
         if (ceilingGeometries.length > 0) { /* ... merge and add ceilingMesh ... */ }

        console.log("Generated level geometry.");
    }

    // ==================================================
    // === END PROCEDURAL GENERATION CODE PLACEMENT ===
    // ==================================================


    // --- INITIAL LEVEL GENERATION ---
    // (Call the functions to generate data and then geometry)
    const generatedGrid = generateLevelData();
    generateLevelGeometry(generatedGrid);


    // --- REMOVE OLD STATIC GEOMETRY ---
    // (Make sure the lines that created the static 'plane' and 'room' are deleted or commented out)
    /*
    // Floor (OLD STATIC - REMOVE/COMMENT OUT)
    // const plane = new THREE.Mesh( /* ... *///);
    // plane.position.y = -0.001;
    // scene.add(plane);

    // Walls (OLD STATIC - REMOVE/COMMENT OUT)
    const roomMaterials = [ /* ... */ ];
    // const room = new THREE.Mesh( /* ... */ );
    // room.position.y = 2.5;
    // scene.add(room);

    /**
     * Animate (Keep as is, using direct renderer for now)
     */
    const clock = new THREE.Clock();
    const tick = () => {
        const elapsedTime = clock.getElapsedTime();
        controls.update();

        // --- USE DIRECT RENDERER FOR NOW ---
        renderer.render(scene, camera);
        // composer.render(); // Keep commented for now

        window.requestAnimationFrame(tick);
    };

    /**
     * Resize Listener (Keep as is)
     */
    window.addEventListener('resize', () => { /* ... resize logic ... */ });

    // --- Initial Tick Call ---
    tick();

}); // --- End of DOMContentLoaded listener ---
