import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export interface Player {
  mesh: THREE.Mesh;
  body: CANNON.Body;
  number: number;
  team: string;
  position: THREE.Vector3;
  velocity: CANNON.Vec3;
  targetPosition: THREE.Vector3;
  hasControl: boolean;
  selected: boolean;
}

export function createPlayer(number: number, team: string, x: number, z: number, color: THREE.Color): Player {
  const geometry = new THREE.CapsuleGeometry(0.3, 1.8, 4, 8);
  const material = new THREE.MeshStandardMaterial({
    color: color,
    roughness: 0.7,
    metalness: 0.0,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, 0.9, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  // Use Sphere shape for better collision detection and ground contact
  // Sphere radius chosen to match player width (~0.35) and prevent clipping
  const shape = new CANNON.Sphere(0.35);
  const body = new CANNON.Body({
    mass: 75,
    shape: shape,
    linearDamping: 0.3, // Increased from 0.15 - more friction for stability
    angularDamping: 0.8, // Increased from 0.4 - prevent spinning and bouncing
    friction: 0.9, // Increased from 0.8 - more grip on ground
  });
  // Position body center slightly higher to account for sphere radius
  body.position.set(x, 0.95, z);

  return {
    mesh,
    body,
    number,
    team,
    position: mesh.position.clone(),
    velocity: new CANNON.Vec3(),
    targetPosition: new THREE.Vector3(x, 0, z),
    hasControl: false,
    selected: false,
  };
}
