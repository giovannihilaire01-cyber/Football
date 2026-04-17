import * as THREE from 'three';
import { Player, createPlayer } from './player';

export type FormationType = '4-4-2' | '3-5-2' | '5-3-2';

export interface Team {
  name: string;
  side: string;
  color: THREE.Color;
  players: Player[];
  formation: FormationType;
  score: number;
  possession: boolean;
  changeFormation: (newFormation: FormationType) => void;
}

export function createTeam(side: string, xOffset: number, color: THREE.Color): Team {
  const players: Player[] = [];

  // Define all available formations with their player positions and x-offsets
  const formationDefinitions = {
    '4-4-2': {
      positions: [
        { number: 1, role: 'Goalkeeper', z: 0 },
        { number: 2, role: 'RightBack', z: -20 },
        { number: 3, role: 'CenterBack', z: -10 },
        { number: 4, role: 'CenterBack', z: 10 },
        { number: 5, role: 'LeftBack', z: 20 },
        { number: 6, role: 'RightMid', z: -20 },
        { number: 7, role: 'LeftMid', z: -10 },
        { number: 8, role: 'CenterMid', z: 10 },
        { number: 9, role: 'LeftMid', z: 20 },
        { number: 10, role: 'Forward', z: -15 },
        { number: 11, role: 'Forward', z: 15 },
      ],
      xOffsets: [0, -30, -20, -20, -30, 0, 0, 10, 10, 20, 20],
    },
    '3-5-2': {
      positions: [
        { number: 1, role: 'Goalkeeper', z: 0 },
        { number: 2, role: 'CenterBack', z: -15 },
        { number: 3, role: 'CenterBack', z: 0 },
        { number: 4, role: 'CenterBack', z: 15 },
        { number: 5, role: 'RightWing', z: -25 },
        { number: 6, role: 'RightMid', z: -10 },
        { number: 7, role: 'CenterMid', z: 0 },
        { number: 8, role: 'LeftMid', z: 10 },
        { number: 9, role: 'LeftWing', z: 25 },
        { number: 10, role: 'Forward', z: -10 },
        { number: 11, role: 'Forward', z: 10 },
      ],
      xOffsets: [0, -25, -25, -25, 5, 0, 0, 0, 5, 15, 15],
    },
    '5-3-2': {
      positions: [
        { number: 1, role: 'Goalkeeper', z: 0 },
        { number: 2, role: 'RightBack', z: -20 },
        { number: 3, role: 'CenterBack', z: -10 },
        { number: 4, role: 'CenterBack', z: 0 },
        { number: 5, role: 'CenterBack', z: 10 },
        { number: 6, role: 'LeftBack', z: 20 },
        { number: 7, role: 'RightMid', z: -15 },
        { number: 8, role: 'CenterMid', z: 0 },
        { number: 9, role: 'LeftMid', z: 15 },
        { number: 10, role: 'Forward', z: -10 },
        { number: 11, role: 'Forward', z: 10 },
      ],
      xOffsets: [0, -35, -25, -25, -25, -35, 0, 5, 0, 20, 20],
    },
  };

  // Create initial players
  const direction = side === 'A' ? 1 : -1;
  const initialFormation = formationDefinitions['4-4-2'];

  for (let i = 0; i < 11; i++) {
    const formation = initialFormation.positions[i];
    const player = createPlayer(
      formation.number,
      side,
      xOffset + initialFormation.xOffsets[i] * direction,
      formation.z,
      color
    );
    players.push(player);
  }

  // Create team with formation change capability
  const team: Team = {
    name: `Team ${side}`,
    side: side,
    color: color,
    players: players,
    formation: '4-4-2',
    score: 0,
    possession: false,
    changeFormation: (newFormation: FormationType) => {
      // Update formation and reposition players
      team.formation = newFormation;
      const formationDef = formationDefinitions[newFormation];

      for (let i = 0; i < players.length; i++) {
        const positionDef = formationDef.positions[i];
        const newX = xOffset + formationDef.xOffsets[i] * direction;
        const newZ = positionDef.z;

        // Update target position for smooth transition
        players[i].targetPosition.set(newX, 0, newZ);
      }
    },
  };

  return team;
}
