import { Player } from '../components/player';
import { Team } from '../components/team';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { PhysicsWorld } from '../systems/physics';

export class AIController {
  private team: Team;
  private ballPosition: THREE.Vector3;
  private gameRules: any;
  private physicsWorld: PhysicsWorld | null = null;
  private maxSpeed = 9.5; // Reduced from 18 m/s (was 64.8 km/h, elite footballers peak at ~10-11 m/s)
  private maxForce = 100;
  private updateCounter = 0;
  private decisionInterval = 15;
  private playerDecisions: Map<Player, { target: THREE.Vector3; action: string }> = new Map();
  private tacticalMode: 'defensive' | 'balanced' | 'attacking' = 'balanced';
  private defensiveLineX: number = 0;

  constructor(team: Team, gameRules?: any) {
    this.team = team;
    this.ballPosition = new THREE.Vector3();
    this.gameRules = gameRules;
  }

  setPhysicsWorld(physicsWorld: PhysicsWorld): void {
    this.physicsWorld = physicsWorld;
  }

  update(ballPosition: THREE.Vector3, allTeams: Team[], gameRules?: any): void {
    this.ballPosition = ballPosition.clone();
    this.gameRules = gameRules || this.gameRules;
    this.updateCounter++;

    // Adjust tactics based on match situation
    this.updateTactics(allTeams);
    this.updateDefensiveLine(allTeams);

    for (const player of this.team.players) {
      // Periodic decision making
      if (this.updateCounter % this.decisionInterval === 0) {
        this.makeDecision(player, allTeams);
      }

      this.updatePlayerMovement(player, allTeams);
    }
  }

  private updateTactics(allTeams: Team[]): void {
    // Calculate possession indicator
    let teamHasPossession = false;
    for (const player of this.team.players) {
      if (player.hasControl) {
        teamHasPossession = true;
        break;
      }
    }

    const scoreIndex = allTeams.findIndex(t => t.side === this.team.side);
    const ourScore = allTeams[scoreIndex]?.score || 0;
    const oppScore = allTeams[1 - scoreIndex]?.score || 0;

    // Adjust tactics based on possession and score
    if (teamHasPossession && ourScore <= oppScore) {
      this.tacticalMode = 'attacking'; // Attack when losing or drawing
    } else if (!teamHasPossession && ourScore < oppScore) {
      this.tacticalMode = 'attacking'; // Pressing when behind
    } else if (!teamHasPossession && ourScore > oppScore) {
      this.tacticalMode = 'defensive'; // Defend lead
    } else {
      this.tacticalMode = 'balanced'; // Default balanced play
    }
  }

  private updateDefensiveLine(allTeams: Team[]): void {
    // Update defensive line position based on ball and tactics
    const ballX = this.ballPosition.x;
    const directionSign = this.team.side === 'A' ? 1 : -1;

    if (this.tacticalMode === 'defensive') {
      // Defensive position: deeper
      this.defensiveLineX = -35 * directionSign;
    } else if (this.tacticalMode === 'attacking') {
      // Attacking position: higher press
      this.defensiveLineX = -15 * directionSign;
    } else {
      // Balanced position
      this.defensiveLineX = -25 * directionSign;
    }
  }

  private makeDecision(player: Player, allTeams: Team[]): void {
    if (player.number === 1) {
      // Goalkeeper - stay in goal area
      const target = new THREE.Vector3(player.team === 'A' ? -55 : 55, 0, 0);
      this.playerDecisions.set(player, { target, action: 'position' });
      player.targetPosition.copy(target);
      return;
    }

    if (player.hasControl) {
      // HAS BALL - Decide: Pass or Shoot?
      const shouldShoot = this.gameRules?.shouldShoot?.(player) || false;

      if (shouldShoot && Math.random() < 0.4) {
        // TRY TO SHOOT
        const goalX = player.team === 'A' ? 60 : -60;
        const shotDirection = new CANNON.Vec3(
          goalX - player.position.x,
          0,
          0 - player.position.z
        );
        shotDirection.normalize();

        const shotPower = 0.6 + Math.random() * 0.4;
        if (this.gameRules?.kickBall) {
          this.gameRules.kickBall(player, shotDirection, shotPower);
        }

        this.playerDecisions.set(player, { target: new THREE.Vector3(goalX, 0, 0), action: 'shoot' });
      } else {
        // TRY TO PASS
        const passTarget = this.gameRules?.findPassTarget?.(player);

        if (passTarget && Math.random() < 0.5) {
          // Execute pass
          const passDirection = new CANNON.Vec3(
            passTarget.position.x - player.position.x,
            0,
            passTarget.position.z - player.position.z
          );
          passDirection.normalize();

          const passPower = 0.4 + Math.random() * 0.3;
          if (this.gameRules?.kickBall) {
            this.gameRules.kickBall(player, passDirection, passPower);
          }

          this.playerDecisions.set(player, {
            target: passTarget.position.clone(),
            action: 'pass'
          });
        } else {
          // Dribble toward goal
          const directionTowardGoal = player.team === 'A' ? 1 : -1;
          const target = new THREE.Vector3(40 * directionTowardGoal, 0, 0);
          this.playerDecisions.set(player, { target, action: 'dribble' });
          player.targetPosition.copy(target);
        }
      }
    } else {
      // NO BALL - Decide: Support or Defend?
      const ballDist = this.ballPosition.distanceTo(player.position);
      const isOpponentBall = this.isOpponentControllingBall(allTeams);

      if (player.number === 1) {
        // Goalkeeper - different logic
        const target = new THREE.Vector3(player.team === 'A' ? -55 : 55, 0, 0);
        this.playerDecisions.set(player, { target, action: 'position' });
        player.targetPosition.copy(target);
      } else if (ballDist < 30) {
        if (isOpponentBall) {
          // DEFEND: Close down attacker based on tactical mode
          const aggressiveness = this.tacticalMode === 'attacking' ? 8 : 3;
          const target = this.ballPosition.clone();
          target.x -= aggressiveness * (player.team === 'A' ? 1 : -1);
          this.playerDecisions.set(player, { target, action: 'defend' });
          player.targetPosition.copy(target);
        } else {
          // SUPPORT: Get ready for pass
          const supportOffset = new THREE.Vector3(
            this.ballPosition.x + (8 * (player.team === 'A' ? 1 : -1)),
            0,
            this.ballPosition.z + (Math.random() - 0.5) * 20
          );
          this.playerDecisions.set(player, { target: supportOffset, action: 'support' });
          player.targetPosition.copy(supportOffset);
        }
      } else {
        // FAR: Return to formation or defensive line
        let target: THREE.Vector3;
        if (isOpponentBall && player.number >= 2 && player.number <= 5) {
          // Defenders maintain defensive line
          target = this.getDefensiveLinePosition(player);
        } else {
          // Others return to formation
          target = this.getFormationPosition(player);
        }
        this.playerDecisions.set(player, { target, action: 'formation' });
        player.targetPosition.copy(target);
      }
    }
  }

  private updatePlayerMovement(player: Player, allTeams: Team[]): void {
    // Check if grounded before applying forces
    const grounded = this.physicsWorld ? this.physicsWorld.isGrounded(player) : true;

    const direction = new THREE.Vector3(
      player.targetPosition.x - player.position.x,
      0,
      player.targetPosition.z - player.position.z
    );

    const distanceToTarget = direction.length();

    if (distanceToTarget > 0.5 && grounded) {
      direction.normalize();

      // Force multiplier based on situation
      let forceMultiplier = 1;
      if (player.hasControl) {
        forceMultiplier = 1.3; // Dribbling
      } else if (this.playerDecisions.get(player)?.action === 'defend') {
        forceMultiplier = 1.5; // Urgent defense
      } else if (distanceToTarget < 3) {
        forceMultiplier = 0.5; // Slow down when close
      }

      const force = direction.multiplyScalar(this.maxForce * forceMultiplier);
      player.body.applyForce(
        new CANNON.Vec3(force.x, 0, force.z),
        player.body.position
      );
    } else {
      // Light damping near target
      player.body.velocity.x *= 0.93;
      player.body.velocity.z *= 0.93;
    }

    // Cap upward velocity to prevent jumping
    if (player.body.velocity.y > 2) {
      player.body.velocity.y = 2;
    }

    // Speed limit
    this.limitSpeed(player);

    // Collision avoidance
    if (grounded) {
      this.avoidCollisions(player, allTeams);
    }
  }

  private limitSpeed(player: Player): void {
    const velocity = new THREE.Vector3(
      player.body.velocity.x,
      0,
      player.body.velocity.z
    );
    const currentSpeed = velocity.length();

    // Realistic speed limiting using gradual damping (not hard clipping)
    // This prevents unrealistic instant velocity reversal
    if (currentSpeed > this.maxSpeed) {
      // Gradual slowdown factor based on excess speed
      // As player exceeds maxSpeed, they experience increasing drag
      const excessSpeed = currentSpeed - this.maxSpeed;
      const dragFactor = Math.max(0.85, 1 - excessSpeed / (this.maxSpeed * 2));

      player.body.velocity.x *= dragFactor;
      player.body.velocity.z *= dragFactor;
    }
  }

  private avoidCollisions(player: Player, allTeams: Team[]): void {
    const avoidanceRadius = 2.5;
    const avoidanceForce = 30; // Reduced from 120 for realistic movement

    for (const team of allTeams) {
      for (const other of team.players) {
        if (other === player) continue;

        const separation = new THREE.Vector3(
          player.position.x - other.position.x,
          0,
          player.position.z - other.position.z
        );

        const distance = separation.length();

        if (distance < avoidanceRadius && distance > 0.1) {
          separation.normalize();
          separation.multiplyScalar(avoidanceForce);
          player.body.applyForce(
            new CANNON.Vec3(separation.x, 0, separation.z),
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
    const sign = this.team.side === 'A' ? 1 : -1;

    const positions: { [key: number]: [number, number] } = {
      1: [this.team.side === 'A' ? -55 : 55, 0],
      2: [baseX - 5 * sign, -18],
      3: [baseX - 5 * sign, -9],
      4: [baseX - 5 * sign, 9],
      5: [baseX - 5 * sign, 18],
      6: [baseX + 8 * sign, -18],
      7: [baseX + 8 * sign, -8],
      8: [baseX + 8 * sign, 8],
      9: [baseX + 8 * sign, 18],
      10: [baseX + 20 * sign, -12],
      11: [baseX + 20 * sign, 12],
    };

    const pos = positions[player.number] || [0, 0];
    return new THREE.Vector3(pos[0], 0, pos[1]);
  }

  private getDefensiveLinePosition(player: Player): THREE.Vector3 {
    // Position defender on defensive line based on their assigned zone
    const sign = this.team.side === 'A' ? 1 : -1;
    const zoneSpacing = 9;

    const defenserPositions: { [key: number]: number } = {
      2: -zoneSpacing * 2,
      3: -zoneSpacing,
      4: zoneSpacing,
      5: zoneSpacing * 2,
    };

    const z = defenserPositions[player.number] || 0;
    return new THREE.Vector3(this.defensiveLineX, 0, z);
  }
}
