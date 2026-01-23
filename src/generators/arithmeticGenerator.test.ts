import { describe, it, expect } from 'vitest';
import {
  generateAdditionProblem,
  generateSubtractionProblem,
  generateMultiplicationProblem,
  generateDivisionProblem,
  generateArithmeticProblem,
  generateArithmeticWrongAnswers,
} from './arithmeticGenerator';
import { DIFFICULTY_CONFIG } from '../config/difficultyConfig';
import type { DigitType } from '../types';

describe('arithmeticGenerator', () => {
  describe('generateAdditionProblem', () => {
    const digitTypes: DigitType[] = ['single', 'double', 'triple'];

    digitTypes.forEach((digitType) => {
      describe(`with ${digitType} digits`, () => {
        const range = DIFFICULTY_CONFIG.DIGIT_RANGES[digitType];

        it('returns a valid MathProblem shape', () => {
          const problem = generateAdditionProblem(digitType);

          expect(problem).toHaveProperty('operand1');
          expect(problem).toHaveProperty('operand2');
          expect(problem).toHaveProperty('operation', 'addition');
          expect(problem).toHaveProperty('correctAnswer');
          expect(problem).toHaveProperty('numericAnswer');
          expect(problem).toHaveProperty('displayString');
          expect(problem).toHaveProperty('answerFormat', 'number');
        });

        it('generates operands within digit bounds', () => {
          for (let i = 0; i < 20; i++) {
            const problem = generateAdditionProblem(digitType);
            const op1 = problem.operand1 as number;
            const op2 = problem.operand2 as number;

            expect(op1).toBeGreaterThanOrEqual(range.min);
            expect(op1).toBeLessThanOrEqual(range.max);
            expect(op2).toBeGreaterThanOrEqual(range.min);
            expect(op2).toBeLessThanOrEqual(range.max);
          }
        });

        it('calculates correct answer', () => {
          for (let i = 0; i < 10; i++) {
            const problem = generateAdditionProblem(digitType);
            const expectedAnswer = (problem.operand1 as number) + (problem.operand2 as number);

            expect(problem.correctAnswer).toBe(expectedAnswer);
            expect(problem.numericAnswer).toBe(expectedAnswer);
          }
        });

        it('formats display string correctly', () => {
          const problem = generateAdditionProblem(digitType);
          const expected = `${problem.operand1} + ${problem.operand2} = ?`;

          expect(problem.displayString).toBe(expected);
        });
      });
    });
  });

  describe('generateSubtractionProblem', () => {
    const digitTypes: DigitType[] = ['single', 'double', 'triple'];

    digitTypes.forEach((digitType) => {
      describe(`with ${digitType} digits`, () => {
        it('returns a valid MathProblem shape', () => {
          const problem = generateSubtractionProblem(digitType);

          expect(problem).toHaveProperty('operand1');
          expect(problem).toHaveProperty('operand2');
          expect(problem).toHaveProperty('operation', 'subtraction');
          expect(problem).toHaveProperty('correctAnswer');
          expect(problem).toHaveProperty('answerFormat', 'number');
        });

        it('ensures positive result (operand1 >= operand2)', () => {
          for (let i = 0; i < 20; i++) {
            const problem = generateSubtractionProblem(digitType);
            const op1 = problem.operand1 as number;
            const op2 = problem.operand2 as number;

            expect(op1).toBeGreaterThan(op2);
            expect(problem.correctAnswer).toBeGreaterThan(0);
          }
        });

        it('calculates correct answer', () => {
          for (let i = 0; i < 10; i++) {
            const problem = generateSubtractionProblem(digitType);
            const expectedAnswer = (problem.operand1 as number) - (problem.operand2 as number);

            expect(problem.correctAnswer).toBe(expectedAnswer);
            expect(problem.numericAnswer).toBe(expectedAnswer);
          }
        });

        it('formats display string correctly', () => {
          const problem = generateSubtractionProblem(digitType);
          const expected = `${problem.operand1} - ${problem.operand2} = ?`;

          expect(problem.displayString).toBe(expected);
        });
      });
    });
  });

  describe('generateMultiplicationProblem', () => {
    const digitTypes: DigitType[] = ['single', 'double', 'triple'];

    digitTypes.forEach((digitType) => {
      describe(`with ${digitType} digits`, () => {
        const limits = DIFFICULTY_CONFIG.MULTIPLICATION_LIMITS[digitType];

        it('returns a valid MathProblem shape', () => {
          const problem = generateMultiplicationProblem(digitType);

          expect(problem).toHaveProperty('operand1');
          expect(problem).toHaveProperty('operand2');
          expect(problem).toHaveProperty('operation', 'multiplication');
          expect(problem).toHaveProperty('correctAnswer');
          expect(problem).toHaveProperty('answerFormat', 'number');
        });

        it('respects multiplication limits', () => {
          for (let i = 0; i < 20; i++) {
            const problem = generateMultiplicationProblem(digitType);
            const op1 = problem.operand1 as number;
            const op2 = problem.operand2 as number;

            expect(op1).toBeGreaterThanOrEqual(2);
            expect(op1).toBeLessThanOrEqual(limits.factor1Max);
            expect(op2).toBeGreaterThanOrEqual(2);
          }
        });

        it('calculates correct answer', () => {
          for (let i = 0; i < 10; i++) {
            const problem = generateMultiplicationProblem(digitType);
            const expectedAnswer = (problem.operand1 as number) * (problem.operand2 as number);

            expect(problem.correctAnswer).toBe(expectedAnswer);
            expect(problem.numericAnswer).toBe(expectedAnswer);
          }
        });

        it('formats display string correctly with multiplication symbol', () => {
          const problem = generateMultiplicationProblem(digitType);
          const expected = `${problem.operand1} × ${problem.operand2} = ?`;

          expect(problem.displayString).toBe(expected);
        });
      });
    });
  });

  describe('generateDivisionProblem', () => {
    const digitTypes: DigitType[] = ['single', 'double', 'triple'];

    digitTypes.forEach((digitType) => {
      describe(`with ${digitType} digits`, () => {
        const limits = DIFFICULTY_CONFIG.DIVISION_LIMITS[digitType];

        it('returns a valid MathProblem shape', () => {
          const problem = generateDivisionProblem(digitType);

          expect(problem).toHaveProperty('operand1');
          expect(problem).toHaveProperty('operand2');
          expect(problem).toHaveProperty('operation', 'division');
          expect(problem).toHaveProperty('correctAnswer');
          expect(problem).toHaveProperty('answerFormat', 'number');
        });

        it('always results in clean division (no remainders)', () => {
          for (let i = 0; i < 20; i++) {
            const problem = generateDivisionProblem(digitType);
            const dividend = problem.operand1 as number;
            const divisor = problem.operand2 as number;
            const quotient = problem.correctAnswer as number;

            expect(dividend % divisor).toBe(0);
            expect(quotient).toBe(dividend / divisor);
            expect(Number.isInteger(quotient)).toBe(true);
          }
        });

        it('respects division limits', () => {
          for (let i = 0; i < 20; i++) {
            const problem = generateDivisionProblem(digitType);
            const divisor = problem.operand2 as number;

            expect(divisor).toBeGreaterThanOrEqual(2);
            expect(divisor).toBeLessThanOrEqual(limits.divisorMax);
          }
        });

        it('formats display string correctly with division symbol', () => {
          const problem = generateDivisionProblem(digitType);
          const expected = `${problem.operand1} ÷ ${problem.operand2} = ?`;

          expect(problem.displayString).toBe(expected);
        });
      });
    });
  });

  describe('generateArithmeticProblem', () => {
    it('dispatches to correct generator for addition', () => {
      const problem = generateArithmeticProblem('addition', 'single');
      expect(problem.operation).toBe('addition');
      expect(problem.displayString).toContain('+');
    });

    it('dispatches to correct generator for subtraction', () => {
      const problem = generateArithmeticProblem('subtraction', 'single');
      expect(problem.operation).toBe('subtraction');
      expect(problem.displayString).toContain('-');
    });

    it('dispatches to correct generator for multiplication', () => {
      const problem = generateArithmeticProblem('multiplication', 'single');
      expect(problem.operation).toBe('multiplication');
      expect(problem.displayString).toContain('×');
    });

    it('dispatches to correct generator for division', () => {
      const problem = generateArithmeticProblem('division', 'single');
      expect(problem.operation).toBe('division');
      expect(problem.displayString).toContain('÷');
    });

    it('defaults to addition for unknown operation', () => {
      const problem = generateArithmeticProblem('fraction' as 'addition', 'single');
      expect(problem.operation).toBe('addition');
    });
  });

  describe('generateArithmeticWrongAnswers', () => {
    it('generates exactly 2 wrong answers', () => {
      const wrongAnswers = generateArithmeticWrongAnswers(42, 'addition');
      expect(wrongAnswers).toHaveLength(2);
    });

    it('generates unique wrong answers', () => {
      for (let i = 0; i < 10; i++) {
        const correctAnswer = Math.floor(Math.random() * 100) + 10;
        const wrongAnswers = generateArithmeticWrongAnswers(correctAnswer, 'addition');

        const uniqueAnswers = new Set(wrongAnswers);
        expect(uniqueAnswers.size).toBe(2);
      }
    });

    it('generates wrong answers different from correct answer', () => {
      for (let i = 0; i < 20; i++) {
        const correctAnswer = Math.floor(Math.random() * 100) + 10;
        const wrongAnswers = generateArithmeticWrongAnswers(correctAnswer, 'addition');

        wrongAnswers.forEach((wrong) => {
          expect(wrong).not.toBe(correctAnswer);
        });
      }
    });

    it('generates positive wrong answers', () => {
      for (let i = 0; i < 20; i++) {
        const correctAnswer = Math.floor(Math.random() * 100) + 10;
        const wrongAnswers = generateArithmeticWrongAnswers(correctAnswer, 'addition');

        wrongAnswers.forEach((wrong) => {
          expect(wrong).toBeGreaterThan(0);
        });
      }
    });

    it('generates plausible wrong answers close to correct', () => {
      const correctAnswer = 50;
      const wrongAnswers = generateArithmeticWrongAnswers(correctAnswer, 'addition');

      wrongAnswers.forEach((wrong) => {
        const diff = Math.abs(wrong - correctAnswer);
        expect(diff).toBeLessThanOrEqual(30); // Within reasonable range
      });
    });

    it('handles small correct answers', () => {
      const wrongAnswers = generateArithmeticWrongAnswers(3, 'addition');

      expect(wrongAnswers).toHaveLength(2);
      wrongAnswers.forEach((wrong) => {
        expect(wrong).toBeGreaterThan(0);
        expect(wrong).not.toBe(3);
      });
    });

    it('handles large correct answers', () => {
      const wrongAnswers = generateArithmeticWrongAnswers(500, 'multiplication');

      expect(wrongAnswers).toHaveLength(2);
      wrongAnswers.forEach((wrong) => {
        expect(wrong).toBeGreaterThan(0);
        expect(wrong).not.toBe(500);
      });
    });

    it('generates appropriate mistakes for multiplication', () => {
      const wrongAnswers = generateArithmeticWrongAnswers(100, 'multiplication');

      expect(wrongAnswers).toHaveLength(2);
      wrongAnswers.forEach((wrong) => {
        expect(wrong).toBeGreaterThan(0);
      });
    });

    it('generates appropriate mistakes for division', () => {
      const wrongAnswers = generateArithmeticWrongAnswers(10, 'division');

      expect(wrongAnswers).toHaveLength(2);
      // Division common mistakes include +/-1 and *2
      wrongAnswers.forEach((wrong) => {
        expect(wrong).toBeGreaterThan(0);
        expect(wrong).not.toBe(10);
      });
    });
  });
});
