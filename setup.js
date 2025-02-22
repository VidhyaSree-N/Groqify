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

gltfLoader.load('my.glb', (gltf) => {
  gltf.scene.traverse((child) => {
    if (child.isMesh) {
      child.material = bakedMaterial;
      child.geometry.computeBoundingBox();
      child.boundingBox = new THREE.Box3().setFromObject(child);
      collidableObjects.push(child);
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
  { name: "victimEmployee", model: "victim.glb", position: new THREE.Vector3(4.8, 1.81, 13), rotationY: 24.5, scale: 1.3, dialogue: "Hey detective, do you have any leads yet?", object: null }
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

export { scene, camera, controls, renderer, gltfLoader, collidableObjects, officeBoundingBox, npcs };
