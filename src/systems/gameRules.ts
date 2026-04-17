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
        // Check if player is in offside position
        if (this.isOffside(player)) {
          this.offsidePositions.set(player, player.position.x);
        } else {
          // Clear offside status when player is no longer offside
          this.offsidePositions.delete(player);
        }
      }
    }

    // Periodic cleanup: Clear offside map if ball is far from goals
    // (prevents stale offside states from previous plays)
    if (Math.abs(ballPos.x) < 30) {
      this.offsidePositions.clear();
    }
  }

  private updatePossession(): void {
    const ballPos = this.gameState.getBallPosition();
    const teams = this.gameState.getTeams();

    let closestPlayer: Player | null = null;
    let closestDistance = 1.2; // Reduced from 4 (realistic touch distance ~1.2m max)

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
    // REMOVED: Artificial ball drag forces violated physics laws
    // Previously applied 10-35 N synthetic drag that overrode realistic physics
    //
    // Physics-accurate solution:
    // - Ball naturally follows from physics simulation
    // - Contact friction from player-ball collision provides realistic control
    // - Gravity naturally keeps ball on ground (no -5N artificial force needed)
    // - Ball momentum is conserved (no artificial drag removing energy)
    //
    // With reduced ball damping (0.02), physics simulation is now realistic:
    // - Ball rolls naturally
    // - Player can affect ball through proper physics contact
    // - No violations of conservation laws
  }

  private updateGoals(): void {
    const ballPos = this.gameState.getBallPosition();
    const teams = this.gameState.getTeams();

    // TEAM A GOAL: Ball in right goal area (x > 60)
    // Team A starts at x=-50 (left side), attacks toward x=60 (right goal)
    if (ballPos.x > 60 && Math.abs(ballPos.z) < 7.32 && ballPos.y < 2.44) {
      if (this.lastScoringTeam !== 'A') {
        // Check if any Team A player was in offside position when goal scored
        const teamAOffside = Array.from(this.offsidePositions.entries()).some(
          ([player, _]) => player.team === 'A'
        );

        if (!teamAOffside) {
          teams[0].score++;
          this.gameState.recordGoal();
          this.lastScoringTeam = 'A';
          this.resetBall();
        } else {
          // Goal disallowed due to offside
          this.lastScoringTeam = 'A-OFFSIDE';
          this.resetBall();
        }
      }
    }

    // TEAM B GOAL: Ball in left goal area (x < -60)
    // Team B starts at x=50 (right side), attacks toward x=-60 (left goal)
    if (ballPos.x < -60 && Math.abs(ballPos.z) < 7.32 && ballPos.y < 2.44) {
      if (this.lastScoringTeam !== 'B') {
        // Check if any Team B player was in offside position when goal scored
        const teamBOffside = Array.from(this.offsidePositions.entries()).some(
          ([player, _]) => player.team === 'B'
        );

        if (!teamBOffside) {
          teams[1].score++;
          this.gameState.recordGoal();
          this.lastScoringTeam = 'B';
          this.resetBall();
        } else {
          // Goal disallowed due to offside
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
      // Ball radius is 0.22, so position at 0.22 sits flush on ground (y=0)
      ballBody.position.set(0, 0.22, 0); // Ball rests exactly on ground
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
    normalizedDir.scale(power * 30, normalizedDir); // Scale factor for realistic impulse (changed from 60)

    // Apply ONLY impulse for instantaneous kick (removed applyForce which violated momentum conservation)
    // Impulse: J = m * Δv, so velocity change is impulse / mass
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
    // Offside only applies to attacking players (near opponent goal)
    const ballPos = this.gameState.getBallPosition();
    const teams = this.gameState.getTeams();
    const playerTeamIndex = teams.findIndex((t) => t.side === player.team);
    const opposingTeam = teams[playerTeamIndex === 0 ? 1 : 0];

    // Determine player's attacking direction
    const playerDirection = player.team === 'A' ? 1 : -1;

    // Only check offside if player is ahead of ball in attacking direction
    const ballToPlayer = (player.position.x - ballPos.x) * playerDirection;
    if (ballToPlayer < 0) {
      return false; // Player is behind ball, can't be offside
    }

    // Count opponents ahead of player in attacking direction
    let opponentsBetween = 0;
    for (const opponent of opposingTeam.players) {
      const opponentAhead = (opponent.position.x - player.position.x) * playerDirection > 0;
      if (opponentAhead) {
        opponentsBetween++;
      }
    }

    // Offside if fewer than 2 opponents ahead of player
    return opponentsBetween < 2;
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

  resetForHalftime(): void {
    // Reset all game state for second half start
    this.lastScoringTeam = null;
    this.offsidePositions.clear();
    this.lastBallX = 0;
    this.lastBallZ = 0;
    this.gamePhase = 'play';
    this.setPieceTeam = null;
    this.setPieceCooldown = 0;
    this.kickCooldown = 0;
  }
}
