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

  const shape = new CANNON.Cylinder(0.3, 0.3, 1.8, 8);
  const body = new CANNON.Body({
    mass: 75,
    shape: shape,
    linearDamping: 0.15, // Reduced from 0.8 (was 8x too high)
    angularDamping: 0.4, // Reduced from 0.9 (was 2x too high)
    friction: 0.8,
  });
  body.position.set(x, 0.9, z);

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
