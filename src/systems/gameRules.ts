import { GameState } from './gameState';
import { Player } from '../components/player';
import * as CANNON from 'cannon-es';

export class GameRules {
  private gameState: GameState;
  private kickCooldown: number = 0;
  private lastScoringTeam: string | null = null;

  constructor(gameState: GameState) {
    this.gameState = gameState;
  }

  update(deltaTime: number): void {
    this.updatePossession();
    this.updateBallControl();
    this.updateGoals();
    this.kickCooldown = Math.max(0, this.kickCooldown - deltaTime);
  }

  private updatePossession(): void {
    const ballPos = this.gameState.getBallPosition();
    const teams = this.gameState.getTeams();

    let closestPlayer: Player | null = null;
    let closestDistance = 4; // Increased possession range

    for (const team of teams) {
      for (const player of team.players) {
        const distance = ballPos.distanceTo(player.position);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestPlayer = player;
        }
      }
    }

    // Update possession
    for (const team of teams) {
      for (const player of team.players) {
        player.hasControl = closestPlayer === player;
      }
    }
  }

  private updateBallControl(): void {
    const ballBody = this.gameState.getBallBody();
    const ballPos = this.gameState.getBallPosition();
    const teams = this.gameState.getTeams();

    let controllingPlayer: Player | null = null;
    for (const team of teams) {
      for (const player of team.players) {
        if (player.hasControl) {
          controllingPlayer = player;
          break;
        }
      }
      if (controllingPlayer) break;
    }

    if (controllingPlayer && ballBody) {
      // Stronger attachment when player has control
      const ballToPlayer = new CANNON.Vec3(
        controllingPlayer.position.x - ballPos.x,
        controllingPlayer.position.z < 0 ? 0.3 : 0, // Slight upward lift
        controllingPlayer.position.z - ballPos.z
      );

      const distance = ballToPlayer.length();

      if (distance > 0.1) {
        ballToPlayer.normalize();

        // Apply drag force proportional to distance
        if (distance < 1.5) {
          ballToPlayer.scale(35, ballToPlayer); // Strong drag when very close
        } else if (distance < 3) {
          ballToPlayer.scale(20, ballToPlayer); // Medium drag
        } else {
          ballToPlayer.scale(10, ballToPlayer); // Weak drag when far
        }

        ballBody.applyForce(ballToPlayer, ballBody.position);
      }

      // Keep ball on ground (slight downward force)
      if (ballPos.y > 0.5) {
        ballBody.applyForce(new CANNON.Vec3(0, -5, 0), ballBody.position);
      }
    }
  }

  private updateGoals(): void {
    const ballPos = this.gameState.getBallPosition();
    const teams = this.gameState.getTeams();

    // Check left goal (Team A scores on right side)
    if (ballPos.x > 60 && Math.abs(ballPos.z) < 7.32 && ballPos.y < 2.44) {
      if (this.lastScoringTeam !== 'A') {
        teams[0].score++;
        this.lastScoringTeam = 'A';
        this.resetBall();
      }
    }

    // Check right goal (Team B scores on left side)
    if (ballPos.x < -60 && Math.abs(ballPos.z) < 7.32 && ballPos.y < 2.44) {
      if (this.lastScoringTeam !== 'B') {
        teams[1].score++;
        this.lastScoringTeam = 'B';
        this.resetBall();
      }
    }

    // Reset when ball far from goal
    if (Math.abs(ballPos.x) < 30 || ballPos.y > 5) {
      this.lastScoringTeam = null;
    }
  }

  private resetBall(): void {
    const ballBody = this.gameState.getBallBody();
    if (ballBody) {
      ballBody.position.set(0, 1, 0);
      ballBody.velocity.set(0, 0, 0);
      ballBody.angularVelocity.set(0, 0, 0);
    }
  }

  // Kick ball with direction and power
  kickBall(player: Player, direction: CANNON.Vec3, power: number = 1): boolean {
    if (this.kickCooldown > 0 || !player.hasControl) return false;

    const ballBody = this.gameState.getBallBody();
    if (!ballBody) return false;

    // Normalize direction and apply power
    const normalizedDir = direction.clone();
    normalizedDir.normalize();
    normalizedDir.scale(power * 60, normalizedDir);

    // Apply force and impulse for immediate effect
    ballBody.applyForce(normalizedDir, ballBody.position);
    ballBody.applyImpulse(normalizedDir, ballBody.position);

    this.kickCooldown = 0.3;
    return true;
  }

  // Find best pass target
  findPassTarget(player: Player, allTeams: GameState['teams'] extends any[] ? never : any): Player | null {
    const teams = this.gameState.getTeams();
    const teammates = teams.find(t => t.side === player.team)?.players || [];

    let bestTarget: Player | null = null;
    let bestScore = -1;

    for (const teammate of teammates) {
      if (teammate === player) continue;

      const distance = player.position.distanceTo(teammate.position);
      if (distance > 35) continue; // Max pass distance

      // Score based on distance and position
      const inForwardPosition = player.team === 'A' ?
        teammate.position.x > player.position.x :
        teammate.position.x < player.position.x;

      let score = (1 - distance / 35) * 10;
      if (inForwardPosition) score *= 1.5;

      if (score > bestScore) {
        bestScore = score;
        bestTarget = teammate;
      }
    }

    return bestTarget;
  }

  // Check if should shoot
  shouldShoot(player: Player): boolean {
    const goalX = player.team === 'A' ? 60 : -60;
    const distanceToGoal = Math.abs(player.position.x - goalX);
    const angleToGoal = Math.abs(player.position.z);

    // Shoot if close and relatively centered
    return distanceToGoal < 30 && angleToGoal < 25;
  }

  isOffside(player: Player): boolean {
    const ballPos = this.gameState.getBallPosition();
    const teams = this.gameState.getTeams();
    const playerTeamIndex = teams.findIndex((t) => t.side === player.team);
    const opposingTeam = teams[playerTeamIndex === 0 ? 1 : 0];

    const playerDirection = player.team === 'A' ? 1 : -1;
    let opponentsBetween = 0;

    for (const opponent of opposingTeam.players) {
      const isAhead = (opponent.position.x - player.position.x) * playerDirection > 0;
      if (isAhead) {
        opponentsBetween++;
      }
    }

    return opponentsBetween >= 2;
  }
}
