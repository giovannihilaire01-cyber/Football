import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export interface BallData {
  mesh: THREE.Mesh;
  body: CANNON.Body;
}

export function createBall(): BallData {
  const radius = 0.22;
  const geometry = new THREE.SphereGeometry(radius, 32, 32);
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.5,
    metalness: 0.1,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'ball';
  mesh.position.set(0, 1, 0);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  const shape = new CANNON.Sphere(radius);
  const body = new CANNON.Body({
    mass: 0.43,
    shape: shape,
    linearDamping: 0.02, // Reduced from 0.3 (was 6-30x too high - ball was stopping too fast)
    angularDamping: 0.08, // Reduced from 0.3 (ball should spin longer)
  });
  body.position.set(0, 1, 0);

  return { mesh, body };
}
