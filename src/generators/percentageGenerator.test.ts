import { describe, it, expect } from 'vitest';
import {
  generatePercentageProblem,
  generatePercentageWrongAnswers,
} from './percentageGenerator';
import { DIFFICULTY_CONFIG } from '../config/difficultyConfig';

describe('percentageGenerator', () => {
  describe('generatePercentageProblem', () => {
    it('returns a valid MathProblem shape', () => {
      const problem = generatePercentageProblem();

      expect(problem).toHaveProperty('operand1');
      expect(problem).toHaveProperty('operand2');
      expect(problem).toHaveProperty('operation', 'percentage');
      expect(problem).toHaveProperty('correctAnswer');
      expect(problem).toHaveProperty('numericAnswer');
      expect(problem).toHaveProperty('displayString');
      expect(problem).toHaveProperty('answerFormat');
    });

    it('generates valid numeric answer', () => {
      for (let i = 0; i < 20; i++) {
        const problem = generatePercentageProblem();
        expect(typeof problem.numericAnswer).toBe('number');
        expect(Number.isFinite(problem.numericAnswer)).toBe(true);
        expect(problem.numericAnswer).toBeGreaterThan(0);
      }
    });

    it('generates "What is X% of Y?" problems', () => {
      // Run many times to hit this problem type
      let found = false;

      for (let i = 0; i < 30; i++) {
        const problem = generatePercentageProblem();
        if (problem.displayString.includes('What is') && problem.displayString.includes('% of')) {
          found = true;

          // Verify answer format
          expect(problem.answerFormat).toBe('number');

          // Verify the math
          const percentage = problem.operand1 as number;
          const baseNumber = problem.operand2 as number;
          const expectedAnswer = (percentage * baseNumber) / 100;
          expect(problem.correctAnswer).toBe(expectedAnswer);
          break;
        }
      }

      expect(found).toBe(true);
    });

    it('generates "X is what % of Y?" problems', () => {
      // Run many times to hit this problem type
      let found = false;

      for (let i = 0; i < 30; i++) {
        const problem = generatePercentageProblem();
        if (problem.displayString.includes('is what %')) {
          found = true;

          // Verify answer format
          expect(problem.answerFormat).toBe('percentage');

          // The answer should be the percentage
          const commonPercentages = DIFFICULTY_CONFIG.PERCENTAGE_CONFIG.commonPercentages;
          expect(commonPercentages).toContain(problem.correctAnswer);
          break;
        }
      }

      expect(found).toBe(true);
    });

    it('uses common percentages from config', () => {
      const commonPercentages = DIFFICULTY_CONFIG.PERCENTAGE_CONFIG.commonPercentages;

      for (let i = 0; i < 20; i++) {
        const problem = generatePercentageProblem();

        // Extract percentage from the problem
        if (problem.displayString.includes('What is')) {
          const percentage = problem.operand1 as number;
          expect(commonPercentages).toContain(percentage);
        }
      }
    });

    it('generates clean whole number results for findPercentageOf', () => {
      for (let i = 0; i < 20; i++) {
        const problem = generatePercentageProblem();

        if (problem.displayString.includes('What is')) {
          // Result should be a whole number
          expect(Number.isInteger(problem.correctAnswer)).toBe(true);
        }
      }
    });
  });

  describe('generatePercentageWrongAnswers', () => {
    it('generates exactly 2 wrong answers', () => {
      const mockProblem = {
        operand1: 25,
        operand2: 80,
        operation: 'percentage' as const,
        correctAnswer: 20,
        numericAnswer: 20,
        displayString: 'What is 25% of 80?',
        answerFormat: 'number' as const,
      };

      const wrongAnswers = generatePercentageWrongAnswers(20, mockProblem);
      expect(wrongAnswers).toHaveLength(2);
    });

    it('generates unique wrong answers', () => {
      const mockProblem = {
        operand1: 25,
        operand2: 80,
        operation: 'percentage' as const,
        correctAnswer: 20,
        numericAnswer: 20,
        displayString: 'What is 25% of 80?',
        answerFormat: 'number' as const,
      };

      const wrongAnswers = generatePercentageWrongAnswers(20, mockProblem);
      const uniqueAnswers = new Set(wrongAnswers);
      expect(uniqueAnswers.size).toBe(2);
    });

    it('generates wrong answers different from correct answer', () => {
      const mockProblem = {
        operand1: 50,
        operand2: 100,
        operation: 'percentage' as const,
        correctAnswer: 50,
        numericAnswer: 50,
        displayString: 'What is 50% of 100?',
        answerFormat: 'number' as const,
      };

      const wrongAnswers = generatePercentageWrongAnswers(50, mockProblem);

      wrongAnswers.forEach((wrong) => {
        expect(wrong).not.toBe(50);
      });
    });

    it('generates positive wrong answers', () => {
      const mockProblem = {
        operand1: 10,
        operand2: 50,
        operation: 'percentage' as const,
        correctAnswer: 5,
        numericAnswer: 5,
        displayString: 'What is 10% of 50?',
        answerFormat: 'number' as const,
      };

      const wrongAnswers = generatePercentageWrongAnswers(5, mockProblem);

      wrongAnswers.forEach((wrong) => {
        expect(wrong).toBeGreaterThan(0);
      });
    });

    it('generates appropriate mistakes for "what %" problems', () => {
      const mockProblem = {
        operand1: 20,
        operand2: 80,
        operation: 'percentage' as const,
        correctAnswer: 25,
        numericAnswer: 25,
        displayString: '20 is what % of 80?',
        answerFormat: 'percentage' as const,
      };

      const wrongAnswers = generatePercentageWrongAnswers(25, mockProblem);

      expect(wrongAnswers).toHaveLength(2);
      wrongAnswers.forEach((wrong) => {
        expect(wrong).not.toBe(25);
        expect(wrong).toBeGreaterThan(0);
      });
    });

    it('generates appropriate mistakes for "X% of Y" problems', () => {
      const mockProblem = {
        operand1: 75,
        operand2: 200,
        operation: 'percentage' as const,
        correctAnswer: 150,
        numericAnswer: 150,
        displayString: 'What is 75% of 200?',
        answerFormat: 'number' as const,
      };

      const wrongAnswers = generatePercentageWrongAnswers(150, mockProblem);

      expect(wrongAnswers).toHaveLength(2);
      wrongAnswers.forEach((wrong) => {
        expect(wrong).not.toBe(150);
        expect(wrong).toBeGreaterThan(0);
      });
    });

    it('handles small percentage answers', () => {
      const mockProblem = {
        operand1: 5,
        operand2: 100,
        operation: 'percentage' as const,
        correctAnswer: 5,
        numericAnswer: 5,
        displayString: 'What is 5% of 100?',
        answerFormat: 'number' as const,
      };

      const wrongAnswers = generatePercentageWrongAnswers(5, mockProblem);

      expect(wrongAnswers).toHaveLength(2);
      wrongAnswers.forEach((wrong) => {
        expect(wrong).toBeGreaterThan(0);
        expect(wrong).not.toBe(5);
      });
    });

    it('handles large percentage answers', () => {
      const mockProblem = {
        operand1: 100,
        operand2: 500,
        operation: 'percentage' as const,
        correctAnswer: 500,
        numericAnswer: 500,
        displayString: 'What is 100% of 500?',
        answerFormat: 'number' as const,
      };

      const wrongAnswers = generatePercentageWrongAnswers(500, mockProblem);

      expect(wrongAnswers).toHaveLength(2);
      wrongAnswers.forEach((wrong) => {
        expect(wrong).not.toBe(500);
      });
    });
  });
});
