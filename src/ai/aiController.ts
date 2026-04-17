import { Player } from '../components/player';
import { Team } from '../components/team';
import * as THREE from 'three';

export class AIController {
  private team: Team;
  private ballPosition: THREE.Vector3;

  constructor(team: Team) {
    this.team = team;
    this.ballPosition = new THREE.Vector3();
  }

  update(ballPosition: THREE.Vector3, allTeams: Team[]): void {
    this.ballPosition = ballPosition.clone();

    for (const player of this.team.players) {
      this.updatePlayerBehavior(player, allTeams);
    }
  }

  private updatePlayerBehavior(player: Player, allTeams: Team[]): void {
    const directionTowardGoal = player.team === 'A' ? 1 : -1;

    if (player.hasControl) {
      // Move toward opponent goal
      const targetX = 50 * directionTowardGoal;
      const direction = new THREE.Vector3(targetX - player.position.x, 0, 0 - player.position.z);
      direction.normalize();
      direction.multiplyScalar(15);

      player.body.velocity.x = direction.x;
      player.body.velocity.z = direction.z;
    } else {
      // Move to formation position
      const targetPos = this.getFormationPosition(player);
      const direction = new THREE.Vector3(
        targetPos.x - player.position.x,
        0,
        targetPos.z - player.position.z
      );

      if (direction.length() > 1) {
        direction.normalize();
        direction.multiplyScalar(8);
        player.body.velocity.x = direction.x;
        player.body.velocity.z = direction.z;
      } else {
        // Dampen movement when close to target
        player.body.velocity.x *= 0.7;
        player.body.velocity.z *= 0.7;
      }
    }
  }

  private getFormationPosition(player: Player): THREE.Vector3 {
    // Goalkeeper
    if (player.number === 1) {
      return new THREE.Vector3(player.team === 'A' ? -55 : 55, 0, 0);
    }

    // Defenders (numbers 2-5)
    if (player.number <= 5) {
      const xBase = player.team === 'A' ? -30 : 30;
      const zOffsets = [-15, -7, 7, 15];
      return new THREE.Vector3(xBase, 0, zOffsets[player.number - 2]);
    }

    // Midfielders (numbers 6-9)
    if (player.number <= 9) {
      const xBase = player.team === 'A' ? -10 : 10;
      const zOffsets = [-15, -7, 7, 15];
      return new THREE.Vector3(xBase, 0, zOffsets[player.number - 6]);
    }

    // Forwards (numbers 10-11)
    const xBase = player.team === 'A' ? 20 : -20;
    const zOffsets = [-10, 10];
    return new THREE.Vector3(xBase, 0, zOffsets[player.number - 10]);
  }
}
