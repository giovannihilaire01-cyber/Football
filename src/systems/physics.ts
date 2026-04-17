import * as CANNON from 'cannon-es';
import { Player } from '../components/player';

export class PhysicsWorld {
  private world: CANNON.World;
  private bodies: CANNON.Body[] = [];

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

    this.setupBoundaries();
  }

  isGrounded(player: Player): boolean {
    const rayResult = new CANNON.RaycastResult();
    const from = new CANNON.Vec3(
      player.body.position.x,
      player.body.position.y,
      player.body.position.z
    );
    const to = new CANNON.Vec3(
      player.body.position.x,
      player.body.position.y - 1.2,
      player.body.position.z
    );

    this.world.raycastClosest(from, to, {}, rayResult);
    return rayResult.hasHit && rayResult.distance < 0.5;
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
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    this.world.addBody(groundBody);

    // Boundary walls (invisible collision)
    // Low friction on walls for realistic ball bounce
    const wallThickness = 1;

    // Front boundary (z = -40)
    const frontWall = new CANNON.Box(new CANNON.Vec3(60, 10, wallThickness));
    const frontWallBody = new CANNON.Body({ mass: 0, shape: frontWall });
    frontWallBody.position.set(0, 5, -40);
    this.world.addBody(frontWallBody);

    // Back boundary (z = 40)
    const backWall = new CANNON.Box(new CANNON.Vec3(60, 10, wallThickness));
    const backWallBody = new CANNON.Body({ mass: 0, shape: backWall });
    backWallBody.position.set(0, 5, 40);
    this.world.addBody(backWallBody);

    // Left boundary (x = -60)
    const leftWall = new CANNON.Box(new CANNON.Vec3(wallThickness, 10, 40));
    const leftWallBody = new CANNON.Body({ mass: 0, shape: leftWall });
    leftWallBody.position.set(-60, 5, 0);
    this.world.addBody(leftWallBody);

    // Right boundary (x = 60)
    const rightWall = new CANNON.Box(new CANNON.Vec3(wallThickness, 10, 40));
    const rightWallBody = new CANNON.Body({ mass: 0, shape: rightWall });
    rightWallBody.position.set(60, 5, 0);
    this.world.addBody(rightWallBody);
  }

  addBody(body: CANNON.Body): void {
    this.world.addBody(body);
    this.bodies.push(body);
  }

  getWorld(): CANNON.World {
    return this.world;
  }

  getBodies(): CANNON.Body[] {
    return this.bodies;
  }

  // Apply rolling resistance to ball
  // Rolling resistance: F = -μ_rr × m × g
  // For grass: μ_rr ≈ 0.001-0.002
  applyRollingResistance(ballBody: CANNON.Body): void {
    const rollingResistanceCoeff = 0.0015; // Coefficient of rolling resistance on grass
    const gravityAccel = 9.82;

    // Only apply if ball is moving and on ground
    const speed = ballBody.velocity.length();
    if (speed > 0.1) {
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
