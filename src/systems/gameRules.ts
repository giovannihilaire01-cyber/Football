import { GameState } from './gameState';
import { Player } from '../components/player';
import * as CANNON from 'cannon-es';

export class GameRules {
  private gameState: GameState;
  private ballPossession: { team: string; player: Player | null } | null = null;
  private kickCooldown: number = 0; // seconds

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
    let closestDistance = 3; // Ball control range (increased from 2)

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

    // Find player with control
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
      // Player with ball - add slight drag to ball toward player feet
      const ballToPlayer = new CANNON.Vec3(
        controllingPlayer.position.x - ballPos.x,
        0,
        controllingPlayer.position.z - ballPos.z
      );

      if (ballToPlayer.length() < 2) {
        // Apply small force to keep ball with player
        ballToPlayer.normalize();
        ballToPlayer.scale(20, ballToPlayer);
        ballBody.applyForce(ballToPlayer, ballBody.position);
      }
    }
  }

  private updateGoals(): void {
    const ballPos = this.gameState.getBallPosition();

    // Check left goal (Team A scores)
    if (ballPos.x < -60 && Math.abs(ballPos.z) < 7.32 && ballPos.y < 2.44) {
      this.gameState.getTeams()[0].score++;
      this.resetBall();
    }

    // Check right goal (Team B scores)
    if (ballPos.x > 60 && Math.abs(ballPos.z) < 7.32 && ballPos.y < 2.44) {
      this.gameState.getTeams()[1].score++;
      this.resetBall();
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

  // Method to kick the ball
  kickBall(player: Player, direction: CANNON.Vec3, power: number): void {
    if (this.kickCooldown > 0 || !player.hasControl) return;

    const ballBody = this.gameState.getBallBody();
    if (!ballBody) return;

    const normalizedDir = direction.clone();
    normalizedDir.normalize();
    normalizedDir.scale(power * 50, normalizedDir);

    ballBody.applyForce(normalizedDir, ballBody.position);
    ballBody.applyImpulse(normalizedDir, ballBody.position);

    this.kickCooldown = 0.5;
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
