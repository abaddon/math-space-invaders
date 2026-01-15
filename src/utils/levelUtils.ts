// Level Utilities - Calculate configuration for any level
// Handles tier detection, time calculation, and operation selection

import { DIFFICULTY_CONFIG, getTierForLevel, getMaxDefinedTier } from '../config/difficultyConfig';
import type { LevelConfig, OperationCategory, DigitType } from '../types';

/**
 * Calculate the time available for a given level
 * Time resets at the start of each tier, then decreases by 10% per level
 * After tier 8, time continues decreasing until hitting minimum
 */
export function calculateTimeForLevel(level: number): number {
  const { BASE_TIME, TIME_DECAY, MIN_TIME, LEVELS_PER_TIER } = DIFFICULTY_CONFIG;
  const maxDefinedTier = getMaxDefinedTier();
  const lastTierEndLevel = maxDefinedTier * LEVELS_PER_TIER;

  // Check if we're within defined tiers
  if (level <= lastTierEndLevel) {
    // Calculate position within current tier (0-4)
    const levelWithinTier = (level - 1) % LEVELS_PER_TIER;
    const multiplier = Math.pow(TIME_DECAY, levelWithinTier);
    return Math.max(MIN_TIME, BASE_TIME * multiplier);
  }

  // Beyond defined tiers: continue decreasing from where last tier ended
  // Last tier ends at level 40, so level 41 continues the pattern
  const levelsAfterLastTier = level - lastTierEndLevel;

  // Start from the end of tier 8 (which is at 5 * 0.9^4 = 3.28s)
  const endOfLastTierTime = BASE_TIME * Math.pow(TIME_DECAY, LEVELS_PER_TIER - 1);

  // Continue decreasing
  const continuedDecay = Math.pow(TIME_DECAY, levelsAfterLastTier);
  const calculatedTime = endOfLastTierTime * continuedDecay;

  return Math.max(MIN_TIME, calculatedTime);
}

/**
 * Get the tier number for a level
 */
export function getTierNumber(level: number): number {
  const tierDef = getTierForLevel(level);
  if (!tierDef) return 1;

  // Check if level is beyond defined tiers
  const maxDefinedTier = getMaxDefinedTier();
  const lastTierEndLevel = maxDefinedTier * DIFFICULTY_CONFIG.LEVELS_PER_TIER;

  if (level > lastTierEndLevel) {
    // Return virtual tier number for display purposes
    return Math.ceil(level / DIFFICULTY_CONFIG.LEVELS_PER_TIER);
  }

  return tierDef.tier;
}

/**
 * Get available operations for a level
 */
export function getOperationsForLevel(level: number): OperationCategory[] {
  const tier = getTierForLevel(level);
  if (!tier) return ['addition', 'subtraction'];
  return tier.operations;
}

/**
 * Get digit type for a level
 */
export function getDigitTypeForLevel(level: number): DigitType {
  const tier = getTierForLevel(level);
  if (!tier) return 'single';
  return tier.digitType;
}

/**
 * Get digit range for a level
 */
export function getDigitRangeForLevel(level: number): { min: number; max: number } {
  const digitType = getDigitTypeForLevel(level);
  return DIFFICULTY_CONFIG.DIGIT_RANGES[digitType];
}

/**
 * Get complete configuration for a level
 */
export function getLevelConfig(level: number): LevelConfig {
  return {
    level,
    tier: getTierNumber(level),
    timeAvailable: calculateTimeForLevel(level),
    operations: getOperationsForLevel(level),
    digitType: getDigitTypeForLevel(level),
    digitRange: getDigitRangeForLevel(level)
  };
}

/**
 * Calculate fall speed in pixels per frame for time-based difficulty
 * @param canvasHeight - Total canvas height in pixels
 * @param timeAvailable - Time in seconds for block to reach bottom
 * @param fps - Frames per second (default 60)
 * @returns Speed in pixels per frame
 */
export function calculateFallSpeed(
  canvasHeight: number,
  timeAvailable: number,
  fps: number = 60
): number {
  // Distance to travel: canvas height minus HUD, problem area, and safe zone
  // HUD: ~50px, Problem area: ~60px, Starship zone: ~100px
  const fallDistance = canvasHeight - 50 - 60 - 100;

  // Calculate frames available
  const framesAvailable = timeAvailable * fps;

  // Speed = distance / frames
  return fallDistance / framesAvailable;
}

/**
 * Select a random operation from available operations using weighted probability
 */
export function selectRandomOperation(
  availableOperations: OperationCategory[]
): OperationCategory {
  const weights = DIFFICULTY_CONFIG.OPERATION_WEIGHTS;

  // Calculate total weight for available operations
  let totalWeight = 0;
  for (const op of availableOperations) {
    totalWeight += weights[op] || 10;
  }

  // Select random operation based on weights
  let random = Math.random() * totalWeight;
  for (const op of availableOperations) {
    random -= weights[op] || 10;
    if (random <= 0) {
      return op;
    }
  }

  // Fallback to first operation
  return availableOperations[0];
}

/**
 * Get a description of what's new in the current tier
 */
export function getTierDescription(level: number): string {
  const tier = getTierForLevel(level);
  return tier?.description || 'Advanced mathematics';
}

/**
 * Check if this level starts a new tier
 */
export function isNewTier(level: number): boolean {
  if (level === 1) return true;

  const currentTier = getTierNumber(level);
  const previousTier = getTierNumber(level - 1);

  return currentTier !== previousTier;
}

/**
 * Get the next tier's level (for "coming up" hints)
 */
export function getNextTierStartLevel(level: number): number {
  const currentTier = getTierNumber(level);
  return currentTier * DIFFICULTY_CONFIG.LEVELS_PER_TIER + 1;
}
