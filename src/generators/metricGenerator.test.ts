import { describe, it, expect } from 'vitest';
import {
  generateMetricConversionProblem,
  generateMetricWrongAnswers,
  formatMetricAnswer,
  parseMetricAnswer,
} from './metricGenerator';
import { DIFFICULTY_CONFIG } from '../config/difficultyConfig';

describe('metricGenerator', () => {
  describe('generateMetricConversionProblem', () => {
    it('returns a valid MathProblem shape', () => {
      const problem = generateMetricConversionProblem();

      expect(problem).toHaveProperty('operand1');
      expect(problem).toHaveProperty('operation', 'metricConversion');
      expect(problem).toHaveProperty('correctAnswer');
      expect(problem).toHaveProperty('numericAnswer');
      expect(problem).toHaveProperty('displayString');
      expect(problem).toHaveProperty('answerFormat', 'unit');
    });

    it('generates valid numeric answer', () => {
      for (let i = 0; i < 20; i++) {
        const problem = generateMetricConversionProblem();
        expect(typeof problem.numericAnswer).toBe('number');
        expect(Number.isFinite(problem.numericAnswer)).toBe(true);
        expect(problem.numericAnswer).toBeGreaterThan(0);
      }
    });

    it('generates display string with Convert format', () => {
      for (let i = 0; i < 10; i++) {
        const problem = generateMetricConversionProblem();
        expect(problem.displayString).toContain('Convert');
        expect(problem.displayString).toContain(' to ');
        expect(problem.displayString).toContain('= ?');
      }
    });

    it('generates answer with unit', () => {
      for (let i = 0; i < 10; i++) {
        const problem = generateMetricConversionProblem();
        const answer = problem.correctAnswer as string;

        // Answer should be in format "123 unit"
        expect(typeof answer).toBe('string');
        expect(answer).toMatch(/[\d,]+ \S+/);
      }
    });

    it('uses enabled conversions from config', () => {
      const enabledConversions = DIFFICULTY_CONFIG.METRIC_CONFIG.enabledConversions;
      const allUnits = new Set<string>();

      enabledConversions.forEach((key) => {
        const conversion = DIFFICULTY_CONFIG.METRIC_CONFIG.conversions[key];
        allUnits.add(conversion.display[0]);
        allUnits.add(conversion.display[1]);
      });

      for (let i = 0; i < 20; i++) {
        const problem = generateMetricConversionProblem();
        const answer = problem.correctAnswer as string;
        const parts = answer.split(' ');
        const unit = parts[parts.length - 1];

        expect(allUnits).toContain(unit);
      }
    });

    it('generates both larger-to-smaller and smaller-to-larger conversions', () => {
      let foundMultiply = false;
      let foundDivide = false;

      for (let i = 0; i < 50; i++) {
        const problem = generateMetricConversionProblem();
        const answer = parseMetricAnswer(problem.correctAnswer as string);
        const input = parseMetricAnswer(problem.operand1 as string);

        if (answer > input) {
          foundMultiply = true; // Larger to smaller (multiply)
        } else if (answer < input) {
          foundDivide = true; // Smaller to larger (divide)
        }

        if (foundMultiply && foundDivide) break;
      }

      expect(foundMultiply || foundDivide).toBe(true);
    });

    it('produces clean conversion results (no decimals)', () => {
      for (let i = 0; i < 20; i++) {
        const problem = generateMetricConversionProblem();
        expect(Number.isInteger(problem.numericAnswer)).toBe(true);
      }
    });
  });

  describe('generateMetricWrongAnswers', () => {
    it('generates exactly 2 wrong answers', () => {
      const mockProblem = {
        operand1: '5 km',
        operation: 'metricConversion' as const,
        correctAnswer: '5,000 m',
        numericAnswer: 5000,
        displayString: 'Convert 5 km to m = ?',
        answerFormat: 'unit' as const,
      };

      const wrongAnswers = generateMetricWrongAnswers(5000, mockProblem);
      expect(wrongAnswers).toHaveLength(2);
    });

    it('generates unique wrong answers', () => {
      const mockProblem = {
        operand1: '5 km',
        operation: 'metricConversion' as const,
        correctAnswer: '5,000 m',
        numericAnswer: 5000,
        displayString: 'Convert 5 km to m = ?',
        answerFormat: 'unit' as const,
      };

      const wrongAnswers = generateMetricWrongAnswers(5000, mockProblem);
      const uniqueAnswers = new Set(wrongAnswers);
      expect(uniqueAnswers.size).toBe(2);
    });

    it('generates wrong answers different from correct', () => {
      const mockProblem = {
        operand1: '10 m',
        operation: 'metricConversion' as const,
        correctAnswer: '1,000 cm',
        numericAnswer: 1000,
        displayString: 'Convert 10 m to cm = ?',
        answerFormat: 'unit' as const,
      };

      const wrongAnswers = generateMetricWrongAnswers(1000, mockProblem);

      wrongAnswers.forEach((wrong) => {
        expect(wrong).not.toBe(1000);
      });
    });

    it('generates positive wrong answers', () => {
      const mockProblem = {
        operand1: '2 kg',
        operation: 'metricConversion' as const,
        correctAnswer: '2,000 g',
        numericAnswer: 2000,
        displayString: 'Convert 2 kg to g = ?',
        answerFormat: 'unit' as const,
      };

      const wrongAnswers = generateMetricWrongAnswers(2000, mockProblem);

      wrongAnswers.forEach((wrong) => {
        expect(wrong).toBeGreaterThan(0);
      });
    });

    it('generates common metric conversion mistakes', () => {
      const mockProblem = {
        operand1: '1 L',
        operation: 'metricConversion' as const,
        correctAnswer: '1,000 mL',
        numericAnswer: 1000,
        displayString: 'Convert 1 L to mL = ?',
        answerFormat: 'unit' as const,
      };

      const wrongAnswers = generateMetricWrongAnswers(1000, mockProblem);

      // Common mistakes include off by factor of 10
      wrongAnswers.forEach((wrong) => {
        expect(wrong).toBeGreaterThan(0);
        expect(wrong).not.toBe(1000);
      });
    });

    it('handles small conversion values', () => {
      const mockProblem = {
        operand1: '5000 m',
        operation: 'metricConversion' as const,
        correctAnswer: '5 km',
        numericAnswer: 5,
        displayString: 'Convert 5000 m to km = ?',
        answerFormat: 'unit' as const,
      };

      const wrongAnswers = generateMetricWrongAnswers(5, mockProblem);

      expect(wrongAnswers).toHaveLength(2);
      wrongAnswers.forEach((wrong) => {
        expect(wrong).toBeGreaterThan(0);
        expect(wrong).not.toBe(5);
      });
    });

    it('handles large conversion values', () => {
      const mockProblem = {
        operand1: '10 m²',
        operation: 'metricConversion' as const,
        correctAnswer: '100,000 cm²',
        numericAnswer: 100000,
        displayString: 'Convert 10 m² to cm² = ?',
        answerFormat: 'unit' as const,
      };

      const wrongAnswers = generateMetricWrongAnswers(100000, mockProblem);

      expect(wrongAnswers).toHaveLength(2);
      wrongAnswers.forEach((wrong) => {
        expect(wrong).not.toBe(100000);
      });
    });
  });

  describe('formatMetricAnswer', () => {
    it('formats integer values correctly', () => {
      expect(formatMetricAnswer(1000, 'm')).toBe('1,000 m');
      expect(formatMetricAnswer(5, 'km')).toBe('5 km');
      expect(formatMetricAnswer(100, 'g')).toBe('100 g');
    });

    it('adds commas for large numbers', () => {
      expect(formatMetricAnswer(1000000, 'm²')).toBe('1,000,000 m²');
      expect(formatMetricAnswer(10000, 'cm')).toBe('10,000 cm');
    });

    it('includes unit in output', () => {
      const result = formatMetricAnswer(42, 'mL');
      expect(result).toContain('mL');
      expect(result).toContain('42');
    });
  });

  describe('parseMetricAnswer', () => {
    it('parses simple metric answers', () => {
      expect(parseMetricAnswer('1000 m')).toBe(1000);
      expect(parseMetricAnswer('5 km')).toBe(5);
      expect(parseMetricAnswer('100 g')).toBe(100);
    });

    it('parses answers with commas', () => {
      expect(parseMetricAnswer('1,000 m')).toBe(1000);
      expect(parseMetricAnswer('1,000,000 m²')).toBe(1000000);
      expect(parseMetricAnswer('10,000 cm')).toBe(10000);
    });

    it('handles decimal values', () => {
      expect(parseMetricAnswer('3.5 km')).toBe(3.5);
      expect(parseMetricAnswer('0.5 L')).toBe(0.5);
    });

    it('ignores unit suffix', () => {
      expect(parseMetricAnswer('42 mL')).toBe(42);
      expect(parseMetricAnswer('99 kg')).toBe(99);
    });

    it('handles various formats', () => {
      expect(parseMetricAnswer('123')).toBe(123);
      expect(parseMetricAnswer(' 456 ')).toBe(456);
    });
  });

  describe('round-trip formatting', () => {
    it('formats and parses back to original value', () => {
      const testValues = [1, 10, 100, 1000, 10000, 100000];
      const testUnits = ['m', 'km', 'g', 'kg', 'mL', 'L'];

      testValues.forEach((value) => {
        testUnits.forEach((unit) => {
          const formatted = formatMetricAnswer(value, unit);
          const parsed = parseMetricAnswer(formatted);
          expect(parsed).toBe(value);
        });
      });
    });
  });
});
