# Math Space Invaders

An educational math game that helps kids learn arithmetic through engaging Space Invaders-style gameplay. Solve math problems by shooting the correct answer before time runs out!

![Platform](https://img.shields.io/badge/Platform-Web-blue) ![License](https://img.shields.io/badge/License-MIT-green) ![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue) ![React](https://img.shields.io/badge/React-19-61dafb)

[![E2E Tests](https://github.com/abaddon/math-space-invaders/actions/workflows/e2e-tests.yml/badge.svg)](https://github.com/abaddon/math-space-invaders/actions/workflows/e2e-tests.yml)

## Play Now!

**[Play Math Space Invaders](https://abaddon.github.io/math-space-invaders/)**

## How to Play

### Controls
- **Arrow Keys** or **A/D**: Move your spaceship left and right
- **SPACE** or **Click/Tap**: Fire your laser
- **P** or **ESC**: Pause the game

### Goal
Shoot the correct answer to the math problem shown at the bottom of the screen. Wrong answers or letting the answers reach the bottom will cost you a life!

## Features

### User Accounts & Leaderboard
- **User Registration/Login**: Create an account to track your progress
- **Global Leaderboard**: Compete with players worldwide
- **Personal Statistics**: Track your high scores, best level, games played, and total correct answers
- **Persistent Sessions**: Your progress is saved automatically

### Progressive Difficulty System

The game features a sophisticated **18-tier progression system** that covers:

#### Operation Types (8 categories)
1. **Addition** - Basic addition problems
2. **Subtraction** - Subtraction with positive results
3. **Multiplication** - Times tables and beyond
4. **Division** - Clean division problems
5. **Fractions** - Proper fractions (arithmetic, simplification, "X of Y")
6. **Improper Fractions** - Mixed numbers and conversions
7. **Percentages** - "What is X% of Y?" and "X is what % of Y?"
8. **Metric Conversions** - Length, weight, volume, and area conversions

#### Number Complexity (3 levels)
- **Single Digits** (1-9): Tiers 1-6, Levels 1-18
- **Double Digits** (10-99): Tiers 7-12, Levels 19-36
- **Triple Digits** (100-500): Tiers 13-18, Levels 37-54
- **Endless Mode**: Level 55+ with all operations

#### Time-Based Challenge
- **Starting Time**: 10 seconds per problem
- **Time Decay**: 10% reduction per level within each tier
- **Minimum Time**: 2 seconds
- **Time Reset**: Timer resets to 10s at the start of each new tier

### Tier Structure

| Tier | Levels | Operations | Digits |
|------|--------|------------|--------|
| 1 | 1-3 | Addition, Subtraction | Single |
| 2 | 4-6 | +Multiplication, Division | Single |
| 3 | 7-9 | Multiplication, Division, Fractions | Single |
| 4 | 10-12 | Division, Fractions, Improper Fractions | Single |
| 5 | 13-15 | Fractions, Improper, Percentages | Single |
| 6 | 16-18 | Improper, Percentages, Metric | Single |
| 7-12 | 19-36 | Same pattern as 1-6 | Double |
| 13-18 | 37-54 | Same pattern as 1-6 | Triple |
| 19+ | 55+ | All operations | Triple |

### Additional Features
- **10 Correct Answers** to advance each level
- **3 Lives System**: Wrong answers cost lives
- **Full Mobile Support**: Touch controls and responsive design
- **Full-Screen Mobile Experience**: Edge-to-edge gameplay on phones
- **60 FPS Rendering**: Smooth HTML5 Canvas animation

## Tech Stack

- **React 19** with TypeScript
- **Firebase Firestore** for user accounts and leaderboard
- **Vite** for fast development and building
- **HTML5 Canvas** for smooth 60fps rendering
- No external game libraries - pure React!

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase project (for authentication and leaderboard)

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

### Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Firestore Database
3. Create a `src/firebase.ts` file with your Firebase config:

```typescript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
```

### Google Analytics Setup (Optional)

To enable user behavior tracking with Google Analytics 4:

1. Create a Google Analytics 4 property at [Google Analytics](https://analytics.google.com)
2. Get your Measurement ID (format: `G-XXXXXXXXXX`)
3. Update `index.html` - replace `GA_MEASUREMENT_ID` with your actual ID:
   ```html
   <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
   ```
4. Create a `.env` file in the project root:
   ```
   VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

#### Tracked Events

| Category | Events |
|----------|--------|
| **Authentication** | `sign_up`, `login`, `logout`, `auth_error`, `auth_tab_switch`, `session_restored` |
| **Game Flow** | `game_start`, `game_pause`, `game_resume`, `game_over` |
| **Gameplay** | `answer_correct`, `answer_wrong`, `answer_missed`, `level_up`, `tier_up` |
| **Leaderboard** | `leaderboard_open`, `leaderboard_close`, `leaderboard_retry`, `high_score_achieved` |
| **Navigation** | `screen_view`, `page_view` |
| **Device** | `device_detected` |

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` folder, ready to deploy to any static hosting service.

### Running Tests

#### Unit Tests (Vitest)

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run tests with coverage report
npm run test:coverage

# Run tests with interactive UI
npm run test:ui
```

#### E2E Tests (Playwright + Cucumber BDD)

E2E tests require the Firebase emulator to be running.

```bash
# Terminal 1: Start Firebase emulator
npm run emulator:start

# Terminal 2: Run E2E tests
npm run test:e2e
```

Additional E2E test modes:

```bash
# Run with browser visible
npm run test:e2e:headed

# Run with Playwright debugger
npm run test:e2e:debug

# Run with interactive UI
npm run test:e2e:ui
```

## Project Structure

```
src/
├── App.tsx                    # Main game component with game loop
├── App.css                    # Styles and animations
├── types.ts                   # TypeScript interfaces
├── constants.ts               # Game configuration constants
├── mathGenerator.ts           # Main API (backward compatible)
├── analytics.ts               # Google Analytics 4 tracking service
├── firebase.ts                # Firebase configuration
├── authService.ts             # User authentication logic
├── leaderboardService.ts      # Leaderboard operations
├── config/
│   └── difficultyConfig.ts    # Tier definitions, time constants
├── generators/
│   ├── index.ts               # Main generator orchestrator
│   ├── arithmeticGenerator.ts # +, -, ×, ÷ problems
│   ├── fractionGenerator.ts   # Fraction problems
│   ├── percentageGenerator.ts # Percentage problems
│   └── metricGenerator.ts     # Metric conversion problems
├── utils/
│   ├── levelUtils.ts          # Level configuration utilities
│   └── fractionUtils.ts       # Fraction math utilities
├── components/
│   ├── AuthScreen.tsx         # Login/Register screen
│   └── Leaderboard.tsx        # Leaderboard modal
└── main.tsx                   # Entry point
```

## Game Rules

| Action | Result |
|--------|--------|
| Hit correct answer | +1 Score |
| Hit wrong answer | -1 Life |
| Answer reaches bottom | -1 Life |
| 10 correct answers | Level Up! |
| 0 lives remaining | Game Over |

## Configuration

### Difficulty Settings

All difficulty parameters can be adjusted in `src/config/difficultyConfig.ts`:

```typescript
export const DIFFICULTY_CONFIG = {
  BASE_TIME: 10,           // Starting time in seconds
  TIME_DECAY: 0.9,         // 10% reduction per level
  MIN_TIME: 2,             // Minimum time allowed
  ANSWERS_PER_LEVEL: 10,   // Correct answers to level up

  // Digit ranges
  DIGIT_RANGES: {
    single: { min: 1, max: 9 },
    double: { min: 10, max: 99 },
    triple: { min: 100, max: 500 }
  },

  // Operation weights (probability)
  OPERATION_WEIGHTS: {
    addition: 20,
    subtraction: 20,
    multiplication: 15,
    division: 15,
    fraction: 10,
    improperFraction: 8,
    percentage: 7,
    metricConversion: 5
  }
};
```

### Game Constants

Core game settings in `src/constants.ts`:

```typescript
export const GAME_CONFIG = {
  PROJECTILE_SPEED: 15,
  CORRECT_ANSWERS_PER_LEVEL: 10,
  INITIAL_LIVES: 3,
  STARSHIP_WIDTH: 60,
  ANSWER_BLOCK_WIDTH: 100,
  LEVEL_UP_DELAY: 2000,
};
```

## Mobile Support

The game is fully optimized for mobile devices:

- **Full-Screen Gameplay**: Uses 100% of screen width on mobile
- **Touch Controls**: Fire button (left) and direction buttons (right)
- **Fixed Viewport**: No scrolling or bouncing
- **Responsive UI**: Adapts to different screen sizes
- **iOS/Android Compatible**: Tested on Safari and Chrome mobile

## Database Schema

### Players Collection
```typescript
{
  id: string,
  username: string,
  usernameLower: string,  // For case-insensitive lookup
  passwordHash: string,   // SHA-256 hashed
  nickname: string,
  highScore: number,
  bestLevel: number,
  gamesPlayed: number,
  totalCorrectAnswers: number,
  createdAt: Timestamp,
  lastPlayed: Timestamp
}
```

### Leaderboard Collection
```typescript
{
  playerId: string,
  nickname: string,
  score: number,
  level: number,
  achievedAt: Timestamp
}
```

## Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests

## License

MIT License - feel free to use this project for learning or build upon it!

## Acknowledgments

- Inspired by the classic Space Invaders arcade game
- Built with love for kids learning math

---

**Made with React, TypeScript, and Firebase**
