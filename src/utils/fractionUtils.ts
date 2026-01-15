// Fraction Utilities - Math operations for fractions
// Provides GCD, simplification, and fraction arithmetic

import type { Fraction } from '../types';

/**
 * Calculate Greatest Common Divisor using Euclidean algorithm
 */
export function gcd(a: number, b: number): number {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  while (b !== 0) {
    const temp = b;
    b = a % b;
    a = temp;
  }
  return a;
}

/**
 * Calculate Least Common Multiple
 */
export function lcm(a: number, b: number): number {
  return Math.abs(a * b) / gcd(a, b);
}

/**
 * Simplify a fraction to lowest terms
 */
export function simplifyFraction(fraction: Fraction): Fraction {
  const divisor = gcd(fraction.numerator, fraction.denominator);
  return {
    numerator: fraction.numerator / divisor,
    denominator: fraction.denominator / divisor
  };
}

/**
 * Convert a fraction to its decimal value
 */
export function fractionToDecimal(fraction: Fraction): number {
  return fraction.numerator / fraction.denominator;
}

/**
 * Convert a decimal to a fraction (approximate)
 * Uses continued fraction algorithm for clean results
 */
export function decimalToFraction(decimal: number, maxDenominator: number = 100): Fraction {
  if (Number.isInteger(decimal)) {
    return { numerator: decimal, denominator: 1 };
  }

  let bestNumerator = 1;
  let bestDenominator = 1;
  let bestError = Math.abs(decimal - 1);

  for (let d = 1; d <= maxDenominator; d++) {
    const n = Math.round(decimal * d);
    const error = Math.abs(decimal - n / d);
    if (error < bestError) {
      bestError = error;
      bestNumerator = n;
      bestDenominator = d;
    }
    if (error === 0) break;
  }

  return simplifyFraction({ numerator: bestNumerator, denominator: bestDenominator });
}

/**
 * Add two fractions
 */
export function addFractions(a: Fraction, b: Fraction): Fraction {
  const commonDenom = lcm(a.denominator, b.denominator);
  const newNumerator =
    (a.numerator * (commonDenom / a.denominator)) +
    (b.numerator * (commonDenom / b.denominator));

  return simplifyFraction({
    numerator: newNumerator,
    denominator: commonDenom
  });
}

/**
 * Subtract two fractions (a - b)
 */
export function subtractFractions(a: Fraction, b: Fraction): Fraction {
  const commonDenom = lcm(a.denominator, b.denominator);
  const newNumerator =
    (a.numerator * (commonDenom / a.denominator)) -
    (b.numerator * (commonDenom / b.denominator));

  return simplifyFraction({
    numerator: newNumerator,
    denominator: commonDenom
  });
}

/**
 * Multiply two fractions
 */
export function multiplyFractions(a: Fraction, b: Fraction): Fraction {
  return simplifyFraction({
    numerator: a.numerator * b.numerator,
    denominator: a.denominator * b.denominator
  });
}

/**
 * Divide two fractions (a / b)
 */
export function divideFractions(a: Fraction, b: Fraction): Fraction {
  return simplifyFraction({
    numerator: a.numerator * b.denominator,
    denominator: a.denominator * b.numerator
  });
}

/**
 * Convert improper fraction to mixed number
 */
export function toMixedNumber(fraction: Fraction): { whole: number; fraction: Fraction } | null {
  if (Math.abs(fraction.numerator) < fraction.denominator) {
    // Already proper fraction
    return null;
  }

  const whole = Math.floor(fraction.numerator / fraction.denominator);
  const remainder = fraction.numerator % fraction.denominator;

  if (remainder === 0) {
    return { whole, fraction: { numerator: 0, denominator: 1 } };
  }

  return {
    whole,
    fraction: simplifyFraction({ numerator: remainder, denominator: fraction.denominator })
  };
}

/**
 * Convert mixed number to improper fraction
 */
export function toImproperFraction(whole: number, fraction: Fraction): Fraction {
  return {
    numerator: whole * fraction.denominator + fraction.numerator,
    denominator: fraction.denominator
  };
}

/**
 * Format a fraction as a display string
 */
export function formatFraction(fraction: Fraction): string {
  if (fraction.denominator === 1) {
    return fraction.numerator.toString();
  }
  return `${fraction.numerator}/${fraction.denominator}`;
}

/**
 * Format a mixed number as a display string
 */
export function formatMixedNumber(whole: number, fraction: Fraction): string {
  if (fraction.numerator === 0) {
    return whole.toString();
  }
  if (whole === 0) {
    return formatFraction(fraction);
  }
  return `${whole} ${formatFraction(fraction)}`;
}

/**
 * Parse a fraction string like "3/4" into a Fraction object
 */
export function parseFraction(str: string): Fraction | null {
  const parts = str.trim().split('/');
  if (parts.length !== 2) return null;

  const numerator = parseInt(parts[0], 10);
  const denominator = parseInt(parts[1], 10);

  if (isNaN(numerator) || isNaN(denominator) || denominator === 0) {
    return null;
  }

  return { numerator, denominator };
}

/**
 * Check if a fraction is proper (numerator < denominator)
 */
export function isProperFraction(fraction: Fraction): boolean {
  return Math.abs(fraction.numerator) < fraction.denominator;
}

/**
 * Check if a fraction is improper (numerator >= denominator)
 */
export function isImproperFraction(fraction: Fraction): boolean {
  return Math.abs(fraction.numerator) >= fraction.denominator;
}

/**
 * Generate a random proper fraction with given denominator options
 */
export function randomProperFraction(denominators: number[]): Fraction {
  const denominator = denominators[Math.floor(Math.random() * denominators.length)];
  const numerator = Math.floor(Math.random() * (denominator - 1)) + 1;
  return { numerator, denominator };
}

/**
 * Generate a random improper fraction
 */
export function randomImproperFraction(denominators: number[], maxWhole: number = 5): Fraction {
  const denominator = denominators[Math.floor(Math.random() * denominators.length)];
  const whole = Math.floor(Math.random() * maxWhole) + 1;
  const remainder = Math.floor(Math.random() * (denominator - 1)) + 1;
  const numerator = whole * denominator + remainder;
  return { numerator, denominator };
}

/**
 * Check if two fractions are equal (after simplification)
 */
export function fractionsEqual(a: Fraction, b: Fraction): boolean {
  const simplifiedA = simplifyFraction(a);
  const simplifiedB = simplifyFraction(b);
  return simplifiedA.numerator === simplifiedB.numerator &&
         simplifiedA.denominator === simplifiedB.denominator;
}
