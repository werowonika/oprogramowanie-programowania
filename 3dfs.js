import * as THREE from 'three';

// Define the Body class to represent each object in the simulation
class Body {
    constructor(pos, vel, mass) {
        this.pos = pos; // Position vector
        this.vel = vel; // Velocity vector
        this.acc = new THREE.Vector3(0, 0, 0); // Acceleration vector, initialized to zero
        this.mass = mass; // Mass of the body
    }

    // Update the position and velocity of the body based on the time step
    update(dt) {
        this.pos.add(this.vel.clone().multiplyScalar(dt)); // Update position based on velocity
        this.vel.add(this.acc.clone().multiplyScalar(dt)); // Update velocity based on acceleration
        this.acc.set(0, 0, 0); // Reset acceleration after updating velocity
    }
}

// Helper function to generate random vectors within a sphere
function randSphere() {
    const theta = Math.random() * Math.PI * 2; // Random angle in the xy-plane
    const phi = Math.random() * Math.PI; // Random angle from the z-axis
    const r = Math.random(); // Random radius
    return new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta) * r, // x component
        Math.sin(phi) * Math.sin(theta) * r, // y component
        Math.cos(phi) * r // z component
    );
}

// Create the scene where all objects will be placed
const scene = new THREE.Scene();
// Create the camera with a perspective view
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
// Create the renderer to display the scene
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight); // Set the size of the renderer
document.getElementById('threejs-container').appendChild(renderer.domElement); // Add the renderer to the DOM

// Add a point light to the scene for illumination
const light = new THREE.PointLight(0xffffff, 300, 10000);
light.position.set(0, 5, 5); // Position the light in the scene
scene.add(light);

// Add ambient light to the scene for overall illumination
const ambientLight = new THREE.AmbientLight(0x404040); // Soft white light
scene.add(ambientLight);

// Initialize an array to hold the bodies in the simulation
const bodies = [];
const n = 100; // Number of bodies
const dt = 0.01; // Time step for simulation
const min = 0.0001; // Minimum value to avoid division by zero in calculations

// Create the bodies with random initial positions and velocities
for (let i = 0; i < n; i++) {
    const pos = randSphere(); // Random initial position
    const vel = randSphere().multiplyScalar(0.02); // Random initial velocity, scaled down
    const mass = 1.0; // Mass of the body
    bodies.push(new Body(pos, vel, mass)); // Add the new body to the array
}

// Create meshes for the bodies with MeshStandardMaterial for better lighting effects
const meshes = bodies.map(body => {
    const geometry = new THREE.SphereGeometry(0.05, 32, 32); // Geometry of each body
    const material = new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff }); // Random color for each body
    const sphere = new THREE.Mesh(geometry, material); // Create a mesh with the geometry and material
    sphere.position.copy(body.pos); // Set the initial position of the mesh
    scene.add(sphere); // Add the mesh to the scene
    return sphere; // Return the mesh for further use
});

// Set the camera position to view the entire scene
camera.position.z = 10;
camera.position.y = 10; // Adjust camera position for a better 3D view
camera.lookAt(new THREE.Vector3(0, 0, 0)); // Make the camera look at the center of the scene

// Function to animate the scene
function animate() {
    // Update physics for each pair of bodies
    for (let i = 0; i < bodies.length; i++) {
        const p1 = bodies[i].pos; // Position of body i
        const m1 = bodies[i].mass; // Mass of body i
        for (let j = i + 1; j < bodies.length; j++) {
            const p2 = bodies[j].pos; // Position of body j
            const m2 = bodies[j].mass; // Mass of body j

            const r = p2.clone().sub(p1); // Vector from body i to body j
            const magSq = r.lengthSq(); // Square of the distance between the bodies
            let mag = Math.sqrt(magSq); // Distance between the bodies
            if (mag < 1) {
                mag = 1; // Prevent very small distances that could cause instability
            }
            const tmp = r.clone().divideScalar(Math.max(magSq, min) * mag); // Force magnitude and direction

            bodies[i].acc.add(tmp.clone().multiplyScalar(m2)); // Update acceleration of body i
            bodies[j].acc.sub(tmp.clone().multiplyScalar(m1)); // Update acceleration of body j
        }
    }

    // Update positions and velocities of all bodies
    bodies.forEach(body => {
        body.update(dt);
    });

    // Update mesh positions to match body positions
    meshes.forEach((mesh, index) => {
        const body = bodies[index];
        mesh.position.copy(body.pos); // Update the mesh position
    });

    renderer.render(scene, camera); // Render the scene from the perspective of the camera
    requestAnimationFrame(animate); // Request the next frame for the animation loop
}

animate(); // Start the animation loop
