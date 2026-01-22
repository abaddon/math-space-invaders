import { describe, it, expect } from 'vitest';
import {
  generateProblem,
  generateProblemForOperation,
  generateWrongAnswers,
  generateAnswerBlocks,
  getLevelConfig,
  calculateFallSpeed,
  calculateTimeForLevel,
} from './index';
import type { OperationCategory, LevelConfig } from '../types';

describe('generators/index', () => {
  describe('generateProblem', () => {
    it('generates a valid problem for level 1', () => {
      const problem = generateProblem(1);

      expect(problem).toHaveProperty('operand1');
      expect(problem).toHaveProperty('operation');
      expect(problem).toHaveProperty('correctAnswer');
      expect(problem).toHaveProperty('numericAnswer');
      expect(problem).toHaveProperty('displayString');
      expect(problem).toHaveProperty('answerFormat');
    });

    it('generates correct operations for tier 1 (levels 1-3)', () => {
      // Tier 1: addition, subtraction
      for (let level = 1; level <= 3; level++) {
        for (let i = 0; i < 10; i++) {
          const problem = generateProblem(level);
          expect(['addition', 'subtraction']).toContain(problem.operation);
        }
      }
    });

    it('generates correct operations for tier 2 (levels 4-6)', () => {
      // Tier 2: addition, subtraction, multiplication, division
      const tier2Ops: OperationCategory[] = ['addition', 'subtraction', 'multiplication', 'division'];

      for (let level = 4; level <= 6; level++) {
        for (let i = 0; i < 10; i++) {
          const problem = generateProblem(level);
          expect(tier2Ops).toContain(problem.operation);
        }
      }
    });

    it('generates fraction operations for tier 3 (levels 7-9)', () => {
      // Tier 3: multiplication, division, fraction
      const tier3Ops: OperationCategory[] = ['multiplication', 'division', 'fraction'];

      for (let level = 7; level <= 9; level++) {
        for (let i = 0; i < 10; i++) {
          const problem = generateProblem(level);
          expect(tier3Ops).toContain(problem.operation);
        }
      }
    });

    it('generates percentage operations for tier 5 (levels 13-15)', () => {
      // Tier 5: fraction, improperFraction, percentage
      const tier5Ops: OperationCategory[] = ['fraction', 'improperFraction', 'percentage'];

      let foundPercentage = false;
      for (let level = 13; level <= 15; level++) {
        for (let i = 0; i < 20; i++) {
          const problem = generateProblem(level);
          expect(tier5Ops).toContain(problem.operation);
          if (problem.operation === 'percentage') {
            foundPercentage = true;
          }
        }
      }
      expect(foundPercentage).toBe(true);
    });

    it('generates metric conversions for tier 6 (levels 16-18)', () => {
      // Tier 6: improperFraction, percentage, metricConversion
      const tier6Ops: OperationCategory[] = ['improperFraction', 'percentage', 'metricConversion'];

      let foundMetric = false;
      for (let level = 16; level <= 18; level++) {
        for (let i = 0; i < 20; i++) {
          const problem = generateProblem(level);
          expect(tier6Ops).toContain(problem.operation);
          if (problem.operation === 'metricConversion') {
            foundMetric = true;
          }
        }
      }
      expect(foundMetric).toBe(true);
    });
  });

  describe('generateProblemForOperation', () => {
    const mockConfig: LevelConfig = {
      level: 1,
      tier: 1,
      timeAvailable: 10,
      operations: ['addition', 'subtraction'],
      digitType: 'single',
      digitRange: { min: 1, max: 9 },
    };

    it('generates addition problem', () => {
      const problem = generateProblemForOperation('addition', mockConfig);
      expect(problem.operation).toBe('addition');
      expect(problem.displayString).toContain('+');
    });

    it('generates subtraction problem', () => {
      const problem = generateProblemForOperation('subtraction', mockConfig);
      expect(problem.operation).toBe('subtraction');
      expect(problem.displayString).toContain('-');
    });

    it('generates multiplication problem', () => {
      const problem = generateProblemForOperation('multiplication', mockConfig);
      expect(problem.operation).toBe('multiplication');
      expect(problem.displayString).toContain('×');
    });

    it('generates division problem', () => {
      const problem = generateProblemForOperation('division', mockConfig);
      expect(problem.operation).toBe('division');
      expect(problem.displayString).toContain('÷');
    });

    it('generates fraction problem', () => {
      const problem = generateProblemForOperation('fraction', mockConfig);
      expect(problem.operation).toBe('fraction');
    });

    it('generates improperFraction problem', () => {
      const problem = generateProblemForOperation('improperFraction', mockConfig);
      expect(['improperFraction', 'fraction']).toContain(problem.operation);
    });

    it('generates percentage problem', () => {
      const problem = generateProblemForOperation('percentage', mockConfig);
      expect(problem.operation).toBe('percentage');
      expect(problem.displayString).toContain('%');
    });

    it('generates metricConversion problem', () => {
      const problem = generateProblemForOperation('metricConversion', mockConfig);
      expect(problem.operation).toBe('metricConversion');
      expect(problem.displayString).toContain('Convert');
    });

    it('defaults to addition for unknown operation', () => {
      const problem = generateProblemForOperation('unknown' as OperationCategory, mockConfig);
      expect(problem.operation).toBe('addition');
    });
  });

  describe('generateWrongAnswers', () => {
    it('generates wrong answers for arithmetic problems', () => {
      const problem = {
        operand1: 5,
        operand2: 3,
        operation: 'addition' as const,
        correctAnswer: 8,
        numericAnswer: 8,
        displayString: '5 + 3 = ?',
        answerFormat: 'number' as const,
      };

      const wrongAnswers = generateWrongAnswers(problem);

      expect(wrongAnswers).toHaveLength(2);
      wrongAnswers.forEach((wrong) => {
        expect(wrong).not.toBe(8);
      });
    });

    it('generates wrong answers for fraction problems', () => {
      const problem = {
        operand1: '1/2',
        operand2: '1/4',
        operation: 'fraction' as const,
        correctAnswer: '3/4',
        numericAnswer: 0.75,
        displayString: '1/2 + 1/4 = ?',
        answerFormat: 'fraction' as const,
      };

      const wrongAnswers = generateWrongAnswers(problem);

      expect(wrongAnswers).toHaveLength(2);
      wrongAnswers.forEach((wrong) => {
        expect(wrong).not.toBe('3/4');
      });
    });

    it('generates wrong answers for percentage problems', () => {
      const problem = {
        operand1: 25,
        operand2: 80,
        operation: 'percentage' as const,
        correctAnswer: 20,
        numericAnswer: 20,
        displayString: 'What is 25% of 80?',
        answerFormat: 'number' as const,
      };

      const wrongAnswers = generateWrongAnswers(problem);

      expect(wrongAnswers).toHaveLength(2);
      wrongAnswers.forEach((wrong) => {
        expect(wrong).not.toBe(20);
      });
    });

    it('generates wrong answers for metric conversion problems', () => {
      const problem = {
        operand1: '5 km',
        operation: 'metricConversion' as const,
        correctAnswer: '5,000 m',
        numericAnswer: 5000,
        displayString: 'Convert 5 km to m = ?',
        answerFormat: 'unit' as const,
      };

      const wrongAnswers = generateWrongAnswers(problem);

      expect(wrongAnswers).toHaveLength(2);
      wrongAnswers.forEach((wrong) => {
        expect(wrong).not.toBe(5000);
      });
    });
  });

  describe('generateAnswerBlocks', () => {
    it('generates exactly 3 answer blocks', () => {
      const problem = {
        operand1: 5,
        operand2: 3,
        operation: 'addition' as const,
        correctAnswer: 8,
        numericAnswer: 8,
        displayString: '5 + 3 = ?',
        answerFormat: 'number' as const,
      };

      const blocks = generateAnswerBlocks(problem, 400, 80, 50);

      expect(blocks).toHaveLength(3);
    });

    it('includes exactly one correct answer', () => {
      const problem = {
        operand1: 5,
        operand2: 3,
        operation: 'addition' as const,
        correctAnswer: 8,
        numericAnswer: 8,
        displayString: '5 + 3 = ?',
        answerFormat: 'number' as const,
      };

      const blocks = generateAnswerBlocks(problem, 400, 80, 50);
      const correctBlocks = blocks.filter((b) => b.isCorrect);

      expect(correctBlocks).toHaveLength(1);
      expect(correctBlocks[0].value).toBe(8);
    });

    it('includes exactly two incorrect answers', () => {
      const problem = {
        operand1: 5,
        operand2: 3,
        operation: 'addition' as const,
        correctAnswer: 8,
        numericAnswer: 8,
        displayString: '5 + 3 = ?',
        answerFormat: 'number' as const,
      };

      const blocks = generateAnswerBlocks(problem, 400, 80, 50);
      const incorrectBlocks = blocks.filter((b) => !b.isCorrect);

      expect(incorrectBlocks).toHaveLength(2);
      incorrectBlocks.forEach((block) => {
        expect(block.value).not.toBe(8);
      });
    });

    it('shuffles answer positions', () => {
      const problem = {
        operand1: 10,
        operand2: 5,
        operation: 'addition' as const,
        correctAnswer: 15,
        numericAnswer: 15,
        displayString: '10 + 5 = ?',
        answerFormat: 'number' as const,
      };

      // Generate multiple times and check that correct answer position varies
      const correctPositions = new Set<number>();

      for (let i = 0; i < 20; i++) {
        const blocks = generateAnswerBlocks(problem, 400, 80, 50);
        const correctIndex = blocks.findIndex((b) => b.isCorrect);
        correctPositions.add(correctIndex);
      }

      // Should have correct answer in different positions over 20 iterations
      expect(correctPositions.size).toBeGreaterThan(1);
    });

    it('sets correct x positions', () => {
      const canvasWidth = 400;
      const blockWidth = 80;

      const problem = {
        operand1: 5,
        operand2: 3,
        operation: 'addition' as const,
        correctAnswer: 8,
        numericAnswer: 8,
        displayString: '5 + 3 = ?',
        answerFormat: 'number' as const,
      };

      const blocks = generateAnswerBlocks(problem, canvasWidth, blockWidth, 50);

      blocks.forEach((block) => {
        expect(block.x).toBeGreaterThan(0);
        expect(block.x).toBeLessThan(canvasWidth);
      });
    });

    it('sets correct y position (startY)', () => {
      const startY = 100;

      const problem = {
        operand1: 5,
        operand2: 3,
        operation: 'addition' as const,
        correctAnswer: 8,
        numericAnswer: 8,
        displayString: '5 + 3 = ?',
        answerFormat: 'number' as const,
      };

      const blocks = generateAnswerBlocks(problem, 400, 80, startY);

      blocks.forEach((block) => {
        expect(block.y).toBe(startY);
      });
    });

    it('assigns unique IDs to each block', () => {
      const problem = {
        operand1: 5,
        operand2: 3,
        operation: 'addition' as const,
        correctAnswer: 8,
        numericAnswer: 8,
        displayString: '5 + 3 = ?',
        answerFormat: 'number' as const,
      };

      const blocks = generateAnswerBlocks(problem, 400, 80, 50);
      const ids = blocks.map((b) => b.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(3);
    });

    it('preserves answer format from problem', () => {
      const problem = {
        operand1: '1/2',
        operand2: '1/4',
        operation: 'fraction' as const,
        correctAnswer: '3/4',
        numericAnswer: 0.75,
        displayString: '1/2 + 1/4 = ?',
        answerFormat: 'fraction' as const,
      };

      const blocks = generateAnswerBlocks(problem, 400, 80, 50);

      blocks.forEach((block) => {
        expect(block.answerFormat).toBe('fraction');
      });
    });
  });

  describe('getLevelConfig', () => {
    it('returns correct config for level 1', () => {
      const config = getLevelConfig(1);

      expect(config.level).toBe(1);
      expect(config.tier).toBe(1);
      expect(config.operations).toContain('addition');
      expect(config.digitType).toBe('single');
    });

    it('returns correct config for mid-level', () => {
      const config = getLevelConfig(10);

      expect(config.level).toBe(10);
      expect(config.operations).toBeDefined();
      expect(config.digitType).toBeDefined();
      expect(config.timeAvailable).toBeGreaterThan(0);
    });

    it('returns correct config for high level', () => {
      const config = getLevelConfig(40);

      expect(config.level).toBe(40);
      expect(config.digitType).toBe('triple');
    });
  });

  describe('calculateFallSpeed', () => {
    it('calculates speed based on canvas height and time', () => {
      const canvasHeight = 600;
      const timeAvailable = 10;
      const fps = 60;

      const speed = calculateFallSpeed(canvasHeight, timeAvailable, fps);

      expect(speed).toBeGreaterThan(0);
      expect(speed).toBeLessThan(canvasHeight);
    });

    it('returns higher speed for less time', () => {
      const canvasHeight = 600;

      const speedFast = calculateFallSpeed(canvasHeight, 2, 60);
      const speedSlow = calculateFallSpeed(canvasHeight, 10, 60);

      expect(speedFast).toBeGreaterThan(speedSlow);
    });

    it('uses default fps of 60', () => {
      const canvasHeight = 600;
      const timeAvailable = 5;

      const speedDefault = calculateFallSpeed(canvasHeight, timeAvailable);
      const speedExplicit = calculateFallSpeed(canvasHeight, timeAvailable, 60);

      expect(speedDefault).toBe(speedExplicit);
    });
  });

  describe('calculateTimeForLevel', () => {
    it('returns base time for level 1', () => {
      const time = calculateTimeForLevel(1);

      expect(time).toBe(10); // BASE_TIME
    });

    it('decreases time within a tier', () => {
      const time1 = calculateTimeForLevel(1);
      const time2 = calculateTimeForLevel(2);
      const time3 = calculateTimeForLevel(3);

      expect(time2).toBeLessThan(time1);
      expect(time3).toBeLessThan(time2);
    });

    it('never goes below minimum time', () => {
      // Test very high levels
      for (let level = 1; level <= 100; level++) {
        const time = calculateTimeForLevel(level);
        expect(time).toBeGreaterThanOrEqual(2); // MIN_TIME
      }
    });
  });
});
