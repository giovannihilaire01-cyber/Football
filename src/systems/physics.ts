import * as CANNON from 'cannon-es';
import { Player } from '../components/player';

export class PhysicsWorld {
  private world: CANNON.World;
  private bodies: CANNON.Body[] = [];
  private playerMaterial: CANNON.Material;
  private ballMaterial: CANNON.Material;
  private groundMaterial: CANNON.Material;

  constructor(world: CANNON.World) {
    this.world = world;

    // Physics configuration based on real-world values:
    // Friction: Based on coefficient of friction for grass (~0.4-0.6)
    // Restitution: Based on material elasticity
    //   - Grass: 0.1 (absorbs energy)
    //   - Ball-grass: 0.2 (some bounce)
    //   - Walls: 0.5 (partial bounce)
    this.world.defaultContactMaterial.friction = 0.5; // Realistic grass friction
    this.world.defaultContactMaterial.restitution = 0.15; // Ball on grass (slight bounce)

    // Setup contact materials for realistic interactions
    this.setupContactMaterials();
    this.setupBoundaries();
  }

  private setupContactMaterials(): void {
    // Define material types for different bodies
    this.playerMaterial = new CANNON.Material('player');
    this.ballMaterial = new CANNON.Material('ball');
    this.groundMaterial = new CANNON.Material('ground');

    // Player-to-player contact: High friction to prevent sliding
    const playerPlayerContact = new CANNON.ContactMaterial(this.playerMaterial, this.playerMaterial, {
      friction: 0.8,
      restitution: 0.0, // No bounce between players
    });
    this.world.addContactMaterial(playerPlayerContact);

    // Player-to-ball contact: Lower friction for kicking, realistic bounce
    const playerBallContact = new CANNON.ContactMaterial(this.playerMaterial, this.ballMaterial, {
      friction: 0.3, // Lower friction allows clean kicks
      restitution: 0.6, // Ball bounces off player when kicked
    });
    this.world.addContactMaterial(playerBallContact);

    // Ball-to-ground contact: Realistic rolling with slight bounce
    const ballGroundContact = new CANNON.ContactMaterial(this.ballMaterial, this.groundMaterial, {
      friction: 0.5, // Grass friction affects rolling
      restitution: 0.2, // Slight bounce on ground
    });
    this.world.addContactMaterial(ballGroundContact);

    // Ground-to-player contact: Realistic foot friction
    const playerGroundContact = new CANNON.ContactMaterial(this.playerMaterial, this.groundMaterial, {
      friction: 0.8, // High friction for traction
      restitution: 0.0, // No bounce
    });
    this.world.addContactMaterial(playerGroundContact);
  }

  isGrounded(player: Player): boolean {
    // Multi-point raycast for robust ground detection
    // Uses 8 rays in circle pattern around player base
    const rayPoints = [
      [0, 0],       // Center
      [0.25, 0],    // Right
      [-0.25, 0],   // Left
      [0, 0.25],    // Forward
      [0, -0.25],   // Back
      [0.17, 0.17], // Diagonal 1
      [-0.17, 0.17], // Diagonal 2
      [0.17, -0.17], // Diagonal 3
      [-0.17, -0.17], // Diagonal 4
    ];

    let groundCount = 0;
    const groundThreshold = 2; // Need at least 2 rays hitting ground (more lenient)

    for (const [offsetX, offsetZ] of rayPoints) {
      const rayResult = new CANNON.RaycastResult();
      const from = new CANNON.Vec3(
        player.body.position.x + offsetX,
        player.body.position.y,
        player.body.position.z + offsetZ
      );
      const to = new CANNON.Vec3(
        player.body.position.x + offsetX,
        player.body.position.y - 0.8, // Cast down 0.8 unit
        player.body.position.z + offsetZ
      );

      this.world.raycastClosest(from, to, {}, rayResult);

      // Ground detected if ray hits within 0.8 units
      if (rayResult.hasHit && rayResult.distance < 0.8) {
        groundCount++;
      }
    }

    // Player is grounded if at least 2 rays hit ground (foot contact)
    return groundCount >= groundThreshold;
  }

  private setupBoundaries(): void {
    // Ground plane with realistic grass friction
    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({
      mass: 0,
      shape: groundShape,
      friction: 0.6, // Realistic grass friction
      restitution: 0.1 // Grass absorbs energy
    });
    groundBody.material = this.groundMaterial;
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    this.world.addBody(groundBody);

    // Boundary walls (invisible collision)
    // Low friction on walls for realistic ball bounce
    const wallThickness = 1;

    // Front boundary (z = -40)
    const frontWall = new CANNON.Box(new CANNON.Vec3(60, 10, wallThickness));
    const frontWallBody = new CANNON.Body({ mass: 0, shape: frontWall });
    frontWallBody.material = this.groundMaterial;
    frontWallBody.position.set(0, 5, -40);
    this.world.addBody(frontWallBody);

    // Back boundary (z = 40)
    const backWall = new CANNON.Box(new CANNON.Vec3(60, 10, wallThickness));
    const backWallBody = new CANNON.Body({ mass: 0, shape: backWall });
    backWallBody.material = this.groundMaterial;
    backWallBody.position.set(0, 5, 40);
    this.world.addBody(backWallBody);

    // Left boundary (x = -60)
    const leftWall = new CANNON.Box(new CANNON.Vec3(wallThickness, 10, 40));
    const leftWallBody = new CANNON.Body({ mass: 0, shape: leftWall });
    leftWallBody.material = this.groundMaterial;
    leftWallBody.position.set(-60, 5, 0);
    this.world.addBody(leftWallBody);

    // Right boundary (x = 60)
    const rightWall = new CANNON.Box(new CANNON.Vec3(wallThickness, 10, 40));
    const rightWallBody = new CANNON.Body({ mass: 0, shape: rightWall });
    rightWallBody.material = this.groundMaterial;
    rightWallBody.position.set(60, 5, 0);
    this.world.addBody(rightWallBody);
  }

  addBody(body: CANNON.Body, materialType: 'player' | 'ball' | 'ground' = 'player'): void {
    // Apply material based on body type
    if (materialType === 'player') {
      body.material = this.playerMaterial;
    } else if (materialType === 'ball') {
      body.material = this.ballMaterial;
    } else if (materialType === 'ground') {
      body.material = this.groundMaterial;
    }

    this.world.addBody(body);
    this.bodies.push(body);
  }

  getWorld(): CANNON.World {
    return this.world;
  }

  getBodies(): CANNON.Body[] {
    return this.bodies;
  }

  getPlayerMaterial(): CANNON.Material {
    return this.playerMaterial;
  }

  getBallMaterial(): CANNON.Material {
    return this.ballMaterial;
  }

  getGroundMaterial(): CANNON.Material {
    return this.groundMaterial;
  }

  // Apply rolling resistance to ball AND enforce height constraints
  // Rolling resistance: F = -μ_rr × m × g
  // For grass: μ_rr ≈ 0.001-0.002
  applyRollingResistance(ballBody: CANNON.Body): void {
    const rollingResistanceCoeff = 0.0015; // Coefficient of rolling resistance on grass
    const gravityAccel = 9.82;

    // ENFORCE MAXIMUM HEIGHT: Ball cannot exceed realistic trajectory height
    // Ball radius = 0.22, so minimum Y position = 0.22 (on ground)
    // Realistic maximum height for headers/throws: ~2.5 meters
    const ballRadius = 0.22;
    const maxBallHeight = 2.5; // Realistic max height (headers ~2.44m goal height)
    const minBallHeight = ballRadius; // Ball rests on ground

    if (ballBody.position.y > maxBallHeight) {
      ballBody.position.y = maxBallHeight;
      ballBody.velocity.y = Math.min(ballBody.velocity.y, 0); // Only allow downward
    }

    if (ballBody.position.y < minBallHeight) {
      ballBody.position.y = minBallHeight;
      ballBody.velocity.y = 0; // Stop downward movement (on ground)
    }

    // Only apply rolling resistance if ball is moving and relatively on ground
    const speed = ballBody.velocity.length();
    if (speed > 0.1 && ballBody.position.y < 0.5) { // Only on ground surface
      // Drag force from rolling resistance
      const dragMagnitude = rollingResistanceCoeff * ballBody.mass * gravityAccel;

      // Apply force opposite to velocity direction
      const velocityDir = new CANNON.Vec3(
        ballBody.velocity.x,
        0, // Only horizontal rolling
        ballBody.velocity.z
      );
      const speed_safe = Math.max(velocityDir.length(), 0.01);
      velocityDir.normalize();

      const resistanceForce = new CANNON.Vec3(
        -velocityDir.x * dragMagnitude,
        0,
        -velocityDir.z * dragMagnitude
      );

      ballBody.applyForce(resistanceForce, ballBody.position);
    }
  }
}
