import { GameState } from './gameState';
import { Player } from '../components/player';

export class GameRules {
  private gameState: GameState;
  private ballPossession: { team: string; player: Player | null } | null = null;
  private lastKickTime: number = 0;

  constructor(gameState: GameState) {
    this.gameState = gameState;
  }

  update(deltaTime: number): void {
    this.updatePossession();
    this.updateGoals();
  }

  private updatePossession(): void {
    const ballPos = this.gameState.getBallPosition();
    const teams = this.gameState.getTeams();

    let closestPlayer: Player | null = null;
    let closestDistance = 2; // Ball control range

    for (const team of teams) {
      for (const player of team.players) {
        const distance = ballPos.distanceTo(player.position);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestPlayer = player;
        }
      }
    }

    if (closestPlayer) {
      closestPlayer.hasControl = true;
      for (const team of teams) {
        for (const player of team.players) {
          if (player !== closestPlayer) {
            player.hasControl = false;
          }
        }
      }
    } else {
      for (const team of teams) {
        for (const player of team.players) {
          player.hasControl = false;
        }
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

  isOffside(player: Player): boolean {
    const ballPos = this.gameState.getBallPosition();
    const teams = this.gameState.getTeams();
    const playerTeamIndex = teams.findIndex((t) => t.side === player.team);
    const opposingTeam = teams[playerTeamIndex === 0 ? 1 : 0];

    const playerDirection = player.team === 'A' ? 1 : -1;
    let opponentsBetweenBall = 0;

    for (const opponent of opposingTeam.players) {
      if ((opponent.position.x - ballPos.x) * playerDirection > 0 && (opponent.position.x - player.position.x) * playerDirection > 0) {
        opponentsBetweenBall++;
      }
    }

    return opponentsBetweenBall <= 1;
  }
}
