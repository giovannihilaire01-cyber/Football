# 3D Football Simulator

An advanced 3D football (soccer) simulation engine built with Three.js and Cannon-es, designed for GitHub Pages deployment.

## Features

- **11v11 Realistic Gameplay**: Full football teams with proper field dimensions
- **Physics-Based Simulation**: Realistic ball physics with rolling friction, bounce, and collision detection
- **AI Players**: Autonomous team AI that maintains formations and positions
- **Manager/Tactical View**: Overhead view allowing tactical command of your team
- **Real-Time Scoring**: Automatic goal detection and score tracking
- **Interactive Controls**: Use arrow keys to control selected players
- **Responsive Design**: Fullscreen gameplay with responsive UI

## Technology Stack

- **Three.js**: 3D graphics rendering
- **Cannon-es**: Physics engine for realistic simulations
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and dev server

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/giovannihilaire01-cyber/Football.git
cd Football
```

2. Install dependencies:
```bash
npm install
```

### Development

Start the development server:
```bash
npm run dev
```

The simulator will be available at `http://localhost:5173`

### Building for Production

Build the optimized version:
```bash
npm run build
```

The built files will be in the `dist/` directory.

### Deployment to GitHub Pages

The project is configured for automatic deployment via GitHub Actions:

1. Push changes to the `main` branch
2. GitHub Actions automatically builds and deploys to GitHub Pages
3. Access your deployed simulator at: `https://giovannihilaire01-cyber.github.io/Football/`

## Game Controls

- **Arrow Keys**: Move selected player
- **Mouse Click**: (Future) Select players and targets
- **Pause Button**: Toggle match pause/resume
- **Formation Button**: Change team formation

## Game Features

### Scoring System
- Automatic goal detection when ball crosses goal line
- Real-time score display

### Ball Physics
- Realistic rolling with friction
- Bounce dynamics
- Air resistance
- Collision response with players and boundaries

### AI System
- Position-aware movement
- Formation maintenance
- Ball possession awareness
- Directional play toward opponent goal

### Game Rules
- Ball possession detection
- Offside rule implementation
- Goal detection
- Match timing (90 minutes)

## Architecture

```
src/
├── components/       # Game objects (field, ball, players, teams)
├── systems/         # Core game systems (physics, state, rules)
├── ai/              # AI controllers and movement logic
├── ui/              # User interface and HUD
└── utils/           # Utility functions and helpers
```

## Future Enhancements

- Advanced AI with formations and tactics switching
- Multiplayer mode (local)
- Replay system
- More detailed player animations
- Stadium environment with spectators
- Custom team creation
- Training scenarios

## Performance

The simulator targets 60 FPS performance on modern browsers. For optimal experience:
- Use a modern browser (Chrome, Firefox, Edge, Safari)
- Desktop/laptop recommended for smooth gameplay
- Works on tablets, but controls may need adjustment

## License

MIT License - see LICENSE file for details

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

## Support

For issues, questions, or suggestions, please open an issue on the GitHub repository.
