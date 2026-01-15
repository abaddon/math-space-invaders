# Math Space Invaders 🚀

An educational game that helps kids learn math through engaging Space Invaders-style gameplay. Solve math problems by shooting the correct answer before time runs out!

![Game Preview](https://img.shields.io/badge/Platform-Web-blue) ![License](https://img.shields.io/badge/License-MIT-green) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)

## 🎮 Play Now!

**[▶️ Play Math Space Invaders](https://abaddon.github.io/math-space-invaders/)**

## 🎮 How to Play

- **← → or A/D**: Move your spaceship left and right
- **SPACE or Click/Tap**: Fire your laser
- **P or ESC**: Pause the game

Shoot the correct answer to the math problem shown at the bottom of the screen. Wrong answers or letting the answers reach the bottom will cost you a life!

## ✨ Features

- **Progressive Difficulty**: Math operations increase in complexity as you level up
  - Level 1-2: Addition
  - Level 3-4: Addition & Subtraction
  - Level 5+: All operations (+ - × ÷)
- **Speed Scaling**: Answer blocks descend faster with each level
- **3 Lives System**: Be careful! Wrong answers cost lives
- **Level Progression**: Get 10 correct answers to advance to the next level
- **Touch Support**: Works on mobile devices and tablets
- **Responsive Design**: Adapts to different screen sizes

## 🛠️ Tech Stack

- **React 19** with TypeScript
- **Vite** for fast development and building
- **HTML5 Canvas** for smooth 60fps rendering
- No external game libraries - pure React!

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/abaddon/math-space-invaders.git

# Navigate to project directory
cd math-space-invaders

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` folder, ready to deploy to any static hosting service.

## 📁 Project Structure

```
src/
├── App.tsx          # Main game component with game loop
├── App.css          # Styles and animations
├── types.ts         # TypeScript interfaces
├── constants.ts     # Game configuration
├── mathGenerator.ts # Math problem generation logic
└── main.tsx         # Entry point
```

## 🎯 Game Rules

| Action | Result |
|--------|--------|
| Hit correct answer | +1 Score |
| Hit wrong answer | -1 Life |
| Answer reaches bottom | -1 Life |
| 10 correct answers | Level Up! |
| 0 lives remaining | Game Over |

## 🔧 Configuration

Game settings can be adjusted in `src/constants.ts`:

```typescript
export const GAME_CONFIG = {
  BASE_ANSWER_SPEED: 1.2,      // Starting speed
  SPEED_INCREMENT: 0.3,         // Speed increase per level
  CORRECT_ANSWERS_PER_LEVEL: 10,
  INITIAL_LIVES: 3,
  // ... more settings
};
```

## 📱 Mobile Support

The game is fully responsive and supports:
- Touch controls (tap to fire, touch to move)
- Automatic canvas resizing
- Mobile-friendly UI

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests

## 📄 License

MIT License - feel free to use this project for learning or build upon it!

## 🙏 Acknowledgments

- Inspired by the classic Space Invaders arcade game
- Built with ❤️ for kids learning math
