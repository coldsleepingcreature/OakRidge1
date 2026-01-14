import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

window.addEventListener('DOMContentLoaded', () => {

    // --- Base Setup ---
    const canvas = document.querySelector('canvas.webgl');
    const scene = new THREE.Scene();

    // Fog & Background (The "Bacon" Atmosphere)
    const fogColor = 0x000000; // Dark brown/yellowish fog 0x201808 // NOW BLACK 0x000000
    scene.fog = new THREE.Fog(fogColor, 5, 30);
    scene.background = new THREE.Color(fogColor);

    // --- Textures ---
    const textureLoader = new THREE.TextureLoader();

    // Helper for Retro Texture Loading
    function loadTexture(path) {
        const texture = textureLoader.load(path,
            undefined, 
            undefined, 
            (err) => console.error(`Error loading texture ${path}:`, err)
        );
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.magFilter = THREE.NearestFilter; // Critical for pixel art look
        texture.minFilter = THREE.NearestMipmapNearestFilter;
        return texture;
    }

    // LOAD YOUR TEXTURES HERE
    // Ensure these files exist in your 'public/Textures' folder!
    const wallTexture = loadTexture('./Textures/stonewall1.png'); 
    const floorTexture = loadTexture('./Textures/stonefloor2.png');

    // --- Materials ---
    const wallMaterial = new THREE.MeshStandardMaterial({
        map: wallTexture,
        side: THREE.DoubleSide
    });

    const floorMaterial = new THREE.MeshStandardMaterial({
        map: floorTexture
    });

    // --- Room Geometry (The "Curated" Approach) ---
    const roomGroup = new THREE.Group();
    scene.add(roomGroup);

    const roomWidth = 10;
    const roomHeight = 5;
    const roomDepth = 10;
    const doorWidth = 2;
    const doorHeight = 3;

    // Floor
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), floorMaterial);
    floor.rotation.x = -Math.PI * 0.5;
    floor.position.y = -0.01; // Avoid Z-fighting
    scene.add(floor);

    // Back Wall
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(roomWidth, roomHeight), wallMaterial);
    backWall.position.set(0, roomHeight / 2, -roomDepth / 2);
    roomGroup.add(backWall);

    // Left Wall
    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(roomDepth, roomHeight), wallMaterial);
    leftWall.position.set(-roomWidth / 2, roomHeight / 2, 0);
    leftWall.rotation.y = Math.PI / 2;
    roomGroup.add(leftWall);

    // Right Wall
    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(roomDepth, roomHeight), wallMaterial);
    rightWall.position.set(roomWidth / 2, roomHeight / 2, 0);
    rightWall.rotation.y = -Math.PI / 2;
    roomGroup.add(rightWall);

    // Front Wall (Split for Doorway)
    // 1. Left Section
    const frontWallLeftWidth = (roomWidth - doorWidth) / 2;
    const frontWall_Left = new THREE.Mesh(new THREE.PlaneGeometry(frontWallLeftWidth, roomHeight), wallMaterial);
    frontWall_Left.position.set(-(doorWidth / 2 + frontWallLeftWidth / 2), roomHeight / 2, roomDepth / 2);
    roomGroup.add(frontWall_Left);

    // 2. Right Section
    const frontWall_Right = new THREE.Mesh(new THREE.PlaneGeometry(frontWallLeftWidth, roomHeight), wallMaterial);
    frontWall_Right.position.set((doorWidth / 2 + frontWallLeftWidth / 2), roomHeight / 2, roomDepth / 2);
    roomGroup.add(frontWall_Right);

    // 3. Lintel (Above Door)
    const lintelHeight = roomHeight - doorHeight;
    if (lintelHeight > 0) {
        const lintel = new THREE.Mesh(new THREE.PlaneGeometry(doorWidth, lintelHeight), wallMaterial);
        lintel.position.set(0, doorHeight + lintelHeight / 2, roomDepth / 2);
        roomGroup.add(lintel);
    }

    // Ceiling
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(roomWidth, roomDepth), wallMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, roomHeight, 0);
    roomGroup.add(ceiling);


    // --- Lights ---
    const ambientLight = new THREE.AmbientLight(0x403010, 4.0); // Dim, brownish
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffdDB0, 3.0);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);


    // --- Camera & Sizes ---
    const sizes = { width: window.innerWidth, height: window.innerHeight };
    const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
    camera.position.set(4, 5, 8);
    scene.add(camera);


    // --- Renderer ---
    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false }); // False for pixel look
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));


    // --- POST PROCESSING (The "Bacon" Dither Effect) ---
    const DitherShader = {
        uniforms: {
            'tDiffuse': { value: null },
            'uResolution': { value: new THREE.Vector2(sizes.width, sizes.height) }
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform sampler2D tDiffuse;
            uniform vec2 uResolution;
            varying vec2 vUv;

            float bayer4(vec2 coord) {
                // Bayer Matrix 4x4
                if(mod(coord.x, 4.0) < 1.0) {
                     if(mod(coord.y, 4.0) < 1.0) return 0.0/16.0;
                     if(mod(coord.y, 4.0) < 2.0) return 8.0/16.0;
                     if(mod(coord.y, 4.0) < 3.0) return 2.0/16.0;
                     return 10.0/16.0;
                } else if(mod(coord.x, 4.0) < 2.0) {
                     if(mod(coord.y, 4.0) < 1.0) return 12.0/16.0;
                     if(mod(coord.y, 4.0) < 2.0) return 4.0/16.0;
                     if(mod(coord.y, 4.0) < 3.0) return 14.0/16.0;
                     return 6.0/16.0;
                } else if(mod(coord.x, 4.0) < 3.0) {
                     if(mod(coord.y, 4.0) < 1.0) return 3.0/16.0;
                     if(mod(coord.y, 4.0) < 2.0) return 11.0/16.0;
                     if(mod(coord.y, 4.0) < 3.0) return 1.0/16.0;
                     return 9.0/16.0;
                } else {
                     if(mod(coord.y, 4.0) < 1.0) return 15.0/16.0;
                     if(mod(coord.y, 4.0) < 2.0) return 7.0/16.0;
                     if(mod(coord.y, 4.0) < 3.0) return 13.0/16.0;
                     return 5.0/16.0;
                }
            }

            float getLuminance(vec3 color) {
                return dot(color, vec3(0.299, 0.587, 0.114));
            }

            vec3 getPaletteColor(float lum) {
                // High Art Palette (Browns/Golds)
                if (lum < 0.2) return vec3(0.25, 0.15, 0.05);
                else if (lum < 0.4) return vec3(0.3, 0.2, 0.05);
                else if (lum < 0.6) return vec3(0.5, 0.35, 0.1);
                else if (lum < 0.8) return vec3(0.7, 0.5, 0.15);
                else return vec3(0.9, 0.7, 0.2);
            }

            void main() {
                vec4 originalColor = texture2D(tDiffuse, vUv);
                float luminance = getLuminance(originalColor.rgb);
                float threshold = bayer4(gl_FragCoord.xy);
                
                // Dither Strength
                float ditherAdjust = (threshold - 0.5) / 8.0;
                vec3 paletteColor = getPaletteColor(luminance + ditherAdjust);
                
                gl_FragColor = vec4(paletteColor, originalColor.a);
            }
        `
    };

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const ditherPass = new ShaderPass(DitherShader);
    composer.addPass(ditherPass);


    // --- Controls & Animation ---
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;

    const clock = new THREE.Clock();

    const tick = () => {
        const elapsedTime = clock.getElapsedTime();
        controls.update();
        
        // RENDER THROUGH COMPOSER (Not Renderer)
        // DEBUGGING TOGGLING RENDERER
        // --- DEBUG MODE: TOGGLE THESE LINES ---
        // OPTION 1: "Bacon" Mode (Currently Active - Too Dark)
        composer.render();
        
        // OPTION 2: Raw Mode (Use this to verify geometry)
        //renderer.render(scene, camera);

        window.requestAnimationFrame(tick);
    };

    tick();

    // --- Resize ---
    window.addEventListener('resize', () => {
        sizes.width = window.innerWidth;
        sizes.height = window.innerHeight;
        
        camera.aspect = sizes.width / sizes.height;
        camera.updateProjectionMatrix();
        
        renderer.setSize(sizes.width, sizes.height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        composer.setSize(sizes.width, sizes.height);
        if (ditherPass.uniforms.uResolution) {
            ditherPass.uniforms.uResolution.value.set(sizes.width, sizes.height);
        }
    });

});
