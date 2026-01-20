// Game Types

export type GameState = 'MENU' | 'COUNTDOWN' | 'PLAYING' | 'PAUSED' | 'LEVEL_UP' | 'GAME_OVER';

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

// Particle for visual effects
export interface Particle {
  x: number;
  y: number;
  vx: number;   // velocity x
  vy: number;   // velocity y
  life: number; // remaining life (0-1)
  color: string;
  size: number;
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

// Team Types (v1-teams milestone)

/** Team role in membership */
export type TeamRole = 'creator' | 'member';

/** Team visibility setting */
export type TeamVisibility = 'public' | 'private';

/** Team entity - stored in /teams/{teamId} */
export interface Team {
  id: string;
  name: string;
  slug: string;           // URL-safe identifier (e.g., "math-wizards")
  slugLower: string;      // Lowercase for case-insensitive lookup
  creatorId: string;      // Player ID of team creator
  memberCount: number;    // Denormalized count
  isPublic: boolean;      // true = anyone can join, false = password required
  passwordHash?: string;  // SHA-256 hash, only if isPublic = false
  createdAt: Date;
  updatedAt: Date;
}

/** Team membership - stored in /teamMemberships/{teamId}_{playerId} */
export interface TeamMembership {
  id: string;             // Composite: {teamId}_{playerId}
  teamId: string;
  playerId: string;
  role: TeamRole;
  joinedAt: Date;
  // Denormalized fields for efficient queries
  teamName: string;
  teamSlug: string;
  playerNickname: string;
}

/** Team leaderboard entry - stored in /teamLeaderboard/{teamId}_{playerId} */
export interface TeamLeaderboardEntry {
  id: string;             // Composite: {teamId}_{playerId}
  teamId: string;
  playerId: string;
  nickname: string;
  score: number;
  level: number;
  achievedAt: Date;
}
