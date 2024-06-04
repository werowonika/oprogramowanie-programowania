// Import the necessary components from the Three.js library
import * as THREE from 'three';

// Define the Body class to represent each object in the simulation
class Body {
    constructor(pos, vel, mass) {
        this.pos = pos; // Position vector
        this.vel = vel; // Velocity vector
        this.acc = new THREE.Vector2(0, 0); // Acceleration vector, initialized to zero
        this.mass = mass; // Mass of the body
    }

    // Update the position and velocity of the body based on the time step
    update(dt) {
        this.pos.add(this.vel.clone().multiplyScalar(dt)); // Update position based on velocity
        this.vel.add(this.acc.clone().multiplyScalar(dt)); // Update velocity based on acceleration
        this.acc.set(0, 0); // Reset acceleration after updating velocity
    }
}

// Helper function to generate random vectors within a disc
function randDisc() {
    const theta = Math.random() * Math.PI * 2; // Random angle in the xy-plane
    const r = Math.random(); // Random radius
    return new THREE.Vector2(Math.cos(theta) * r, Math.sin(theta) * r); // Return vector within the disc
}

// Create the scene where all objects will be placed
const scene = new THREE.Scene();
// Create the camera with a perspective view
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// Create the renderer to display the scene
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth / 1.5, window.innerHeight / 1.5); // Set the size of the renderer
document.getElementById('threejs-container').appendChild(renderer.domElement); // Add the renderer to the DOM

// Initialize an array to hold the bodies in the simulation
const bodies = [];
const n = 100; // Number of bodies
const dt = 0.001; // Reduced time step
const min = 0.0001; // Minimum value to avoid division by zero in calculations

// Create the bodies with random initial positions and velocities
for (let i = 0; i < n; i++) {
    const pos = randDisc(); // Random initial position within a disc
    const vel = randDisc().multiplyScalar(0.002); // Random initial velocity within a disc, scaled down
    const mass = 2; // Mass of the body
    bodies.push(new Body(pos, vel, mass)); // Add the new body to the array
}

// Centering bodies
const velSum = bodies.reduce((sum, body) => sum.add(body.vel.clone().multiplyScalar(body.mass)), new THREE.Vector2(0, 0)).divideScalar(n);
const posSum = bodies.reduce((sum, body) => sum.add(body.pos.clone().multiplyScalar(body.mass)), new THREE.Vector2(0, 0)).divideScalar(n);

bodies.forEach(body => {
    body.vel.sub(velSum);
    body.pos.sub(posSum);
});

const maxRadius = Math.max(...bodies.map(body => body.pos.length()));
bodies.forEach(body => {
    body.pos.divideScalar(maxRadius);
});

// Create meshes for the bodies
const meshes = bodies.map(body => {
    const geometry = new THREE.SphereGeometry(0.02, 32, 32); // Geometry of each body
    const material = new THREE.MeshBasicMaterial({ color: Math.random() * 0xffffff }); // Random color for each body
    const sphere = new THREE.Mesh(geometry, material); // Create a mesh with the geometry and material
    scene.add(sphere); // Add the mesh to the scene
    return sphere; // Return the mesh for further use
});

camera.position.z = 5; // Set camera position along the z-axis

function animate() {
    // Update physics for each pair of bodies
    for (let i = 0; i < bodies.length; i++) {
        const p1 = bodies[i].pos; // Position of body i
        const m1 = bodies[i].mass; // Mass of body i
        for (let j = i + 1; j < bodies.length; j++) {
            const p2 = bodies[j].pos; // Position of body j
            const m2 = bodies[j].mass; // Mass of body j

            const r = p2.clone().sub(p1); // Vector from body i to body j
            const magSq = r.x * r.x + r.y * r.y; // Square of the distance between the bodies
            let mag = Math.sqrt(magSq); // Distance between the bodies
            if (mag < 1) {
                mag = 1; // Prevent very small distances that could cause instability
            }
            const tmp = r.clone().divideScalar(Math.max(magSq, min) * mag); // Calculate temporary vector for force calculation

            // Apply gravitational force to both bodies
            bodies[i].acc.add(tmp.clone().multiplyScalar(m2));
            bodies[j].acc.sub(tmp.clone().multiplyScalar(m1));
        }
    }

    // Update positions and check boundaries
    bodies.forEach(body => {
        body.update(dt); // Update the position and velocity of each body

        // Check if the body has crossed the boundaries of the simulation
        if (body.pos.x <= -3 || body.pos.x >= 3) body.vel.x *= -1; // Reverse velocity if out of bounds along x-axis
        if (body.pos.y <= -3 || body.pos.y >= 3) body.vel.y *= -1; // Reverse velocity if out of bounds along y-axis
    });

    // Update mesh positions to match the updated body positions
    meshes.forEach((mesh, index) => {
        const body = bodies[index]; // Get the corresponding body
        mesh.position.set(body.pos.x, body.pos.y, 0); // Set mesh position based on body position
    });

    renderer.render(scene, camera); // Render the scene with updated positions
    requestAnimationFrame(animate); // Request the next animation frame
}

animate(); // Start the animation loop
