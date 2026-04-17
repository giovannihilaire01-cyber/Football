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
    }
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
