import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { createField } from './components/field';
import { createBall } from './components/ball';
import { createTeam } from './components/team';
import { GameState } from './systems/gameState';
import { PhysicsWorld } from './systems/physics';
import { GameRules } from './systems/gameRules';
import { updateHUD, setupControls } from './ui/hud';
import { AIController } from './ai/aiController';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 300, 500);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 80, 100);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
document.getElementById('canvas-container')!.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(50, 100, 50);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.left = -200;
directionalLight.shadow.camera.right = 200;
directionalLight.shadow.camera.top = 200;
directionalLight.shadow.camera.bottom = -200;
scene.add(directionalLight);

// Physics world
const physicsWorld = new CANNON.World();
physicsWorld.gravity.set(0, -9.82, 0);
physicsWorld.defaultContactMaterial.friction = 0.3;

const gamePhysics = new PhysicsWorld(physicsWorld);
const gameState = new GameState();
const gameRules = new GameRules(gameState);

// Create field
const field = createField();
field.forEach(mesh => {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
});

// Create ball
const ballData = createBall();
ballData.mesh.castShadow = true;
scene.add(ballData.mesh);
gamePhysics.addBody(ballData.body);
gameState.setBall(ballData.mesh.position, ballData.body);

// Create teams
const teamA = createTeam('A', -50, new THREE.Color(0xff0000));
const teamB = createTeam('B', 50, new THREE.Color(0x0000ff));

const aiControllerA = new AIController(teamA, gameRules);
const aiControllerB = new AIController(teamB, gameRules);

// Pass physics world to AI controllers for ground detection
aiControllerA.setPhysicsWorld(gamePhysics);
aiControllerB.setPhysicsWorld(gamePhysics);

[teamA, teamB].forEach((team) => {
  team.players.forEach((player) => {
    player.mesh.castShadow = true;
    scene.add(player.mesh);
    gamePhysics.addBody(player.body);
  });
  gameState.addTeam(team);
});

// Setup UI
setupControls(gameState, gameRules);

let gameRunning = true;
let lastTime = Date.now();

const gameLoop = () => {
  requestAnimationFrame(gameLoop);

  const currentTime = Date.now();
  const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.016);
  lastTime = currentTime;

  if (gameRunning) {
    gameState.updateTime(deltaTime);

    // Update AI with game rules reference
    aiControllerA.update(gameState.getBallPosition(), gameState.getTeams(), gameRules);
    aiControllerB.update(gameState.getBallPosition(), gameState.getTeams(), gameRules);

    // Update physics with consistent timestep
    physicsWorld.step(1 / 60);

    // Update game state from physics
    gameState.updatePositions();

    // 🔴 CRITICAL FIX: Sync THREE.js meshes with physics bodies
    for (const team of gameState.getTeams()) {
      for (const player of team.players) {
        player.mesh.position.copy(player.body.position as any);
        player.mesh.quaternion.copy(player.body.quaternion);
      }
    }

    // Sync ball mesh
    const ballBody = gameState.getBallBody();
    if (ballBody) {
      const ballMesh = scene.getObjectByName('ball') || scene.children.find(
        (child: any) => child.geometry?.type === 'SphereGeometry'
      );
      if (ballMesh) {
        ballMesh.position.copy(ballBody.position as any);
        ballMesh.quaternion.copy(ballBody.quaternion);
      }
    }

    // Update game rules
    gameRules.update(deltaTime);

    // Update HUD
    updateHUD(gameState);
  }

  renderer.render(scene, camera);
};

// Handle window resize
window.addEventListener('resize', () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
});

// Expose game functions to UI
(window as any).togglePause = () => {
  gameRunning = !gameRunning;
};
(window as any).gameRules = gameRules;
(window as any).gameState = gameState;

gameLoop();
