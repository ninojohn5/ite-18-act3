import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';


const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000); // Black background
renderer.setPixelRatio(window.devicePixelRatio);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();

// Set black background
scene.background = new THREE.Color(0x000000);

// Camera setup
const camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 1, 1000);
camera.position.set(6, 5, 10);  // Moves the camera to a different location


const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;

// Allow unlimited zooming in and out
controls.minDistance = 0.01; // Very close
controls.maxDistance = Infinity; // Unlimited zoom out

controls.minPolarAngle = 0; // Allow full vertical rotation
controls.maxPolarAngle = Math.PI; // No restrictions on vertical rotation
controls.autoRotate = false;
controls.target = new THREE.Vector3(0, 1, 0);
controls.update();


// Ambient light for base illumination
const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);

// Ground plane
const groundGeometry = new THREE.PlaneGeometry(50, 50, 32, 32);
groundGeometry.rotateX(-Math.PI / 2);
const groundMaterial = new THREE.MeshStandardMaterial({
  color: 0x2b2b2b, // Darker ground for night vibes
  side: THREE.DoubleSide
});
const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
groundMesh.receiveShadow = true;
scene.add(groundMesh);

// SpotLight for the scene
const spotLight = new THREE.SpotLight(0xffffff, 1.5, 100, Math.PI / 4, 0.5, 1);
spotLight.position.set(0, 30, 10);
spotLight.castShadow = true;
scene.add(spotLight);


  

// Load a tree model multiple times and position them around the campfire
const treeLoader = new GLTFLoader().setPath('public/pine_tree/');
treeLoader.load('scene.gltf', (gltf) => {
  console.log('Tree loaded');

  const campfireRadius = 5; // Define a safe radius around the campfire
  const treeAreaLimitZ = 0; // Trees should only be placed where Z < 0 (behind the campfire)

  for (let i = 0; i < 20; i++) {
    const tree = gltf.scene.clone();
    tree.scale.set(0.03, 0.03, 0.03); // Scale down the trees

    let validPosition = false;
    let x, z;

    while (!validPosition) {
      // Random position around the campfire
      const angle = Math.random() * 2 * Math.PI; // Random angle in a circle
      const distance = campfireRadius + Math.random() * 10; // Keep some distance from the campfire
      x = Math.cos(angle) * distance;
      z = Math.sin(angle) * distance;

      // Ensure the tree is behind the campfire (negative Z direction)
      if (z < treeAreaLimitZ) {
        validPosition = true;
      }
    }

    // Compute the tree's bounding box to adjust its Y-position
    const box = new THREE.Box3().setFromObject(tree);
    const treeHeight = box.max.y - box.min.y; // Height of the tree

    // Adjust Y-position to align the bottom of the tree with the ground
    const yPosition = -box.min.y * tree.scale.y; // Align the bottom of the tree to the ground
    tree.position.set(x, yPosition, z);

    tree.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    scene.add(tree);
  }
}, undefined, (error) => console.error('Error loading tree:', error));




const campfireLoader = new GLTFLoader().setPath('public/stage_campfire/');
campfireLoader.load('scene.gltf', (gltf) => {
  console.log('Campfire loaded');

  const campfire = gltf.scene;
  campfire.scale.set(1, 1, 1); // Adjust the size of the campfire
  campfire.position.set(0, 0.1, 0); // Place it on the ground near the center

  // Enable shadows for the campfire model
  campfire.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  scene.add(campfire); // Add the campfire to the scene

  const flickerLight = new THREE.PointLight(0xffa500, 10, 50); // Increased intensity and distance
  flickerLight.castShadow = true;
  flickerLight.position.set(0, 2, 0); // Position above the campfire
  scene.add(flickerLight);
  
  // Function to create the flickering effect
  function flicker() {
    // Randomize intensity to simulate flickering
    flickerLight.intensity = 8 + Math.random() * 2; // Range from 8 to 10 for more light
    flickerLight.distance = 40 + Math.random() * 10; // Increased range for more coverage
  
    // Update this function continuously
    setTimeout(flicker, 50 + Math.random() * 200); // Random flicker intervals
  }
  
  flicker(); // Start the flickering effect
  
}, undefined, (error) => console.error('Error loading campfire:', error));


const tentLoader = new GLTFLoader().setPath('public/tent/');
// After the tent is loaded, add this code to update its rotation to face the campfire
tentLoader.load('scene.gltf', (gltf) => {
  console.log('Tent loaded');

  const tent = gltf.scene;
  tent.scale.set(1, 1, 1); // Adjust the size of the tent

  // Set tent position behind the campfire (in negative Z direction)
  const tentPositionZ = -3; // Adjust as needed, e.g., 3 units behind the campfire
  tent.position.set(0, 0, tentPositionZ); 

  // Compute the tent's bounding box to adjust its Y-position
  const box = new THREE.Box3().setFromObject(tent);
  const tentHeight = box.max.y - box.min.y; // Height of the tent

  // Adjust Y-position to align the bottom of the tent with the ground
  const yPosition = -box.min.y * tent.scale.y; // Align the bottom of the tent to the ground
  tent.position.y = yPosition;

  // Calculate the direction vector from the tent to the campfire (position: (0, 0.1, 0))
  const campfirePosition = new THREE.Vector3(-15, 0.5, 20); // Campfire's position
  const direction = new THREE.Vector3().subVectors(campfirePosition, tent.position).normalize();

  // Use the direction to update the tent's rotation (set its forward direction to the campfire)
  tent.rotation.y = Math.atan2(direction.x, direction.z); // Y-axis rotation to face the campfire

  // Enable shadows for the tent model
  tent.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  // Add the tent to the scene
  scene.add(tent);

}, undefined, (error) => console.error('Error loading tent:', error));




// Create stars
function createStars() {
  const starGeometry = new THREE.SphereGeometry(0.1, 8, 8); // Small spheres for stars
  const starMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff }); // White stars

  for (let i = 0; i < 200; i++) {
    const star = new THREE.Mesh(starGeometry, starMaterial);
    star.position.set(
      (Math.random() - 0.5) * 200, // Random X position within a cube
      Math.random() * 100,         // Random Y position above the ground
      (Math.random() - 0.5) * 200  // Random Z position
    );
    scene.add(star);
  }
}
createStars();

// Window resize handler
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Firefly parameters
const fireflyCount = 50;
const fireflyGeometry = new THREE.SphereGeometry(0.01, 8, 8); // Small spheres for fireflies
const fireflyMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 }); // Yellow color for fireflies

// Array to hold firefly meshes
const fireflies = [];

// Function to create fireflies near the campfire
function createFireflies() {
  const campfirePosition = new THREE.Vector3(0, 0.1, 0); // Campfire's position

  for (let i = 0; i < fireflyCount; i++) {
    const firefly = new THREE.Mesh(fireflyGeometry, fireflyMaterial);
    
    // Random position near the campfire within a small range
    const offset = Math.random() * 3; // Range of 3 units around the campfire
    firefly.position.set(
      campfirePosition.x + (Math.random() - 0.5) * offset * 5,  // Random X within range
      campfirePosition.y + Math.random() * 2,                  // Random Y near campfire height
      campfirePosition.z + (Math.random() - 0.5) * offset * 5   // Random Z within range
    );

    // Randomize initial speed and direction
    firefly.userData = {
      speed: Math.random() * 0.01 + 0.01,  // Speed between 0.02 and 0.07
      direction: new THREE.Vector3(
        Math.random() - 0.5, 
        Math.random() - 0.5, 
        Math.random() - 0.5
      ).normalize(),
    };

    fireflies.push(firefly);
    scene.add(firefly);
  }
}

// Update fireflies' position to simulate flickering and movement
function updateFireflies() {
  fireflies.forEach(firefly => {
    // Move firefly in a random direction
    firefly.position.add(firefly.userData.direction.clone().multiplyScalar(firefly.userData.speed));

    // If the firefly moves too far, wrap it around the campfire's area
    const distanceFromCampfire = firefly.position.distanceTo(new THREE.Vector3(0, 0, 0)); // Distance to campfire
    if (distanceFromCampfire > 5) { // Keep fireflies within a 5-unit radius of the campfire
      firefly.position.add(firefly.userData.direction.clone().multiplyScalar(-1)); // Move it back
    }

    // Randomly change firefly's direction occasionally to simulate random movement
    if (Math.random() < 0.01) {
      firefly.userData.direction = new THREE.Vector3(
        Math.random() - 0.5, 
        Math.random() - 0.5, 
        Math.random() - 0.5
      ).normalize();
    }
  });
}

// Create fireflies near the campfire
createFireflies();

// Add to the animation loop
function animate() {
  requestAnimationFrame(animate);

  // Update fireflies every frame
  updateFireflies();

  controls.update();
  renderer.render(scene, camera);
}

animate();
