import { GameState } from '../systems/gameState';
import { GameRules } from '../systems/gameRules';

export function updateHUD(gameState: GameState): void {
  const teams = gameState.getTeams();

  // Update score
  const teamAScoreEl = document.getElementById('team-a-score');
  const teamBScoreEl = document.getElementById('team-b-score');

  if (teamAScoreEl) teamAScoreEl.textContent = String(teams[0].score);
  if (teamBScoreEl) teamBScoreEl.textContent = String(teams[1].score);

  // Update time
  const timeEl = document.getElementById('match-time');
  if (timeEl) {
    const minutes = Math.floor(gameState.getMatchTime() / 60);
    const seconds = Math.floor(gameState.getMatchTime() % 60);
    const timeDisplay = minutes >= 45 ? `45+${Math.floor((gameState.getMatchTime() - 2700) / 60)}` : `${minutes}`;
    timeEl.textContent = `${timeDisplay}:${String(seconds).padStart(2, '0')}`;
  }

  // Update player info
  const selectedPlayer = gameState.getSelectedPlayer();
  const playerInfoEl = document.getElementById('player-info');
  if (playerInfoEl) {
    if (selectedPlayer) {
      playerInfoEl.textContent = `${selectedPlayer.team} #${selectedPlayer.number}`;
    } else {
      playerInfoEl.textContent = '';
    }
  }

  // Update game status indicator
  const statusEl = document.getElementById('game-status');
  if (statusEl) {
    const status = gameState.getGameStatus();
    statusEl.textContent = status === 'playing' ? '● LIVE' : '⏸ PAUSED';
    statusEl.style.color = status === 'playing' ? '#00ff00' : '#ffaa00';
  }
}

export function setupControls(gameState: GameState, gameRules: GameRules): void {
  const pauseButton = document.getElementById('pause-button');
  const formationButton = document.getElementById('formation-button');

  if (pauseButton) {
    pauseButton.addEventListener('click', () => {
      const status = gameState.getGameStatus();
      const newStatus = status === 'playing' ? 'paused' : 'playing';
      gameState.setGameStatus(newStatus as any);
      pauseButton.textContent = newStatus === 'playing' ? 'Pause' : 'Resume';
    });
  }

  if (formationButton) {
    formationButton.addEventListener('click', () => {
      const teams = gameState.getTeams();
      const teamA = teams[0];
      const formations = ['4-4-2', '3-5-2', '5-3-2'];
      const currentIndex = formations.indexOf(teamA.formation);
      const nextIndex = (currentIndex + 1) % formations.length;
      teamA.formation = formations[nextIndex];
      formationButton.textContent = `Formation: ${teamA.formation}`;
    });
  }

  // Handle player selection via canvas click
  const canvasContainer = document.getElementById('canvas-container');
  if (canvasContainer) {
    canvasContainer.addEventListener('click', (event) => {
      const rect = canvasContainer.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      // Note: This would need the camera to work with raycasting
      // For now, cycle through team A players
      const teams = gameState.getTeams();
      const teamA = teams[0];
      const currentSelected = gameState.getSelectedPlayer();

      if (!currentSelected) {
        gameState.setSelectedPlayer(teamA.players[0]);
      } else {
        const currentIndex = teamA.players.indexOf(currentSelected);
        const nextIndex = (currentIndex + 1) % teamA.players.length;
        gameState.setSelectedPlayer(teamA.players[nextIndex]);
      }
    });
  }

  // Handle player movement and actions with arrow keys and space
  let lastKickTime = 0;
  document.addEventListener('keydown', (event) => {
    const selectedPlayer = gameState.getSelectedPlayer();
    if (!selectedPlayer) return;

    const CANNON = require('cannon-es');
    const forceAmount = 300;
    const body = selectedPlayer.body;
    let actionTaken = false;

    switch (event.key) {
      case 'ArrowUp':
        body.applyForce(
          new CANNON.Vec3(0, 0, -forceAmount),
          body.position
        );
        actionTaken = true;
        break;
      case 'ArrowDown':
        body.applyForce(
          new CANNON.Vec3(0, 0, forceAmount),
          body.position
        );
        actionTaken = true;
        break;
      case 'ArrowLeft':
        body.applyForce(
          new CANNON.Vec3(-forceAmount, 0, 0),
          body.position
        );
        actionTaken = true;
        break;
      case 'ArrowRight':
        body.applyForce(
          new CANNON.Vec3(forceAmount, 0, 0),
          body.position
        );
        actionTaken = true;
        break;
      case ' ': // Space key for kick
        if (selectedPlayer.hasControl && Date.now() - lastKickTime > 300) {
          // Kick toward goal
          const goalX = selectedPlayer.team === 'A' ? 60 : -60;
          const kickDirection = new CANNON.Vec3(
            goalX - selectedPlayer.position.x,
            0,
            0 - selectedPlayer.position.z
          );
          kickDirection.normalize();

          // Call game rules to execute kick
          if ((window as any).gameRules?.kickBall) {
            (window as any).gameRules.kickBall(selectedPlayer, kickDirection, 0.8);
          }

          lastKickTime = Date.now();
          actionTaken = true;
        }
        break;
    }

    if (actionTaken) {
      event.preventDefault();
    }
  });
}
