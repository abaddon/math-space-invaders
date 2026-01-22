import { describe, it, expect } from 'vitest';
import {
  gcd,
  lcm,
  simplifyFraction,
  fractionToDecimal,
  decimalToFraction,
  addFractions,
  subtractFractions,
  multiplyFractions,
  divideFractions,
  toMixedNumber,
  toImproperFraction,
  formatFraction,
  formatMixedNumber,
  parseFraction,
  isProperFraction,
  isImproperFraction,
  randomProperFraction,
  randomImproperFraction,
  fractionsEqual,
} from './fractionUtils';
import type { Fraction } from '../types';

describe('fractionUtils', () => {
  describe('gcd', () => {
    it('calculates GCD of two positive numbers', () => {
      expect(gcd(12, 8)).toBe(4);
      expect(gcd(15, 5)).toBe(5);
      expect(gcd(24, 36)).toBe(12);
    });

    it('handles coprime numbers', () => {
      expect(gcd(7, 11)).toBe(1);
      expect(gcd(17, 19)).toBe(1);
      expect(gcd(3, 8)).toBe(1);
    });

    it('handles same numbers', () => {
      expect(gcd(5, 5)).toBe(5);
      expect(gcd(100, 100)).toBe(100);
    });

    it('handles zero', () => {
      expect(gcd(5, 0)).toBe(5);
      expect(gcd(0, 5)).toBe(5);
      expect(gcd(0, 0)).toBe(0);
    });

    it('handles negative numbers', () => {
      expect(gcd(-12, 8)).toBe(4);
      expect(gcd(12, -8)).toBe(4);
      expect(gcd(-12, -8)).toBe(4);
    });

    it('handles decimal inputs by rounding', () => {
      // 12.5 rounds to 13, 8.2 rounds to 8, gcd(13, 8) = 1
      expect(gcd(12.5, 8.2)).toBe(1);
      // 12.4 rounds to 12, 8.0 stays 8, gcd(12, 8) = 4
      expect(gcd(12.4, 8.0)).toBe(4);
    });
  });

  describe('lcm', () => {
    it('calculates LCM of two positive numbers', () => {
      expect(lcm(3, 4)).toBe(12);
      expect(lcm(6, 8)).toBe(24);
      expect(lcm(5, 7)).toBe(35);
    });

    it('handles same numbers', () => {
      expect(lcm(5, 5)).toBe(5);
      expect(lcm(10, 10)).toBe(10);
    });

    it('handles one being multiple of other', () => {
      expect(lcm(4, 8)).toBe(8);
      expect(lcm(3, 9)).toBe(9);
    });

    it('handles coprime numbers', () => {
      expect(lcm(7, 11)).toBe(77);
      expect(lcm(3, 5)).toBe(15);
    });
  });

  describe('simplifyFraction', () => {
    it('simplifies reducible fractions', () => {
      expect(simplifyFraction({ numerator: 4, denominator: 8 })).toEqual({
        numerator: 1,
        denominator: 2,
      });
      expect(simplifyFraction({ numerator: 6, denominator: 9 })).toEqual({
        numerator: 2,
        denominator: 3,
      });
      expect(simplifyFraction({ numerator: 12, denominator: 18 })).toEqual({
        numerator: 2,
        denominator: 3,
      });
    });

    it('returns same fraction if already simplified', () => {
      expect(simplifyFraction({ numerator: 3, denominator: 4 })).toEqual({
        numerator: 3,
        denominator: 4,
      });
      expect(simplifyFraction({ numerator: 5, denominator: 7 })).toEqual({
        numerator: 5,
        denominator: 7,
      });
    });

    it('handles whole numbers', () => {
      expect(simplifyFraction({ numerator: 8, denominator: 4 })).toEqual({
        numerator: 2,
        denominator: 1,
      });
    });

    it('handles unit fractions', () => {
      expect(simplifyFraction({ numerator: 1, denominator: 5 })).toEqual({
        numerator: 1,
        denominator: 5,
      });
    });
  });

  describe('fractionToDecimal', () => {
    it('converts fractions to decimals', () => {
      expect(fractionToDecimal({ numerator: 1, denominator: 2 })).toBe(0.5);
      expect(fractionToDecimal({ numerator: 3, denominator: 4 })).toBe(0.75);
      expect(fractionToDecimal({ numerator: 1, denominator: 4 })).toBe(0.25);
    });

    it('handles whole numbers', () => {
      expect(fractionToDecimal({ numerator: 4, denominator: 1 })).toBe(4);
      expect(fractionToDecimal({ numerator: 10, denominator: 2 })).toBe(5);
    });

    it('handles repeating decimals', () => {
      const result = fractionToDecimal({ numerator: 1, denominator: 3 });
      expect(result).toBeCloseTo(0.333, 2);
    });
  });

  describe('decimalToFraction', () => {
    it('converts simple decimals to fractions', () => {
      expect(decimalToFraction(0.5)).toEqual({ numerator: 1, denominator: 2 });
      expect(decimalToFraction(0.25)).toEqual({ numerator: 1, denominator: 4 });
      expect(decimalToFraction(0.75)).toEqual({ numerator: 3, denominator: 4 });
    });

    it('converts integers to fractions', () => {
      expect(decimalToFraction(5)).toEqual({ numerator: 5, denominator: 1 });
      expect(decimalToFraction(10)).toEqual({ numerator: 10, denominator: 1 });
    });

    it('converts decimals with max denominator constraint', () => {
      const result = decimalToFraction(0.333, 10);
      expect(result.denominator).toBeLessThanOrEqual(10);
    });

    it('handles zero', () => {
      expect(decimalToFraction(0)).toEqual({ numerator: 0, denominator: 1 });
    });
  });

  describe('addFractions', () => {
    it('adds fractions with same denominator', () => {
      const result = addFractions(
        { numerator: 1, denominator: 4 },
        { numerator: 2, denominator: 4 }
      );
      expect(result).toEqual({ numerator: 3, denominator: 4 });
    });

    it('adds fractions with different denominators', () => {
      const result = addFractions(
        { numerator: 1, denominator: 2 },
        { numerator: 1, denominator: 3 }
      );
      expect(result).toEqual({ numerator: 5, denominator: 6 });
    });

    it('simplifies result', () => {
      const result = addFractions(
        { numerator: 1, denominator: 4 },
        { numerator: 1, denominator: 4 }
      );
      expect(result).toEqual({ numerator: 1, denominator: 2 });
    });

    it('handles unit fractions', () => {
      const result = addFractions(
        { numerator: 1, denominator: 2 },
        { numerator: 1, denominator: 2 }
      );
      expect(result).toEqual({ numerator: 1, denominator: 1 });
    });
  });

  describe('subtractFractions', () => {
    it('subtracts fractions with same denominator', () => {
      const result = subtractFractions(
        { numerator: 3, denominator: 4 },
        { numerator: 1, denominator: 4 }
      );
      expect(result).toEqual({ numerator: 1, denominator: 2 });
    });

    it('subtracts fractions with different denominators', () => {
      const result = subtractFractions(
        { numerator: 2, denominator: 3 },
        { numerator: 1, denominator: 6 }
      );
      expect(result).toEqual({ numerator: 1, denominator: 2 });
    });

    it('handles negative results', () => {
      const result = subtractFractions(
        { numerator: 1, denominator: 4 },
        { numerator: 3, denominator: 4 }
      );
      expect(result.numerator).toBe(-1);
      expect(result.denominator).toBe(2);
    });
  });

  describe('multiplyFractions', () => {
    it('multiplies fractions', () => {
      const result = multiplyFractions(
        { numerator: 1, denominator: 2 },
        { numerator: 2, denominator: 3 }
      );
      expect(result).toEqual({ numerator: 1, denominator: 3 });
    });

    it('simplifies result', () => {
      const result = multiplyFractions(
        { numerator: 2, denominator: 3 },
        { numerator: 3, denominator: 4 }
      );
      expect(result).toEqual({ numerator: 1, denominator: 2 });
    });

    it('handles whole number multiplication', () => {
      const result = multiplyFractions(
        { numerator: 3, denominator: 1 },
        { numerator: 1, denominator: 4 }
      );
      expect(result).toEqual({ numerator: 3, denominator: 4 });
    });
  });

  describe('divideFractions', () => {
    it('divides fractions', () => {
      const result = divideFractions(
        { numerator: 1, denominator: 2 },
        { numerator: 1, denominator: 4 }
      );
      expect(result).toEqual({ numerator: 2, denominator: 1 });
    });

    it('simplifies result', () => {
      const result = divideFractions(
        { numerator: 3, denominator: 4 },
        { numerator: 3, denominator: 8 }
      );
      expect(result).toEqual({ numerator: 2, denominator: 1 });
    });

    it('handles unit fraction divisor', () => {
      const result = divideFractions(
        { numerator: 1, denominator: 3 },
        { numerator: 1, denominator: 6 }
      );
      expect(result).toEqual({ numerator: 2, denominator: 1 });
    });
  });

  describe('toMixedNumber', () => {
    it('converts improper fraction to mixed number', () => {
      const result = toMixedNumber({ numerator: 7, denominator: 4 });
      expect(result).toEqual({
        whole: 1,
        fraction: { numerator: 3, denominator: 4 },
      });
    });

    it('handles exact whole numbers', () => {
      const result = toMixedNumber({ numerator: 8, denominator: 4 });
      expect(result).toEqual({
        whole: 2,
        fraction: { numerator: 0, denominator: 1 },
      });
    });

    it('returns null for proper fractions', () => {
      const result = toMixedNumber({ numerator: 3, denominator: 4 });
      expect(result).toBeNull();
    });

    it('simplifies the fractional part', () => {
      const result = toMixedNumber({ numerator: 10, denominator: 4 });
      expect(result).toEqual({
        whole: 2,
        fraction: { numerator: 1, denominator: 2 },
      });
    });
  });

  describe('toImproperFraction', () => {
    it('converts mixed number to improper fraction', () => {
      const result = toImproperFraction(1, { numerator: 3, denominator: 4 });
      expect(result).toEqual({ numerator: 7, denominator: 4 });
    });

    it('handles whole numbers', () => {
      const result = toImproperFraction(3, { numerator: 0, denominator: 1 });
      expect(result).toEqual({ numerator: 3, denominator: 1 });
    });

    it('handles various fractions', () => {
      const result = toImproperFraction(2, { numerator: 1, denominator: 3 });
      expect(result).toEqual({ numerator: 7, denominator: 3 });
    });
  });

  describe('formatFraction', () => {
    it('formats fractions as strings', () => {
      expect(formatFraction({ numerator: 3, denominator: 4 })).toBe('3/4');
      expect(formatFraction({ numerator: 1, denominator: 2 })).toBe('1/2');
      expect(formatFraction({ numerator: 7, denominator: 8 })).toBe('7/8');
    });

    it('formats whole numbers without denominator', () => {
      expect(formatFraction({ numerator: 5, denominator: 1 })).toBe('5');
      expect(formatFraction({ numerator: 10, denominator: 1 })).toBe('10');
    });
  });

  describe('formatMixedNumber', () => {
    it('formats mixed numbers', () => {
      expect(formatMixedNumber(1, { numerator: 3, denominator: 4 })).toBe('1 3/4');
      expect(formatMixedNumber(2, { numerator: 1, denominator: 2 })).toBe('2 1/2');
    });

    it('formats whole numbers only when fraction is zero', () => {
      expect(formatMixedNumber(3, { numerator: 0, denominator: 1 })).toBe('3');
    });

    it('formats fraction only when whole is zero', () => {
      expect(formatMixedNumber(0, { numerator: 3, denominator: 4 })).toBe('3/4');
    });
  });

  describe('parseFraction', () => {
    it('parses fraction strings', () => {
      expect(parseFraction('3/4')).toEqual({ numerator: 3, denominator: 4 });
      expect(parseFraction('1/2')).toEqual({ numerator: 1, denominator: 2 });
      expect(parseFraction('7/8')).toEqual({ numerator: 7, denominator: 8 });
    });

    it('handles whitespace', () => {
      expect(parseFraction('  3/4  ')).toEqual({ numerator: 3, denominator: 4 });
    });

    it('returns null for invalid format', () => {
      expect(parseFraction('3')).toBeNull();
      expect(parseFraction('invalid')).toBeNull();
      expect(parseFraction('3/4/5')).toBeNull();
    });

    it('returns null for zero denominator', () => {
      expect(parseFraction('3/0')).toBeNull();
    });

    it('returns null for non-numeric values', () => {
      expect(parseFraction('a/b')).toBeNull();
    });
  });

  describe('isProperFraction', () => {
    it('returns true for proper fractions', () => {
      expect(isProperFraction({ numerator: 1, denominator: 2 })).toBe(true);
      expect(isProperFraction({ numerator: 3, denominator: 4 })).toBe(true);
      expect(isProperFraction({ numerator: 7, denominator: 8 })).toBe(true);
    });

    it('returns false for improper fractions', () => {
      expect(isProperFraction({ numerator: 5, denominator: 4 })).toBe(false);
      expect(isProperFraction({ numerator: 3, denominator: 2 })).toBe(false);
    });

    it('returns false for equal numerator and denominator', () => {
      expect(isProperFraction({ numerator: 4, denominator: 4 })).toBe(false);
    });

    it('handles negative numerators', () => {
      expect(isProperFraction({ numerator: -1, denominator: 2 })).toBe(true);
      expect(isProperFraction({ numerator: -5, denominator: 4 })).toBe(false);
    });
  });

  describe('isImproperFraction', () => {
    it('returns true for improper fractions', () => {
      expect(isImproperFraction({ numerator: 5, denominator: 4 })).toBe(true);
      expect(isImproperFraction({ numerator: 3, denominator: 2 })).toBe(true);
    });

    it('returns true for equal numerator and denominator', () => {
      expect(isImproperFraction({ numerator: 4, denominator: 4 })).toBe(true);
    });

    it('returns false for proper fractions', () => {
      expect(isImproperFraction({ numerator: 1, denominator: 2 })).toBe(false);
      expect(isImproperFraction({ numerator: 3, denominator: 4 })).toBe(false);
    });
  });

  describe('randomProperFraction', () => {
    it('generates fractions with denominators from provided array', () => {
      const denominators = [2, 4, 8];

      for (let i = 0; i < 20; i++) {
        const fraction = randomProperFraction(denominators);
        expect(denominators).toContain(fraction.denominator);
      }
    });

    it('generates proper fractions', () => {
      const denominators = [2, 3, 4, 5, 6, 8, 10, 12];

      for (let i = 0; i < 20; i++) {
        const fraction = randomProperFraction(denominators);
        expect(fraction.numerator).toBeLessThan(fraction.denominator);
        expect(fraction.numerator).toBeGreaterThan(0);
      }
    });
  });

  describe('randomImproperFraction', () => {
    it('generates fractions with denominators from provided array', () => {
      const denominators = [2, 4, 8];

      for (let i = 0; i < 20; i++) {
        const fraction = randomImproperFraction(denominators);
        expect(denominators).toContain(fraction.denominator);
      }
    });

    it('generates improper fractions', () => {
      const denominators = [2, 3, 4, 5, 6, 8, 10, 12];

      for (let i = 0; i < 20; i++) {
        const fraction = randomImproperFraction(denominators);
        expect(fraction.numerator).toBeGreaterThan(fraction.denominator);
      }
    });

    it('respects maxWhole parameter', () => {
      const denominators = [4];

      for (let i = 0; i < 20; i++) {
        const fraction = randomImproperFraction(denominators, 2);
        // With maxWhole=2, max numerator is 2*4 + (4-1) = 11
        expect(fraction.numerator).toBeLessThanOrEqual(11);
      }
    });
  });

  describe('fractionsEqual', () => {
    it('returns true for equal fractions', () => {
      expect(
        fractionsEqual({ numerator: 1, denominator: 2 }, { numerator: 1, denominator: 2 })
      ).toBe(true);
    });

    it('returns true for equivalent fractions after simplification', () => {
      expect(
        fractionsEqual({ numerator: 2, denominator: 4 }, { numerator: 1, denominator: 2 })
      ).toBe(true);
      expect(
        fractionsEqual({ numerator: 3, denominator: 9 }, { numerator: 1, denominator: 3 })
      ).toBe(true);
    });

    it('returns false for different fractions', () => {
      expect(
        fractionsEqual({ numerator: 1, denominator: 2 }, { numerator: 1, denominator: 3 })
      ).toBe(false);
      expect(
        fractionsEqual({ numerator: 2, denominator: 5 }, { numerator: 3, denominator: 5 })
      ).toBe(false);
    });
  });

  describe('round-trip conversions', () => {
    it('toMixedNumber and toImproperFraction are inverses', () => {
      const improper: Fraction = { numerator: 11, denominator: 4 };
      const mixed = toMixedNumber(improper);

      if (mixed) {
        const backToImproper = toImproperFraction(mixed.whole, mixed.fraction);
        expect(fractionsEqual(improper, backToImproper)).toBe(true);
      }
    });

    it('format and parse are inverses', () => {
      const fractions: Fraction[] = [
        { numerator: 1, denominator: 2 },
        { numerator: 3, denominator: 4 },
        { numerator: 7, denominator: 8 },
      ];

      fractions.forEach((frac) => {
        const formatted = formatFraction(frac);
        const parsed = parseFraction(formatted);
        expect(parsed).toEqual(frac);
      });
    });

    it('fractionToDecimal and decimalToFraction are close inverses', () => {
      const fractions: Fraction[] = [
        { numerator: 1, denominator: 2 },
        { numerator: 1, denominator: 4 },
        { numerator: 3, denominator: 4 },
        { numerator: 2, denominator: 5 },
      ];

      fractions.forEach((frac) => {
        const decimal = fractionToDecimal(frac);
        const backToFraction = decimalToFraction(decimal);
        expect(fractionsEqual(frac, backToFraction)).toBe(true);
      });
    });
  });
});
