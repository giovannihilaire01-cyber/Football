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
    timeEl.textContent = `${minutes}:${String(seconds).padStart(2, '0')}`;
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
}

export function setupControls(gameState: GameState, gameRules: GameRules): void {
  const pauseButton = document.getElementById('pause-button');
  if (pauseButton) {
    pauseButton.addEventListener('click', () => {
      const status = gameState.getGameStatus();
      const newStatus = status === 'playing' ? 'paused' : 'playing';
      gameState.setGameStatus(newStatus as any);
      pauseButton.textContent = newStatus === 'playing' ? 'Pause' : 'Resume';
    });
  }

  // Handle player selection via click
  let selectedForMovement = false;

  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;

    // Ignore clicks on UI elements
    if (target.closest('#controls-panel') || target.closest('#hud')) {
      return;
    }

    // For now, simple selection - in a full implementation would use raycasting
    // This is a placeholder for future implementation
  });

  // Handle player movement with arrow keys
  document.addEventListener('keydown', (event) => {
    const selectedPlayer = gameState.getSelectedPlayer();
    if (!selectedPlayer) return;

    const moveDistance = 2;
    const body = selectedPlayer.body;

    switch (event.key) {
      case 'ArrowUp':
        body.velocity.z -= moveDistance * 10;
        event.preventDefault();
        break;
      case 'ArrowDown':
        body.velocity.z += moveDistance * 10;
        event.preventDefault();
        break;
      case 'ArrowLeft':
        body.velocity.x -= moveDistance * 10;
        event.preventDefault();
        break;
      case 'ArrowRight':
        body.velocity.x += moveDistance * 10;
        event.preventDefault();
        break;
    }
  });
}
