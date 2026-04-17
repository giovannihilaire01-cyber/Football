import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Player } from '../components/player';
import { Team } from '../components/team';

export class GameState {
  private teams: Team[] = [];
  private ballPosition: THREE.Vector3 = new THREE.Vector3();
  private ballBody: CANNON.Body | null = null;
  private matchTime: number = 0;
  private matchDuration: number = 90 * 60; // 90 minutes in seconds
  private selectedPlayer: Player | null = null;
  private gameStatus: 'playing' | 'paused' | 'halftime' | 'finished' = 'playing';
  private halftimeTriggered: boolean = false;
  private finishTriggered: boolean = false;
  private lastGoalTime: number = 0;

  addTeam(team: Team): void {
    this.teams.push(team);
  }

  setBall(position: THREE.Vector3, body: CANNON.Body): void {
    this.ballPosition = position.clone();
    this.ballBody = body;
  }

  updateTime(deltaTime: number): void {
    if (this.gameStatus === 'playing') {
      this.matchTime += deltaTime;

      // Check for halftime at 45 minutes (2700 seconds)
      if (this.matchTime >= 2700 && !this.halftimeTriggered) {
        this.gameStatus = 'halftime';
        this.halftimeTriggered = true;
      }

      // Check for match finish at 90 minutes (5400 seconds)
      if (this.matchTime >= 5400 && !this.finishTriggered) {
        this.gameStatus = 'finished';
        this.finishTriggered = true;
      }
    }
  }

  resumeFromHalftime(): void {
    if (this.gameStatus === 'halftime') {
      this.gameStatus = 'playing';
    }
  }

  recordGoal(): void {
    this.lastGoalTime = this.matchTime;
  }

  getLastGoalTime(): number {
    return this.lastGoalTime;
  }

  updatePositions(): void {
    if (this.ballBody) {
      this.ballPosition.copy(this.ballBody.position as any);
    }

    for (const team of this.teams) {
      for (const player of team.players) {
        player.position.copy(player.body.position as any);
        player.velocity.copy(player.body.velocity);
      }
    }
  }

  getTeams(): Team[] {
    return this.teams;
  }

  getBallPosition(): THREE.Vector3 {
    return this.ballPosition;
  }

  getBallBody(): CANNON.Body | null {
    return this.ballBody;
  }

  getMatchTime(): number {
    return this.matchTime;
  }

  getMatchDuration(): number {
    return this.matchDuration;
  }

  getGameStatus(): string {
    return this.gameStatus;
  }

  setGameStatus(status: 'playing' | 'paused' | 'halftime' | 'finished'): void {
    this.gameStatus = status;
  }

  getSelectedPlayer(): Player | null {
    return this.selectedPlayer;
  }

  setSelectedPlayer(player: Player | null): void {
    if (this.selectedPlayer) {
      this.selectedPlayer.selected = false;
    }
    this.selectedPlayer = player;
    if (player) {
      player.selected = true;
    }
  }

  getPlayerAt(screenPos: { x: number; y: number }, camera: THREE.Camera, renderer: THREE.Renderer): Player | null {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    mouse.x = (screenPos.x / renderer.domElement.clientWidth) * 2 - 1;
    mouse.y = -(screenPos.y / renderer.domElement.clientHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const allMeshes = this.teams.flatMap((team) => team.players.map((p) => p.mesh));
    const intersects = raycaster.intersectObjects(allMeshes);

    if (intersects.length > 0) {
      const mesh = intersects[0].object;
      for (const team of this.teams) {
        for (const player of team.players) {
          if (player.mesh === mesh) {
            return player;
          }
        }
      }
    }

    return null;
  }
}
