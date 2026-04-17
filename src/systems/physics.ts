import * as CANNON from 'cannon-es';
import { Player } from '../components/player';

export class PhysicsWorld {
  private world: CANNON.World;
  private bodies: CANNON.Body[] = [];

  constructor(world: CANNON.World) {
    this.world = world;

    // Improve friction for realistic grass
    this.world.defaultContactMaterial.friction = 0.6;
    this.world.defaultContactMaterial.restitution = 0.2; // Less bouncy

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
    // Ground plane with high friction (grass)
    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({
      mass: 0,
      shape: groundShape,
      friction: 0.8,
      restitution: 0.1
    });
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    this.world.addBody(groundBody);

    // Boundary walls (invisible)
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
}
