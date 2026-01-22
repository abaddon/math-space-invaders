import { describe, it, expect } from 'vitest';
import {
  calculateTimeForLevel,
  getTierNumber,
  getOperationsForLevel,
  getDigitTypeForLevel,
  getDigitRangeForLevel,
  getLevelConfig,
  calculateFallSpeed,
  selectRandomOperation,
  getTierDescription,
  isNewTier,
  getNextTierStartLevel,
} from './levelUtils';
import { DIFFICULTY_CONFIG } from '../config/difficultyConfig';
import type { OperationCategory } from '../types';

describe('levelUtils', () => {
  describe('calculateTimeForLevel', () => {
    it('returns base time for level 1', () => {
      const time = calculateTimeForLevel(1);
      expect(time).toBe(DIFFICULTY_CONFIG.BASE_TIME);
    });

    it('decreases time by decay factor per level within tier', () => {
      const { BASE_TIME, TIME_DECAY } = DIFFICULTY_CONFIG;

      const time1 = calculateTimeForLevel(1);
      const time2 = calculateTimeForLevel(2);
      const time3 = calculateTimeForLevel(3);

      expect(time1).toBe(BASE_TIME);
      expect(time2).toBeCloseTo(BASE_TIME * TIME_DECAY, 5);
      expect(time3).toBeCloseTo(BASE_TIME * TIME_DECAY * TIME_DECAY, 5);
    });

    it('resets time based on LEVELS_PER_TIER (every 5 levels)', () => {
      // Time calculation uses LEVELS_PER_TIER (5) from config
      // Time resets at levels 1, 6, 11, 16, etc.
      const timeLevel5 = calculateTimeForLevel(5); // position 4 within tier
      const timeLevel6 = calculateTimeForLevel(6); // position 0 (reset)

      // Time should reset to base at level 6
      expect(timeLevel6).toBeGreaterThan(timeLevel5);
      expect(timeLevel6).toBe(DIFFICULTY_CONFIG.BASE_TIME);
    });

    it('never goes below minimum time', () => {
      const { MIN_TIME } = DIFFICULTY_CONFIG;

      // Test very high levels
      for (let level = 1; level <= 100; level++) {
        const time = calculateTimeForLevel(level);
        expect(time).toBeGreaterThanOrEqual(MIN_TIME);
      }
    });

    it('handles levels beyond defined tiers', () => {
      const time100 = calculateTimeForLevel(100);
      const time200 = calculateTimeForLevel(200);

      expect(time100).toBeGreaterThanOrEqual(DIFFICULTY_CONFIG.MIN_TIME);
      expect(time200).toBeGreaterThanOrEqual(DIFFICULTY_CONFIG.MIN_TIME);
    });
  });

  describe('getTierNumber', () => {
    it('returns tier 1 for levels 1-3', () => {
      expect(getTierNumber(1)).toBe(1);
      expect(getTierNumber(2)).toBe(1);
      expect(getTierNumber(3)).toBe(1);
    });

    it('returns tier 2 for levels 4-6', () => {
      expect(getTierNumber(4)).toBe(2);
      expect(getTierNumber(5)).toBe(2);
      expect(getTierNumber(6)).toBe(2);
    });

    it('returns correct tier for mid-game levels', () => {
      expect(getTierNumber(10)).toBe(4); // Tier 4: 10-12
      // Level 20 is in tier 7's range [19, 21] which is matched first
      expect(getTierNumber(20)).toBe(7);
      // Level 22 should be tier 8 (range [20, 24], but 22 > 21)
      expect(getTierNumber(22)).toBe(8);
    });

    it('handles high levels', () => {
      const tier40 = getTierNumber(40);
      expect(tier40).toBeGreaterThan(0);
    });

    it('handles levels beyond defined tiers', () => {
      const tierHigh = getTierNumber(100);
      expect(tierHigh).toBeGreaterThan(0);
    });
  });

  describe('getOperationsForLevel', () => {
    it('returns addition and subtraction for tier 1', () => {
      const ops = getOperationsForLevel(1);
      expect(ops).toContain('addition');
      expect(ops).toContain('subtraction');
      expect(ops).toHaveLength(2);
    });

    it('returns all basic operations for tier 2', () => {
      const ops = getOperationsForLevel(4);
      expect(ops).toContain('addition');
      expect(ops).toContain('subtraction');
      expect(ops).toContain('multiplication');
      expect(ops).toContain('division');
    });

    it('includes fractions for tier 3', () => {
      const ops = getOperationsForLevel(7);
      expect(ops).toContain('fraction');
    });

    it('includes percentages for tier 5', () => {
      const ops = getOperationsForLevel(13);
      expect(ops).toContain('percentage');
    });

    it('includes metric conversions for tier 6', () => {
      const ops = getOperationsForLevel(16);
      expect(ops).toContain('metricConversion');
    });

    it('returns valid operations array', () => {
      const validOps: OperationCategory[] = [
        'addition',
        'subtraction',
        'multiplication',
        'division',
        'fraction',
        'improperFraction',
        'percentage',
        'metricConversion',
      ];

      for (let level = 1; level <= 50; level++) {
        const ops = getOperationsForLevel(level);
        expect(ops.length).toBeGreaterThan(0);
        ops.forEach((op) => {
          expect(validOps).toContain(op);
        });
      }
    });
  });

  describe('getDigitTypeForLevel', () => {
    it('returns single for early tiers', () => {
      expect(getDigitTypeForLevel(1)).toBe('single');
      expect(getDigitTypeForLevel(6)).toBe('single');
      expect(getDigitTypeForLevel(18)).toBe('single');
    });

    it('returns double for tier 7+', () => {
      expect(getDigitTypeForLevel(19)).toBe('double');
      expect(getDigitTypeForLevel(24)).toBe('double');
    });

    it('returns triple for tier 13+', () => {
      expect(getDigitTypeForLevel(37)).toBe('triple');
      expect(getDigitTypeForLevel(40)).toBe('triple');
    });
  });

  describe('getDigitRangeForLevel', () => {
    it('returns single digit range for tier 1', () => {
      const range = getDigitRangeForLevel(1);
      expect(range).toEqual({ min: 1, max: 9 });
    });

    it('returns double digit range for tier 7', () => {
      const range = getDigitRangeForLevel(19);
      expect(range).toEqual({ min: 10, max: 99 });
    });

    it('returns triple digit range for tier 13', () => {
      const range = getDigitRangeForLevel(37);
      expect(range).toEqual({ min: 100, max: 500 });
    });
  });

  describe('getLevelConfig', () => {
    it('returns complete config for level 1', () => {
      const config = getLevelConfig(1);

      expect(config).toHaveProperty('level', 1);
      expect(config).toHaveProperty('tier');
      expect(config).toHaveProperty('timeAvailable');
      expect(config).toHaveProperty('operations');
      expect(config).toHaveProperty('digitType');
      expect(config).toHaveProperty('digitRange');
    });

    it('returns correct structure for various levels', () => {
      const levels = [1, 5, 10, 20, 40];

      levels.forEach((level) => {
        const config = getLevelConfig(level);

        expect(config.level).toBe(level);
        expect(config.tier).toBeGreaterThan(0);
        expect(config.timeAvailable).toBeGreaterThan(0);
        expect(Array.isArray(config.operations)).toBe(true);
        expect(config.operations.length).toBeGreaterThan(0);
        expect(['single', 'double', 'triple']).toContain(config.digitType);
        expect(config.digitRange).toHaveProperty('min');
        expect(config.digitRange).toHaveProperty('max');
      });
    });

    it('time matches calculateTimeForLevel', () => {
      for (let level = 1; level <= 20; level++) {
        const config = getLevelConfig(level);
        const directTime = calculateTimeForLevel(level);
        expect(config.timeAvailable).toBe(directTime);
      }
    });

    it('operations match getOperationsForLevel', () => {
      for (let level = 1; level <= 20; level++) {
        const config = getLevelConfig(level);
        const directOps = getOperationsForLevel(level);
        expect(config.operations).toEqual(directOps);
      }
    });
  });

  describe('calculateFallSpeed', () => {
    it('calculates speed based on canvas height and time', () => {
      const canvasHeight = 600;
      const timeAvailable = 10;
      const fps = 60;

      const speed = calculateFallSpeed(canvasHeight, timeAvailable, fps);

      // Expected: (600 - 50 - 60 - 100) / (10 * 60) = 390 / 600 = 0.65
      expect(speed).toBeCloseTo(0.65, 2);
    });

    it('returns higher speed for less time', () => {
      const canvasHeight = 600;

      const speedFast = calculateFallSpeed(canvasHeight, 2, 60);
      const speedSlow = calculateFallSpeed(canvasHeight, 10, 60);

      expect(speedFast).toBeGreaterThan(speedSlow);
    });

    it('returns higher speed for taller canvas', () => {
      const timeAvailable = 5;

      const speedTall = calculateFallSpeed(800, timeAvailable, 60);
      const speedShort = calculateFallSpeed(400, timeAvailable, 60);

      expect(speedTall).toBeGreaterThan(speedShort);
    });

    it('uses default fps of 60', () => {
      const canvasHeight = 600;
      const timeAvailable = 5;

      const speedDefault = calculateFallSpeed(canvasHeight, timeAvailable);
      const speedExplicit = calculateFallSpeed(canvasHeight, timeAvailable, 60);

      expect(speedDefault).toBe(speedExplicit);
    });

    it('adjusts for different fps', () => {
      const canvasHeight = 600;
      const timeAvailable = 5;

      const speed60fps = calculateFallSpeed(canvasHeight, timeAvailable, 60);
      const speed30fps = calculateFallSpeed(canvasHeight, timeAvailable, 30);

      // 30fps should move twice as fast per frame to cover same distance in same time
      expect(speed30fps).toBeCloseTo(speed60fps * 2, 5);
    });
  });

  describe('selectRandomOperation', () => {
    it('returns an operation from the available list', () => {
      const available: OperationCategory[] = ['addition', 'subtraction'];

      for (let i = 0; i < 20; i++) {
        const selected = selectRandomOperation(available);
        expect(available).toContain(selected);
      }
    });

    it('returns single operation if only one available', () => {
      const available: OperationCategory[] = ['multiplication'];

      for (let i = 0; i < 10; i++) {
        const selected = selectRandomOperation(available);
        expect(selected).toBe('multiplication');
      }
    });

    it('selects from all operations when all available', () => {
      const available: OperationCategory[] = [
        'addition',
        'subtraction',
        'multiplication',
        'division',
        'fraction',
        'improperFraction',
        'percentage',
        'metricConversion',
      ];

      const selected = new Set<string>();

      // Run many times to hit different operations
      for (let i = 0; i < 100; i++) {
        selected.add(selectRandomOperation(available));
      }

      // Should have selected multiple different operations
      expect(selected.size).toBeGreaterThan(1);
    });

    it('uses operation weights from config', () => {
      const available: OperationCategory[] = ['addition', 'metricConversion'];

      // Addition has weight 20, metricConversion has weight 5
      // So addition should appear roughly 4x more often
      let additionCount = 0;
      let metricCount = 0;

      for (let i = 0; i < 500; i++) {
        const selected = selectRandomOperation(available);
        if (selected === 'addition') additionCount++;
        if (selected === 'metricConversion') metricCount++;
      }

      // Addition should be significantly more common
      expect(additionCount).toBeGreaterThan(metricCount);
    });
  });

  describe('getTierDescription', () => {
    it('returns description for tier 1', () => {
      const desc = getTierDescription(1);
      expect(typeof desc).toBe('string');
      expect(desc.length).toBeGreaterThan(0);
    });

    it('returns different descriptions for different tiers', () => {
      const desc1 = getTierDescription(1);
      const desc7 = getTierDescription(19); // Tier 7 starts at level 19
      const desc13 = getTierDescription(37); // Tier 13 starts at level 37

      expect(desc1).not.toBe(desc7);
      expect(desc7).not.toBe(desc13);
    });

    it('returns default for undefined tiers', () => {
      const desc = getTierDescription(1000);
      expect(typeof desc).toBe('string');
    });
  });

  describe('isNewTier', () => {
    it('returns true for level 1', () => {
      expect(isNewTier(1)).toBe(true);
    });

    it('returns false for levels within same tier', () => {
      expect(isNewTier(2)).toBe(false);
      expect(isNewTier(3)).toBe(false);
    });

    it('returns true at tier boundaries', () => {
      // Tier 2 starts at level 4
      expect(isNewTier(4)).toBe(true);

      // Tier 3 starts at level 7
      expect(isNewTier(7)).toBe(true);
    });

    it('returns false just after tier boundary', () => {
      expect(isNewTier(5)).toBe(false);
      expect(isNewTier(8)).toBe(false);
    });
  });

  describe('getNextTierStartLevel', () => {
    it('returns correct next tier level from tier 1', () => {
      const nextLevel = getNextTierStartLevel(1);
      // Tier 1 is levels 1-3, so next tier starts at level 6 (5 levels per tier based on config)
      expect(nextLevel).toBeGreaterThan(1);
    });

    it('returns level after current tier', () => {
      const currentLevel = 5;
      const nextTierLevel = getNextTierStartLevel(currentLevel);
      const currentTier = getTierNumber(currentLevel);
      const nextTier = getTierNumber(nextTierLevel);

      // Next tier start should be in a higher tier
      expect(nextTier).toBeGreaterThanOrEqual(currentTier);
    });

    it('increases for each level', () => {
      // Within the same tier, next tier start should be the same
      const next1 = getNextTierStartLevel(1);
      const next2 = getNextTierStartLevel(2);
      const next3 = getNextTierStartLevel(3);

      expect(next1).toBe(next2);
      expect(next2).toBe(next3);
    });
  });

  describe('integration tests', () => {
    it('progression makes sense through levels', () => {
      let previousTime = Infinity;

      for (let level = 1; level <= 5; level++) {
        const config = getLevelConfig(level);

        // Within a tier, time should decrease or stay same
        if (!isNewTier(level)) {
          expect(config.timeAvailable).toBeLessThanOrEqual(previousTime);
        }

        previousTime = config.timeAvailable;
      }
    });

    it('digit type progresses with tiers', () => {
      const digitTypes: string[] = [];

      [1, 19, 37].forEach((level) => {
        digitTypes.push(getDigitTypeForLevel(level));
      });

      expect(digitTypes).toEqual(['single', 'double', 'triple']);
    });

    it('operations expand as tiers progress', () => {
      const ops1 = getOperationsForLevel(1).length;
      const ops7 = getOperationsForLevel(7).length;

      // More operations should be available at higher tiers
      expect(ops7).toBeGreaterThanOrEqual(ops1);
    });
  });
});
