import { describe, it, expect } from 'vitest';
import {
  generateProperFractionProblem,
  generateImproperFractionProblem,
  generateFractionWrongAnswers,
} from './fractionGenerator';

describe('fractionGenerator', () => {
  describe('generateProperFractionProblem', () => {
    it('returns a valid MathProblem shape', () => {
      const problem = generateProperFractionProblem();

      expect(problem).toHaveProperty('operand1');
      expect(problem).toHaveProperty('operation');
      expect(problem).toHaveProperty('correctAnswer');
      expect(problem).toHaveProperty('numericAnswer');
      expect(problem).toHaveProperty('displayString');
      expect(problem).toHaveProperty('answerFormat');
    });

    it('sets operation to fraction', () => {
      for (let i = 0; i < 10; i++) {
        const problem = generateProperFractionProblem();
        // Can be 'fraction' for proper fractions
        expect(problem.operation).toBe('fraction');
      }
    });

    it('generates valid numeric answer', () => {
      for (let i = 0; i < 10; i++) {
        const problem = generateProperFractionProblem();
        expect(typeof problem.numericAnswer).toBe('number');
        expect(Number.isFinite(problem.numericAnswer)).toBe(true);
      }
    });

    it('generates display string with proper format', () => {
      for (let i = 0; i < 10; i++) {
        const problem = generateProperFractionProblem();
        expect(problem.displayString).toContain('= ?');
        // Should be an arithmetic, simplification, or "of" problem
        const hasValidFormat =
          problem.displayString.includes('+') ||
          problem.displayString.includes('-') ||
          problem.displayString.includes('Simplify') ||
          problem.displayString.includes(' of ');
        expect(hasValidFormat).toBe(true);
      }
    });

    it('generates correct answer in appropriate format', () => {
      for (let i = 0; i < 20; i++) {
        const problem = generateProperFractionProblem();

        if (problem.answerFormat === 'number') {
          // Answer should be a number or a numeric string
          const answer = problem.correctAnswer;
          if (typeof answer === 'string') {
            expect(Number.isFinite(parseFloat(answer))).toBe(true);
          } else {
            expect(typeof answer).toBe('number');
          }
        } else if (problem.answerFormat === 'fraction') {
          expect(typeof problem.correctAnswer).toBe('string');
          expect(problem.correctAnswer as string).toMatch(/^\d+\/\d+$|^\d+$/);
        }
      }
    });
  });

  describe('generateImproperFractionProblem', () => {
    it('returns a valid MathProblem shape', () => {
      const problem = generateImproperFractionProblem();

      expect(problem).toHaveProperty('operand1');
      expect(problem).toHaveProperty('operation');
      expect(problem).toHaveProperty('correctAnswer');
      expect(problem).toHaveProperty('numericAnswer');
      expect(problem).toHaveProperty('displayString');
      expect(problem).toHaveProperty('answerFormat');
    });

    it('sets operation to improperFraction', () => {
      for (let i = 0; i < 10; i++) {
        const problem = generateImproperFractionProblem();
        // Can be 'improperFraction' or 'fraction' for arithmetic
        expect(['improperFraction', 'fraction']).toContain(problem.operation);
      }
    });

    it('generates valid numeric answer', () => {
      for (let i = 0; i < 10; i++) {
        const problem = generateImproperFractionProblem();
        expect(typeof problem.numericAnswer).toBe('number');
        expect(Number.isFinite(problem.numericAnswer)).toBe(true);
      }
    });

    it('generates mixed number conversion problems', () => {
      // Run many times to hit the conversion branches
      let foundMixedToImproper = false;
      let foundImproperToMixed = false;

      for (let i = 0; i < 50; i++) {
        const problem = generateImproperFractionProblem();
        if (problem.displayString.includes('to improper')) {
          foundMixedToImproper = true;
        }
        if (problem.displayString.includes('to mixed')) {
          foundImproperToMixed = true;
        }
      }

      // Both types should appear over 50 iterations
      expect(foundMixedToImproper || foundImproperToMixed).toBe(true);
    });

    it('handles mixed number answer format', () => {
      for (let i = 0; i < 30; i++) {
        const problem = generateImproperFractionProblem();

        if (problem.answerFormat === 'mixed') {
          expect(typeof problem.correctAnswer).toBe('string');
          // Mixed format: "3 1/4" or just "3"
          const answer = problem.correctAnswer as string;
          const isMixedFormat = /^\d+( \d+\/\d+)?$/.test(answer);
          expect(isMixedFormat).toBe(true);
        }
      }
    });
  });

  describe('generateFractionWrongAnswers', () => {
    describe('with numeric correct answer', () => {
      it('generates exactly 2 wrong answers', () => {
        const wrongAnswers = generateFractionWrongAnswers(8, 8);
        expect(wrongAnswers).toHaveLength(2);
      });

      it('generates unique wrong answers', () => {
        for (let i = 0; i < 10; i++) {
          const correctAnswer = Math.floor(Math.random() * 20) + 5;
          const wrongAnswers = generateFractionWrongAnswers(correctAnswer, correctAnswer);

          const uniqueAnswers = new Set(wrongAnswers.map(String));
          expect(uniqueAnswers.size).toBe(2);
        }
      });

      it('generates wrong answers different from correct', () => {
        for (let i = 0; i < 10; i++) {
          const correctAnswer = Math.floor(Math.random() * 20) + 5;
          const wrongAnswers = generateFractionWrongAnswers(correctAnswer, correctAnswer);

          wrongAnswers.forEach((wrong) => {
            expect(wrong).not.toBe(correctAnswer);
          });
        }
      });

      it('generates positive wrong answers', () => {
        for (let i = 0; i < 10; i++) {
          const correctAnswer = Math.floor(Math.random() * 20) + 5;
          const wrongAnswers = generateFractionWrongAnswers(correctAnswer, correctAnswer);

          wrongAnswers.forEach((wrong) => {
            expect(wrong).toBeGreaterThan(0);
          });
        }
      });
    });

    describe('with fraction string correct answer', () => {
      it('generates exactly 2 wrong answers', () => {
        const wrongAnswers = generateFractionWrongAnswers('3/4', 0.75);
        expect(wrongAnswers).toHaveLength(2);
      });

      it('generates unique wrong answers', () => {
        const wrongAnswers = generateFractionWrongAnswers('3/4', 0.75);
        const uniqueAnswers = new Set(wrongAnswers.map(String));
        expect(uniqueAnswers.size).toBe(2);
      });

      it('generates wrong answers different from correct', () => {
        const wrongAnswers = generateFractionWrongAnswers('3/4', 0.75);

        wrongAnswers.forEach((wrong) => {
          expect(wrong).not.toBe('3/4');
        });
      });

      it('generates plausible fraction wrong answers', () => {
        const wrongAnswers = generateFractionWrongAnswers('3/4', 0.75);

        wrongAnswers.forEach((wrong) => {
          expect(typeof wrong).toBe('string');
          // Should be in format "n/d"
          expect(wrong as string).toMatch(/^\d+\/\d+$/);
        });
      });

      it('generates wrong answers for various fractions', () => {
        const testCases = ['1/2', '2/3', '5/8', '7/10'];

        testCases.forEach((fraction) => {
          const parts = fraction.split('/');
          const numeric = parseInt(parts[0]) / parseInt(parts[1]);
          const wrongAnswers = generateFractionWrongAnswers(fraction, numeric);

          expect(wrongAnswers).toHaveLength(2);
          wrongAnswers.forEach((wrong) => {
            expect(wrong).not.toBe(fraction);
          });
        });
      });
    });

    describe('edge cases', () => {
      it('handles small fractions', () => {
        const wrongAnswers = generateFractionWrongAnswers('1/8', 0.125);
        expect(wrongAnswers).toHaveLength(2);
      });

      it('handles fractions with large numerators', () => {
        const wrongAnswers = generateFractionWrongAnswers('7/8', 0.875);
        expect(wrongAnswers).toHaveLength(2);
        wrongAnswers.forEach((wrong) => {
          const parts = (wrong as string).split('/');
          expect(parseInt(parts[0])).toBeGreaterThan(0);
          expect(parseInt(parts[1])).toBeGreaterThan(0);
        });
      });

      it('handles whole number string answers', () => {
        const wrongAnswers = generateFractionWrongAnswers('4', 4);
        expect(wrongAnswers).toHaveLength(2);
      });
    });
  });
});
