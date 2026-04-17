import { GameState } from './gameState';
import { Player } from '../components/player';
import * as CANNON from 'cannon-es';

export class GameRules {
  private gameState: GameState;
  private kickCooldown: number = 0;
  private lastScoringTeam: string | null = null;
  private offsidePositions: Map<Player, number> = new Map(); // Track offside player positions
  private lastBallX: number = 0;
  private lastBallZ: number = 0;
  private gamePhase: 'play' | 'corner' | 'free-kick' | 'throw-in' = 'play';
  private setPieceTeam: string | null = null;
  private setPieceCooldown: number = 0;

  constructor(gameState: GameState) {
    this.gameState = gameState;
  }

  update(deltaTime: number): void {
    this.updatePossession();
    this.updateBallControl();
    this.enforceOffside();
    this.detectOutOfBounds();
    this.updateGoals();
    this.setPieceCooldown = Math.max(0, this.setPieceCooldown - deltaTime);
    this.kickCooldown = Math.max(0, this.kickCooldown - deltaTime);
  }

  private detectOutOfBounds(): void {
    const ballPos = this.gameState.getBallPosition();

    // Check if ball is out of bounds (and was previously in play)
    if (this.gamePhase === 'play') {
      const isOutX = ballPos.x > 60 || ballPos.x < -60;
      const isOutZ = ballPos.z > 40 || ballPos.z < -40;

      if (isOutX || isOutZ) {
        // Determine type of out-of-bounds
        if (isOutZ && !isOutX && this.setPieceCooldown <= 0) {
          // Out on sideline = throw-in
          this.initiateThrowIn(ballPos);
        } else if (isOutX && Math.abs(ballPos.z) < 7.32 && this.setPieceCooldown <= 0) {
          // Out over goal line = corner or goal kick
          this.initiateSetPiece(ballPos);
        } else if (isOutX && Math.abs(ballPos.z) >= 7.32 && this.setPieceCooldown <= 0) {
          // Out on sideline
          this.initiateThrowIn(ballPos);
        }
      }
    }

    this.lastBallX = ballPos.x;
    this.lastBallZ = ballPos.z;
  }

  private initiateThrowIn(ballPos: CANNON.Vec3): void {
    // Determine which team takes throw-in (attacking team gets it)
    const controllingTeam = this.gameState.getTeams().find(t =>
      t.players.some(p => p.hasControl)
    );

    if (controllingTeam && this.setPieceCooldown <= 0) {
      this.gamePhase = 'throw-in';
      this.setPieceTeam = controllingTeam.side;
      this.setPieceCooldown = 3; // 3 second cooldown

      // Place ball on sideline at throw location
      const ballBody = this.gameState.getBallBody();
      if (ballBody) {
        const sidelineZ = ballPos.z > 0 ? 40 : -40;
        ballBody.position.set(ballPos.x, 1, sidelineZ);
        ballBody.velocity.set(0, 0, 0);
        ballBody.angularVelocity.set(0, 0, 0);
      }
    }
  }

  private initiateSetPiece(ballPos: CANNON.Vec3): void {
    // Determine which team takes set piece
    const controllingTeam = this.gameState.getTeams().find(t =>
      t.players.some(p => p.hasControl)
    );

    const defendingTeam = this.gameState.getTeams().find(t => t.side !== controllingTeam?.side);

    if (defendingTeam && this.setPieceCooldown <= 0) {
      // Defending team was last to touch, so attacking team gets corner
      this.gamePhase = 'corner';
      this.setPieceTeam = controllingTeam?.side || 'A';
      this.setPieceCooldown = 4; // 4 second cooldown

      // Place ball at corner flag
      const ballBody = this.gameState.getBallBody();
      if (ballBody) {
        const cornerZ = ballPos.z > 0 ? 38 : -38;
        const cornerX = ballPos.x > 0 ? 58 : -58;
        ballBody.position.set(cornerX, 1, cornerZ);
        ballBody.velocity.set(0, 0, 0);
        ballBody.angularVelocity.set(0, 0, 0);
      }
    }
  }

  private enforceOffside(): void {
    const teams = this.gameState.getTeams();
    const ballPos = this.gameState.getBallPosition();

    for (const team of teams) {
      for (const player of team.players) {
        if (this.isOffside(player)) {
          this.offsidePositions.set(player, player.position.x);
        } else {
          this.offsidePositions.delete(player);
        }
      }
    }
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
        // Check if any Team A player was in offside position
        const teamAOffside = Array.from(this.offsidePositions.entries()).some(
          ([player, _]) => player.team === 'A'
        );

        if (!teamAOffside) {
          teams[0].score++;
          this.lastScoringTeam = 'A';
          this.resetBall();
        } else {
          this.lastScoringTeam = 'A-OFFSIDE';
          this.resetBall();
        }
      }
    }

    // Check right goal (Team B scores on left side)
    if (ballPos.x < -60 && Math.abs(ballPos.z) < 7.32 && ballPos.y < 2.44) {
      if (this.lastScoringTeam !== 'B') {
        // Check if any Team B player was in offside position
        const teamBOffside = Array.from(this.offsidePositions.entries()).some(
          ([player, _]) => player.team === 'B'
        );

        if (!teamBOffside) {
          teams[1].score++;
          this.lastScoringTeam = 'B';
          this.resetBall();
        } else {
          this.lastScoringTeam = 'B-OFFSIDE';
          this.resetBall();
        }
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

  getGamePhase(): string {
    return this.gamePhase;
  }

  getSetPieceTeam(): string | null {
    return this.setPieceTeam;
  }

  resetGamePhase(): void {
    this.gamePhase = 'play';
    this.setPieceTeam = null;
  }
}
