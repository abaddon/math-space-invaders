// Game Types

export type GameState = 'MENU' | 'PLAYING' | 'PAUSED' | 'LEVEL_UP' | 'GAME_OVER';
export type MathOperation = 'addition' | 'subtraction' | 'multiplication' | 'division';

export interface MathProblem {
  operand1: number;
  operand2: number;
  operation: MathOperation;
  correctAnswer: number;
  displayString: string;
}

export interface AnswerBlock {
  id: string;
  value: number;
  isCorrect: boolean;
  x: number;
  y: number;
}

export interface Projectile {
  x: number;
  y: number;
  active: boolean;
}

export interface GameScore {
  score: number;
  level: number;
  lives: number;
  correctInLevel: number;
}

// Authentication Types
export interface AuthUser {
  playerId: string;
  username: string;
  nickname: string;
}

// Player and Leaderboard Types
export interface PlayerProfile {
  id: string;
  username: string;
  nickname: string;
  highScore: number;
  bestLevel: number;
  gamesPlayed: number;
  totalCorrectAnswers: number;
  createdAt: Date;
  lastPlayed: Date;
}

export interface LeaderboardEntry {
  playerId: string;
  nickname: string;
  score: number;
  level: number;
  achievedAt: Date;
}
