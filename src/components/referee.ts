import * as THREE from 'three';

export interface Referee {
  mesh: THREE.Group;
  position: THREE.Vector3;
}

export function createReferee(): Referee {
  const refereeGroup = new THREE.Group();

  // Body
  const bodyGeometry = new THREE.CapsuleGeometry(0.25, 1.2, 4, 8);
  const blackMaterial = new THREE.MeshStandardMaterial({
    color: 0x000000,
    roughness: 0.7,
    metalness: 0.0,
  });
  const body = new THREE.Mesh(bodyGeometry, blackMaterial);
  body.position.y = 0.6;
  body.castShadow = true;
  body.receiveShadow = true;

  // Head
  const headGeometry = new THREE.SphereGeometry(0.15, 16, 16);
  const skinMaterial = new THREE.MeshStandardMaterial({
    color: 0xd4a574,
    roughness: 0.8,
  });
  const head = new THREE.Mesh(headGeometry, skinMaterial);
  head.position.y = 1.3;
  head.castShadow = true;
  head.receiveShadow = true;

  // Whistle (small cylinder)
  const whistleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.15, 8);
  const yellowMaterial = new THREE.MeshStandardMaterial({
    color: 0xFFDD00,
    roughness: 0.5,
  });
  const whistle = new THREE.Mesh(whistleGeometry, yellowMaterial);
  whistle.position.set(0.15, 1.2, 0);
  whistle.rotation.z = Math.PI / 4;
  whistle.castShadow = true;

  refereeGroup.add(body);
  refereeGroup.add(head);
  refereeGroup.add(whistle);
  refereeGroup.position.set(0, 0, 0);

  return {
    mesh: refereeGroup,
    position: refereeGroup.position as any,
  };
}
