# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains two related applications for an educational math game (Space Invaders-style):
- **MathSpaceInvadersWeb/** - Primary web application (Vite + React 19 + TypeScript)
- **MathSpaceInvaders/** - React Native/Expo mobile app

## Commands

### Web Project (MathSpaceInvadersWeb/)
```bash
npm run dev      # Start Vite dev server (http://localhost:5173)
npm run build    # TypeScript check + Vite production build
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

### Native Project (MathSpaceInvaders/)
```bash
npm start        # Start Expo development server
npm run ios      # Run on iOS simulator
npm run android  # Run on Android emulator
npm run web      # Run web version via Expo
```

## Architecture

### Game Engine
- **Web**: HTML5 Canvas rendering at 60 FPS with React state management
- **Native**: React Native with custom `useGameEngine` hook
- Game loop in `App.tsx` handles input, physics, collision detection, and rendering

### Game States
`MENU` → `PLAYING` ↔ `PAUSED` → `LEVEL_UP` → `PLAYING` ... → `GAME_OVER`

### Screen Layout
- **Top**: HUD (Score, Level, Lives)
- **Upper Area**: Three answer blocks moving downward
- **Middle**: Play area with projectile trajectory
- **Lower**: Player starship (horizontal movement only)
- **Bottom**: Current math problem display

### Answer Generation
1. Generate math problem and calculate correct answer
2. Generate 2 plausible wrong answers (close to correct, within ±10 range)
3. Shuffle positions randomly (correct answer not always in same position)
4. Ensure no duplicate answers

### 18-Tier Progression System
The difficulty system in `src/config/difficultyConfig.ts` defines:
- **Time decay**: Starts at 10s, reduces 10% per level, minimum 2s, resets each tier
- **8 operation types**: Addition → Subtraction → Multiplication → Division → Fractions → Improper Fractions → Percentages → Metric Conversions
- **3 digit complexities**: Single (1-9), Double (10-99), Triple (100-500)
- Each tier has 3 levels; 10 correct answers advances a level

### Problem Generation (`src/generators/`)
- `index.ts` - Orchestrator that selects operations based on current tier
- `arithmeticGenerator.ts` - Addition, subtraction, multiplication, division
- `fractionGenerator.ts` - Proper fractions (arithmetic, simplification, "X of Y")
- `percentageGenerator.ts` - Percentage calculations
- `metricGenerator.ts` - Unit conversions (length, weight, volume, area)

### Backend (Firebase)
- `firebase.ts` - Firebase initialization
- `authService.ts` - Custom username/password auth with SHA-256 hashing
- `leaderboardService.ts` - Score persistence and rankings

### Key Configuration Files
- `src/constants.ts` - Game physics (projectile speed, dimensions, lives)
- `src/config/difficultyConfig.ts` - Tier definitions, time constants, operation weights

## Deployment
Web version deploys to GitHub Pages with base path `/math-space-invaders/` (configured in `vite.config.ts`).
