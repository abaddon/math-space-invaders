// Game Types

export type GameState = 'MENU' | 'PLAYING' | 'PAUSED' | 'LEVEL_UP' | 'GAME_OVER';

// Legacy type for backward compatibility
export type MathOperation = 'addition' | 'subtraction' | 'multiplication' | 'division';

// Extended operation categories for the new progression system
export type OperationCategory =
  | 'addition'
  | 'subtraction'
  | 'multiplication'
  | 'division'
  | 'fraction'
  | 'improperFraction'
  | 'percentage'
  | 'metricConversion';

// Digit complexity types
export type DigitType = 'single' | 'double' | 'triple';

// Answer display format
export type AnswerFormat = 'number' | 'fraction' | 'mixed' | 'percentage' | 'unit';

// Tier definition for difficulty progression
export interface TierDefinition {
  tier: number;
  levelRange: [number, number];
  operations: OperationCategory[];
  digitType: DigitType;
  resetTime: boolean;
  description: string;
}

// Level configuration (computed for a specific level)
export interface LevelConfig {
  level: number;
  tier: number;
  timeAvailable: number;
  operations: OperationCategory[];
  digitType: DigitType;
  digitRange: { min: number; max: number };
}

// Extended MathProblem for all operation types
export interface MathProblem {
  operand1: number | string;       // Can be string for fractions like "3/4"
  operand2?: number | string;      // Optional for single-operand problems
  operation: OperationCategory;
  correctAnswer: number | string;  // Can be string for fractions, percentages, units
  displayString: string;           // The problem shown to the player
  answerFormat: AnswerFormat;      // How to display the answer
  // Numeric value for comparison (used for generating wrong answers)
  numericAnswer: number;
}

// Extended AnswerBlock to support different display formats
export interface AnswerBlock {
  id: string;
  value: number | string;          // Display value
  numericValue: number;            // Numeric value for comparison
  isCorrect: boolean;
  x: number;
  y: number;
  answerFormat: AnswerFormat;
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

// Fraction representation for internal calculations
export interface Fraction {
  numerator: number;
  denominator: number;
}

// Metric conversion type
export interface MetricConversion {
  fromUnit: string;
  toUnit: string;
  factor: number;
}
