// Math Problem Generator - Updated to use new level progression system
// This file provides backward-compatible API while delegating to new generators

import type { MathProblem, AnswerBlock } from './types';
import {
  generateProblem,
  generateAnswerBlocks as generateBlocks,
  getLevelConfig,
  calculateFallSpeed,
  calculateTimeForLevel
} from './generators';

/**
 * Generate a math problem for the given level
 * Uses the new tier-based difficulty system
 */
export function generateMathProblem(level: number): MathProblem {
  return generateProblem(level);
}

/**
 * Generate answer blocks for a problem
 */
export function generateAnswerBlocks(
  problem: MathProblem,
  canvasWidth: number,
  blockWidth: number,
  startY: number
): AnswerBlock[] {
  return generateBlocks(problem, canvasWidth, blockWidth, startY);
}

// Re-export utilities for use in App.tsx
export {
  getLevelConfig,
  calculateFallSpeed,
  calculateTimeForLevel
};
