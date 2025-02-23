import * as THREE from './js/libs/three.module.js';
import { OrbitControls } from './js/libs/OrbitControls.js';
import { GLTFLoader } from './js/libs/GLTFLoader.js';
import { DRACOLoader } from './js/libs/DRACOLoader.js';

/**
 * Base Setup
 */
const canvas = document.querySelector('canvas.webgl');
const scene = new THREE.Scene();
scene.background = new THREE.Color("rgb(100, 100, 100)");

/**
 * Loaders
 */
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('./js/libs/draco/');

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

const textureLoader = new THREE.TextureLoader();
const bakedTexture = textureLoader.load('text_baked.jpg');
bakedTexture.flipY = false;
bakedTexture.encoding = THREE.sRGBEncoding;
const bakedMaterial = new THREE.MeshBasicMaterial({ map: bakedTexture });

/**
 * Load Environment (my.glb)
 */
let environment;
let collidableObjects = [];
let officeBoundingBox = null;
let evidenceObjects = [];

let collectedEvidence = [];

gltfLoader.load('my.glb', (gltf) => {
  gltf.scene.traverse((child) => {
    if (child.isMesh) {
      child.material = bakedMaterial;
      child.geometry.computeBoundingBox();
      child.boundingBox = new THREE.Box3().setFromObject(child);
      collidableObjects.push(child);

      // **Identify Evidence Objects**
      const evidenceNames = ["Cube010", "Cube002", "Cube008"];
      if (evidenceNames.includes(child.name)) {
        evidenceObjects.push(child);
      }
    }
  });

  environment = gltf.scene;
  scene.add(environment);
  officeBoundingBox = new THREE.Box3().setFromObject(environment);
});

/**
 * Load NPCs
 */
let npcs = [
  { name: "femaleEmployee", model: "female.glb", position: new THREE.Vector3(2.82, 2.51, 0.66), rotationY: 0, scale: 0.9, dialogue: "Hello, detective! Need any help?", object: null },
  { name: "seniorEmployee", model: "senior.glb", position: new THREE.Vector3(6.9, 2.11, 6.8), rotationY: 0, scale: 1.0, dialogue: "Good day, detective. What brings you here?", object: null },
  { name: "maleEmployee", model: "male.glb", position: new THREE.Vector3(-1.0, 1.81, 6.7), rotationY: Math.PI / 2, scale: 1.3, dialogue: "Hey detective, do you have any leads yet?", object: null },
  { name: "victimEmployee", model: "victim.glb", position: new THREE.Vector3(4.8, 1.81, 13), rotationY: 24.5, scale: 1.3, dialogue: "Anything else you want know detective?", object: null }
];

npcs.forEach(npc => {
  gltfLoader.load(npc.model, (gltf) => {
    npc.object = gltf.scene;
    npc.object.position.copy(npc.position);
    npc.object.rotation.y = npc.rotationY;
    npc.object.scale.set(npc.scale, npc.scale, npc.scale);
    npc.object.boundingBox = new THREE.Box3().setFromObject(npc.object);
    collidableObjects.push(npc.object);
    scene.add(npc.object);
  });
});

/**
 * 📺 **Add a Digital Screen Using an Image (Correctly Oriented)**
 */
const screenTexture = textureLoader.load('./logg.png');

// ✅ Ensure the texture is correctly oriented
screenTexture.flipY = true;  // Flip vertically if needed
screenTexture.wrapS = THREE.RepeatWrapping;
screenTexture.repeat.x = 1;  // Keep normal horizontal orientation

const screenMaterial = new THREE.MeshBasicMaterial({
  map: screenTexture,
  side: THREE.DoubleSide, // Ensure visibility from both sides
});

const screenGeometry = new THREE.PlaneGeometry(2, 1.5); // Adjust as needed
const screenMesh = new THREE.Mesh(screenGeometry, screenMaterial);

// ✅ Correct screen position & rotation
screenMesh.position.set(-4.5, 3, -4); // Adjust to fit your scene
screenMesh.rotation.y = 0; // Rotate to face the player

scene.add(screenMesh);

/**
 * 📹 **Add a CCTV Screen Using a Video Texture**
 */
const video = document.createElement('video');
video.src = './footage.mp4'; // 📌 Replace with actual CCTV footage file
video.loop = true;
video.muted = true; // No sound needed
video.play(); // Auto-play

const videoTexture = new THREE.VideoTexture(video);
videoTexture.flipY = true;
videoTexture.minFilter = THREE.LinearFilter;
videoTexture.magFilter = THREE.LinearFilter;
videoTexture.format = THREE.RGBAFormat;

const cctvMaterial = new THREE.MeshBasicMaterial({
  map: videoTexture,
  side: THREE.DoubleSide,
});

const cctvGeometry = new THREE.PlaneGeometry(3.5, 2); // Adjust size as needed
const cctvScreen = new THREE.Mesh(cctvGeometry, cctvMaterial);

// ✅ Position and rotate the CCTV screen
cctvScreen.position.set(9.5, 2.6, 16);  // Adjust position as needed
cctvScreen.rotation.y = Math.PI / 2;  // Face towards the player
scene.add(cctvScreen);



/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight('#ffffff', 0.8);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight('#ffffff', 1);
directionalLight.position.set(5, 10, 5);
scene.add(directionalLight);

/**
 * Camera
 */
const sizes = { width: window.innerWidth, height: window.innerHeight };
const camera = new THREE.PerspectiveCamera(46, sizes.width / sizes.height, 0.1, 10000);
camera.position.set(5, 5, 15);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.target.set(1, 4, 15);

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(sizes.width, sizes.height);
renderer.outputEncoding = THREE.sRGBEncoding;

export { scene, camera, controls, renderer, gltfLoader, collidableObjects, officeBoundingBox, npcs, evidenceObjects, collectedEvidence, screenMesh, cctvScreen, video, videoTexture };
