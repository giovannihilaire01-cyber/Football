import * as THREE from 'three';

export function createField(): THREE.Mesh[] {
  const meshes: THREE.Mesh[] = [];

  // Field surface (grass)
  const fieldGeometry = new THREE.PlaneGeometry(120, 80);
  const fieldMaterial = new THREE.MeshLambertMaterial({ color: 0x2d8659 });
  const field = new THREE.Mesh(fieldGeometry, fieldMaterial);
  field.rotation.x = -Math.PI / 2;
  field.receiveShadow = true;
  meshes.push(field);

  // Boundary walls (invisible collision only, but we'll add visual lines)
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });

  // Field markings - center line
  const centerLineGeometry = new THREE.BufferGeometry();
  centerLineGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(new Float32Array([0, 0.01, -40, 0, 0.01, 40]), 3)
  );
  const centerLine = new THREE.Line(centerLineGeometry, lineMaterial);
  meshes.push(centerLine);

  // Center circle
  const circleGeometry = new THREE.BufferGeometry();
  const points: number[] = [];
  const radius = 9.15;
  const segments = 64;
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    points.push(Math.cos(angle) * radius, 0.01, Math.sin(angle) * radius);
  }
  circleGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points), 3));
  const centerCircle = new THREE.Line(circleGeometry, lineMaterial);
  meshes.push(centerCircle);

  // Goal areas - left
  const leftGoalGeometry = new THREE.BufferGeometry();
  leftGoalGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(
      new Float32Array([
        -60, 0.01, -20.16, -60, 0.01, 20.16, -45.72, 0.01, 20.16, -45.72, 0.01, -20.16, -60, 0.01, -20.16,
      ]),
      3
    )
  );
  const leftGoal = new THREE.Line(leftGoalGeometry, lineMaterial);
  meshes.push(leftGoal);

  // Goal areas - right
  const rightGoalGeometry = new THREE.BufferGeometry();
  rightGoalGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(
      new Float32Array([
        60, 0.01, -20.16, 60, 0.01, 20.16, 45.72, 0.01, 20.16, 45.72, 0.01, -20.16, 60, 0.01, -20.16,
      ]),
      3
    )
  );
  const rightGoal = new THREE.Line(rightGoalGeometry, lineMaterial);
  meshes.push(rightGoal);

  // Goal posts - left
  const goalPostMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const postGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2.44, 8);

  const leftPost1 = new THREE.Mesh(postGeometry, goalPostMaterial);
  leftPost1.position.set(-60, 1.22, -7.32);
  meshes.push(leftPost1);

  const leftPost2 = new THREE.Mesh(postGeometry, goalPostMaterial);
  leftPost2.position.set(-60, 1.22, 7.32);
  meshes.push(leftPost2);

  // Goal posts - right
  const rightPost1 = new THREE.Mesh(postGeometry, goalPostMaterial);
  rightPost1.position.set(60, 1.22, -7.32);
  meshes.push(rightPost1);

  const rightPost2 = new THREE.Mesh(postGeometry, goalPostMaterial);
  rightPost2.position.set(60, 1.22, 7.32);
  meshes.push(rightPost2);

  // Crossbars
  const barGeometry = new THREE.CylinderGeometry(0.15, 0.15, 14.64, 8);

  const leftBar = new THREE.Mesh(barGeometry, goalPostMaterial);
  leftBar.rotation.z = Math.PI / 2;
  leftBar.position.set(-60, 2.44, 0);
  meshes.push(leftBar);

  const rightBar = new THREE.Mesh(barGeometry, goalPostMaterial);
  rightBar.rotation.z = Math.PI / 2;
  rightBar.position.set(60, 2.44, 0);
  meshes.push(rightBar);

  // Stadium stands (bleachers)
  const standMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });

  // Create simple stand structure along each side
  const standWidth = 120;
  const standHeight = 15;
  const standDepth = 8;

  // Long side stands (front and back)
  for (let z of [-50, 50]) {
    const standGeometry = new THREE.BoxGeometry(standWidth, standHeight, standDepth);
    const stand = new THREE.Mesh(standGeometry, standMaterial);
    stand.position.set(0, 7, z);
    stand.castShadow = true;
    stand.receiveShadow = true;
    meshes.push(stand);
  }

  // Goal line stands (left and right)
  for (let x of [-70, 70]) {
    const standGeometry = new THREE.BoxGeometry(standDepth, standHeight, 80);
    const stand = new THREE.Mesh(standGeometry, standMaterial);
    stand.position.set(x, 7, 0);
    stand.castShadow = true;
    stand.receiveShadow = true;
    meshes.push(stand);
  }

  // Add crowd spectators (simple dots on stands)
  const spectatorGeometry = new THREE.SphereGeometry(0.3, 8, 8);
  const spectatorMaterials = [
    new THREE.MeshStandardMaterial({ color: 0xff0000 }), // Team A
    new THREE.MeshStandardMaterial({ color: 0x0000ff }), // Team B
    new THREE.MeshStandardMaterial({ color: 0xffff00 }), // Neutral
  ];

  // Add spectators in stands
  const spectatorPositions = [
    { x: -45, z: -45, material: 0 }, { x: 0, z: -45, material: 1 }, { x: 45, z: -45, material: 0 },
    { x: -45, z: 45, material: 0 }, { x: 0, z: 45, material: 1 }, { x: 45, z: 45, material: 0 },
    { x: -65, z: -20, material: 2 }, { x: -65, z: 0, material: 2 }, { x: -65, z: 20, material: 2 },
    { x: 65, z: -20, material: 2 }, { x: 65, z: 0, material: 2 }, { x: 65, z: 20, material: 2 },
  ];

  for (const pos of spectatorPositions) {
    const spectator = new THREE.Mesh(spectatorGeometry, spectatorMaterials[pos.material]);
    spectator.position.set(pos.x, 12, pos.z);
    spectator.castShadow = true;
    meshes.push(spectator);

    // Add more spectators nearby
    for (let i = 0; i < 3; i++) {
      const offset = new THREE.Mesh(spectatorGeometry, spectatorMaterials[pos.material]);
      offset.position.set(
        pos.x + (Math.random() - 0.5) * 6,
        12 + (Math.random() - 0.5) * 2,
        pos.z + (Math.random() - 0.5) * 6
      );
      offset.castShadow = true;
      meshes.push(offset);
    }
  }

  return meshes;
}
