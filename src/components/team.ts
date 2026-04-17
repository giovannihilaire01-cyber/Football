import * as THREE from 'three';
import { Player, createPlayer } from './player';

export interface Team {
  name: string;
  side: string;
  color: THREE.Color;
  players: Player[];
  formation: string;
  score: number;
  possession: boolean;
}

export function createTeam(side: string, xOffset: number, color: THREE.Color): Team {
  const players: Player[] = [];
  const team: Team = {
    name: `Team ${side}`,
    side: side,
    color: color,
    players: players,
    formation: '4-4-2',
    score: 0,
    possession: false,
  };

  // Formation 4-4-2: 1 Goalkeeper, 4 Defenders, 4 Midfielders, 2 Forwards
  const formations = {
    '4-4-2': [
      { number: 1, role: 'Goalkeeper', z: 0 },
      // Defenders
      { number: 2, role: 'RightBack', z: -20 },
      { number: 3, role: 'CenterBack', z: -10 },
      { number: 4, role: 'CenterBack', z: 10 },
      { number: 5, role: 'LeftBack', z: 20 },
      // Midfielders
      { number: 6, role: 'RightMid', z: -20 },
      { number: 7, role: 'LeftMid', z: -10 },
      { number: 8, role: 'CenterMid', z: 10 },
      { number: 9, role: 'LeftMid', z: 20 },
      // Forwards
      { number: 10, role: 'Forward', z: -15 },
      { number: 11, role: 'Forward', z: 15 },
    ],
  };

  const formationPositions = formations['4-4-2'];
  let xPositions = [0, -30, -20, -20, -30, 0, 0, 10, 10];

  for (let i = 0; i < 11; i++) {
    const formation = formationPositions[i];
    const direction = side === 'A' ? 1 : -1;
    const player = createPlayer(
      formation.number,
      side,
      xOffset + xPositions[Math.min(i, xPositions.length - 1)] * direction,
      formation.z,
      color
    );
    players.push(player);
  }

  return team;
}
