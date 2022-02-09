import "./style.css";
import { KeyDisplay } from "./utils";
import { CharacterControls } from "./characterControls";
import * as THREE from "three";
import * as dat from "lil-gui";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import CANNON from 'cannon' 
// Debug
const gui = new dat.GUI();

// SCENE
const scene = new THREE.Scene();

// Canvas
const canvas = document.querySelector("canvas.webgl");

// CAMERA
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.y = 6;
camera.position.z = 12;
camera.position.x = 0;
const textureLoader = new THREE.TextureLoader();

// RENDERER
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor("#262837");
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;

// CONTROLS
const orbitControls = new OrbitControls(camera, canvas);
orbitControls.enableDamping = true;
orbitControls.minDistance = 5;
orbitControls.maxDistance = 15;
orbitControls.enablePan = false;
orbitControls.zoomO = 2;
orbitControls.maxPolarAngle = Math.PI / 2 - 0.05;
orbitControls.update();

// MODEL WITH ANIMATIONS
var characterControls;
new FBXLoader().load("objects/characters/Boss/theboss.fbx", async function (fbx) {
    fbx.traverse(function (object) {
        if (object.isMesh) object.castShadow = true;
    });
    if (window.innerWidth < 600) {
        fbx.scale.setScalar(0.0086);
    } else {
        fbx.scale.setScalar(0.016);
    }
    fbx.position.set(0,0,5)
    const mixer = new THREE.AnimationMixer(fbx);
    const animationsMap = new Map();
    const anim = new FBXLoader();
    anim.setPath("objects/characters/Boss/animations/");
    await new Promise((resolve) => {
        anim.load("Running.fbx", (anim1) => {
            mixer.clipAction(anim1.animations[0]).clampWhenFinished = true;
            mixer.clipAction(anim1.animations[0]).loop = THREE.LoopRepeat;
            mixer.clipAction(anim1.animations[0]).setEffectiveTimeScale(1.0);
            mixer.clipAction(anim1.animations[0]).setEffectiveWeight(1.0);
            mixer.clipAction(anim1.animations[0]).zeroSlopeAtEnd = true;
            mixer.clipAction(anim1.animations[0]).zeroSlopeAtStart = true;
            resolve(mixer.clipAction(anim1.animations[0]));
        });
    }).then((res) => animationsMap.set("Run", res)); // 3 sec

    await new Promise((resolve) => {
        anim.load("Idle.fbx", (anim1) => {
            resolve(anim1.animations[0]);
        });
    }).then((res) => animationsMap.set("Idle", mixer.clipAction(res))); // 3 sec

    await new Promise((resolve) => {
        anim.load("Samba Dancing.fbx", (anim1) => {
            resolve(anim1.animations[0]);
        });
    }).then((res) => animationsMap.set("Dance", mixer.clipAction(res))); // 3 sec

    await new Promise((resolve) => {
        anim.load("Walking.fbx", (anim1) => {
            resolve(anim1.animations[0]);
        });
    }).then((res) => animationsMap.set("Walk", mixer.clipAction(res))); // 3 sec

    scene.add(fbx);
    characterControls = new CharacterControls(fbx, mixer, animationsMap, orbitControls, camera, "Idle");
});

/**
 * House
 */
// House container
const doorColorTexture = textureLoader.load("/textures/door/color.jpg");
const doorAlphaTexture = textureLoader.load("/textures/door/alpha.jpg");
const doorAmbientOcclusionTexture = textureLoader.load("/textures/door/ambientOcclusion.jpg");
const doorHeightTexture = textureLoader.load("/textures/door/height.jpg");
const doorNormalTexture = textureLoader.load("/textures/door/normal.jpg");
const doorMetalnessTexture = textureLoader.load("/textures/door/metalness.jpg");
const doorRoughnessTexture = textureLoader.load("/textures/door/roughness.jpg");

const bricksColorTexture = textureLoader.load("/textures/bricks/color.jpg");
const bricksAmbientOcclusionTexture = textureLoader.load("/textures/bricks/ambientOcclusion.jpg");
const bricksNormalTexture = textureLoader.load("/textures/bricks/normal.jpg");
const bricksRoughnessTexture = textureLoader.load("/textures/bricks/roughness.jpg");

const house = new THREE.Group();
scene.add(house);

// Walls
const walls = new THREE.Mesh(
    new THREE.BoxGeometry(7, 5.5, 7),
    new THREE.MeshStandardMaterial({
        map: bricksColorTexture,
        aoMap: bricksAmbientOcclusionTexture,
        normalMap: bricksNormalTexture,
        roughnessMap: bricksRoughnessTexture,
    })
);
walls.castShadow = true;
walls.geometry.setAttribute("uv2", new THREE.Float32BufferAttribute(walls.geometry.attributes.uv.array, 2));
walls.position.y = 1.25;
house.add(walls);

// Roof
const roof = new THREE.Mesh(new THREE.ConeGeometry(6, 1, 4), new THREE.MeshStandardMaterial({ color: "#b35f45" }));
roof.rotation.y = Math.PI * 0.25;
roof.position.y = 4 + 0.5;
house.add(roof);

// Door
const door = new THREE.Mesh(
    new THREE.PlaneGeometry(3.5, 3.5, 100, 100),
    new THREE.MeshStandardMaterial({
        map: doorColorTexture,
        transparent: true,
        alphaMap: doorAlphaTexture,
        aoMap: doorAmbientOcclusionTexture,
        displacementMap: doorHeightTexture,
        displacementScale: 0.1,
        normalMap: doorNormalTexture,
        metalnessMap: doorMetalnessTexture,
        roughnessMap: doorRoughnessTexture,
    })
);
door.geometry.setAttribute("uv2", new THREE.Float32BufferAttribute(door.geometry.attributes.uv.array, 2));
door.position.y = 1.5;
door.position.z = 3.5 + 0.01;
house.add(door);

// Bushes
const bushGeometry = new THREE.SphereGeometry(1, 16, 16);
const bushMaterial = new THREE.MeshStandardMaterial({ color: "#89c854" });

const bush1 = new THREE.Mesh(bushGeometry, bushMaterial);
bush1.castShadow = true;
bush1.scale.set(0.5, 0.5, 0.5);
bush1.position.set(1.8, 0.2, 4);

const bush2 = new THREE.Mesh(bushGeometry, bushMaterial);
bush2.castShadow = true;
bush2.scale.set(0.25, 0.25, 0.25);
bush2.position.set(1.1, 0.1, 4);

const bush3 = new THREE.Mesh(bushGeometry, bushMaterial);
bush3.castShadow = true;
bush3.scale.set(0.4, 0.4, 0.4);
bush3.position.set(-1, 0.1, 4);

const bush4 = new THREE.Mesh(bushGeometry, bushMaterial);
bush4.castShadow = true;
bush4.scale.set(0.15, 0.15, 0.15);
bush4.position.set(-1, 0.05, 2.6);

house.add(bush1, bush2, bush3, bush4);

//Physics
const world = new CANNON.World()
world.gravity.set(0, - 9.82, 0)
// LIGHTS
light();

//Fog;

const fog = new THREE.Fog("#262837", 1, 24);
scene.fog = fog;
// FLOOR
generateFloor();

// CONTROL KEYS
const keysPressed = {};
const keyDisplayQueue = new KeyDisplay();
document.addEventListener(
    "keydown",
    (event) => {
        keyDisplayQueue.down(event.key);
        if (event.shiftKey && characterControls) {
            characterControls.switchRunToggle();
        } else {
            keysPressed[event.key.toLowerCase()] = true;
        }
    },
    false
);
document.addEventListener(
    "keyup",
    (event) => {
        keyDisplayQueue.up(event.key);
        keysPressed[event.key.toLowerCase()] = false;
    },
    false
);

const clock = new THREE.Clock();

// RESIZE HANDLER
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    keyDisplayQueue.updatePosition();
}
window.addEventListener("resize", onWindowResize);

function generateFloor() {
    // TEXTURES
    const placeholder = textureLoader.load("./textures/floor/stone/PavingStones070_Color.jpg");

    const floorColorTexture = textureLoader.load("./textures/floor/stone/PavingStones070_Color.jpg");
    const floorAmbientOcclusionTexture = textureLoader.load(
        "./textures/floor/stone/PavingStones070_AmbientOcclusion.jpg"
    );
    const floorNormalTexture = textureLoader.load("./textures/floor/stone/PavingStones070_NormalGL.jpg");
    const floorRoughnessTexture = textureLoader.load("./textures/floor/stone/PavingStones070_Roughness.jpg");
    const floorHeightTexture = textureLoader.load("./textures/floor/stone/PavingStones070_Displacement.jpg");

    const WIDTH = 4;
    const LENGTH = 4;
    const NUM_X = 15;
    const NUM_Z = 15;

    const geometry = new THREE.PlaneGeometry(WIDTH, LENGTH, 512, 512);
    const material = new THREE.MeshStandardMaterial({
        map: floorColorTexture,
        normalMap: floorNormalTexture,
        displacementMap: floorHeightTexture,
        displacementScale: 0.1,
        roughnessMap: floorRoughnessTexture,
        aoMap: floorAmbientOcclusionTexture,
    });
    // const material = new THREE.MeshPhongMaterial({ map: placeholder})

    for (let i = 0; i < NUM_X; i++) {
        for (let j = 0; j < NUM_Z; j++) {
            const floor = new THREE.Mesh(geometry, material);
            floor.receiveShadow = true;
            floor.rotation.x = -Math.PI / 2;

            floor.position.x = i * WIDTH - (NUM_X / 2) * WIDTH;
            floor.position.z = j * LENGTH - (NUM_Z / 2) * LENGTH;

            scene.add(floor);
        }
    }
}
/**
 * Ghosts
 */
const ghost1 = new THREE.PointLight("#ff00ff", 3, 3);
ghost1.castShadow = true;
ghost1.shadow.mapSize.width = 256;
ghost1.shadow.mapSize.height = 256;
ghost1.shadow.camera.far = 7;
scene.add(ghost1);

const ghost2 = new THREE.PointLight("#00ffff", 3, 3);
ghost2.castShadow = true;
ghost2.shadow.mapSize.width = 256;
ghost2.shadow.mapSize.height = 256;
ghost2.shadow.camera.far = 7;
scene.add(ghost2);

const ghost3 = new THREE.PointLight("#ff7800", 3, 3);
ghost3.castShadow = true;
ghost3.shadow.mapSize.width = 256;
ghost3.shadow.mapSize.height = 256;
ghost3.shadow.camera.far = 7;
scene.add(ghost3);
function light() {
    /**
     * Lights
     */
    // Ambient light
    const ambientLight = new THREE.AmbientLight("#b9d5ff", 0.3);
    gui.add(ambientLight, "intensity").min(0).max(1).step(0.001);
    scene.add(ambientLight);

    // Directional light
    const moonLight = new THREE.DirectionalLight("#b9d5ff", 0.12);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.width = 256;
    moonLight.shadow.mapSize.height = 256;
    moonLight.shadow.camera.far = 15;
    moonLight.position.set(4, 5, -2);
    gui.add(moonLight, "intensity").min(0).max(1).step(0.001);
    gui.add(moonLight.position, "x").min(-5).max(5).step(0.001);
    gui.add(moonLight.position, "y").min(-5).max(5).step(0.001);
    gui.add(moonLight.position, "z").min(-5).max(5).step(0.001);
    scene.add(moonLight);

    // Door light
    const doorLight = new THREE.PointLight("#ff7d46", 1, 7);
    doorLight.castShadow = true;
    doorLight.shadow.mapSize.width = 256;
    doorLight.shadow.mapSize.height = 256;
    doorLight.shadow.camera.far = 7;

    doorLight.position.set(0, 4, 4.7);
    house.add(doorLight);

    // scene.add( new THREE.CameraHelper(dirLight.shadow.camera))
}
// ANIMATE
function animate() {
    let mixerUpdateDelta = clock.getDelta();
    const elapsedTime = clock.getElapsedTime()
    if (characterControls) {
        characterControls.update(mixerUpdateDelta, keysPressed);
    }
    orbitControls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
    // Ghosts
    const ghost1Angle = elapsedTime * 0.5;
    ghost1.position.x = Math.cos(ghost1Angle) * 6;
    ghost1.position.z = Math.sin(ghost1Angle) * 6;
    ghost1.position.y = Math.sin(elapsedTime * 5);

    const ghost2Angle = -elapsedTime * 0.32;
    ghost2.position.x = Math.cos(ghost2Angle) * 6
    ghost2.position.z = Math.sin(ghost2Angle) * 6;
    ghost2.position.y = Math.sin(elapsedTime * 4) + Math.sin(elapsedTime * 2.5);

    const ghost3Angle = -elapsedTime * 0.18;
    ghost3.position.x = Math.cos(ghost3Angle) * (7 + Math.sin(elapsedTime * 0.32));
    ghost3.position.z = Math.sin(ghost3Angle) * (7 + Math.sin(elapsedTime * 0.5));
    ghost3.position.y = Math.sin(elapsedTime * 4) + Math.sin(elapsedTime * 2.5);
}
document.body.appendChild(renderer.domElement);
animate();
