import { Player } from '../components/player';
import { Team } from '../components/team';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class AIController {
  private team: Team;
  private ballPosition: THREE.Vector3;
  private maxSpeed = 18;
  private maxForce = 250;
  private updateCounter = 0;
  private decisionInterval = 10; // Update decisions every 10 frames

  constructor(team: Team) {
    this.team = team;
    this.ballPosition = new THREE.Vector3();
  }

  update(ballPosition: THREE.Vector3, allTeams: Team[]): void {
    this.ballPosition = ballPosition.clone();
    this.updateCounter++;

    for (const player of this.team.players) {
      // Periodic decision making
      if (this.updateCounter % this.decisionInterval === 0) {
        this.updatePlayerGoal(player, allTeams);
      }

      this.updatePlayerMovement(player, allTeams);
    }
  }

  private updatePlayerGoal(player: Player, allTeams: Team[]): void {
    if (player.number === 1) {
      // Goalkeeper - stay in goal area
      player.targetPosition.set(player.team === 'A' ? -55 : 55, 0, 0);
      return;
    }

    if (player.hasControl) {
      // Dribble toward goal
      const directionTowardGoal = player.team === 'A' ? 1 : -1;
      player.targetPosition.set(50 * directionTowardGoal, 0, 0);
    } else {
      // Off-ball positioning
      const ballDist = this.ballPosition.distanceTo(player.position);
      const ballX = this.ballPosition.x;
      const ballZ = this.ballPosition.z;
      const directionTowardGoal = player.team === 'A' ? 1 : -1;

      if (ballDist < 25) {
        // Nearby: Get in position to support or defend
        if (this.isOpponentControllingBall(allTeams)) {
          // Defend: Close down the player with the ball
          player.targetPosition.copy(this.ballPosition);
          player.targetPosition.x -= 5 * directionTowardGoal; // Ahead of ball
        } else {
          // Support: Get in passing lane
          const supportOffset = new THREE.Vector3(
            ballX + (10 * directionTowardGoal),
            0,
            ballZ + (Math.random() - 0.5) * 20
          );
          player.targetPosition.copy(supportOffset);
        }
      } else {
        // Far away: Return to formation
        player.targetPosition.copy(this.getFormationPosition(player));
      }
    }
  }

  private updatePlayerMovement(player: Player, allTeams: Team[]): void {
    const direction = new THREE.Vector3(
      player.targetPosition.x - player.position.x,
      0,
      player.targetPosition.z - player.position.z
    );

    const distanceToTarget = direction.length();

    if (distanceToTarget > 0.5) {
      direction.normalize();

      // Apply force proportional to distance
      let forceMultiplier = 1;
      if (player.hasControl) {
        forceMultiplier = 1.5; // More aggressive when has ball
      } else if (distanceToTarget < 3) {
        forceMultiplier = 0.4; // Slow down when close to target
      }

      const force = direction.multiplyScalar(this.maxForce * forceMultiplier);
      player.body.applyForce(
        new CANNON.Vec3(force.x, 0, force.z),
        player.body.position
      );
    } else {
      // Apply friction when close to target
      player.body.velocity.x *= 0.92;
      player.body.velocity.z *= 0.92;
    }

    // Limit maximum speed
    this.limitSpeed(player);

    // Avoid other players (collision avoidance)
    this.avoidCollisions(player, allTeams);
  }

  private limitSpeed(player: Player): void {
    const currentSpeed = new THREE.Vector3(
      player.body.velocity.x,
      0,
      player.body.velocity.z
    ).length();

    if (currentSpeed > this.maxSpeed) {
      const speedRatio = this.maxSpeed / currentSpeed;
      player.body.velocity.x *= speedRatio;
      player.body.velocity.z *= speedRatio;
    }
  }

  private avoidCollisions(player: Player, allTeams: Team[]): void {
    const avoidanceRadius = 3;
    const avoidanceForce = 100;

    for (const team of allTeams) {
      for (const otherPlayer of team.players) {
        if (otherPlayer === player) continue;

        const toOther = new THREE.Vector3(
          otherPlayer.position.x - player.position.x,
          0,
          otherPlayer.position.z - player.position.z
        );

        const distance = toOther.length();

        if (distance < avoidanceRadius && distance > 0) {
          // Apply repulsive force
          toOther.normalize();
          toOther.multiplyScalar(-avoidanceForce);
          player.body.applyForce(
            new CANNON.Vec3(toOther.x, 0, toOther.z),
            player.body.position
          );
        }
      }
    }
  }

  private isOpponentControllingBall(allTeams: Team[]): boolean {
    for (const team of allTeams) {
      if (team.side === this.team.side) continue;
      for (const player of team.players) {
        if (player.hasControl) return true;
      }
    }
    return false;
  }

  private getFormationPosition(player: Player): THREE.Vector3 {
    const baseX = this.team.side === 'A' ? -25 : 25;
    const directionSign = this.team.side === 'A' ? 1 : -1;

    const positions: { [key: number]: [number, number] } = {
      1: [this.team.side === 'A' ? -55 : 55, 0], // Goalkeeper
      2: [baseX - 5 * directionSign, -18],
      3: [baseX - 5 * directionSign, -9],
      4: [baseX - 5 * directionSign, 9],
      5: [baseX - 5 * directionSign, 18],
      6: [baseX + 8 * directionSign, -18],
      7: [baseX + 8 * directionSign, -8],
      8: [baseX + 8 * directionSign, 8],
      9: [baseX + 8 * directionSign, 18],
      10: [baseX + 20 * directionSign, -12],
      11: [baseX + 20 * directionSign, 12],
    };

    const pos = positions[player.number] || [0, 0];
    return new THREE.Vector3(pos[0], 0, pos[1]);
  }
}
