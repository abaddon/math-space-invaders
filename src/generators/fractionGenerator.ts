// Fraction Generator - Proper and Improper Fractions
// Generates fraction problems in multiple formats:
// - Arithmetic (a/b + c/d)
// - Simplification (Simplify 6/8)
// - Of a number (1/2 of 16)
// - Mixed number conversions

import type { MathProblem, Fraction } from '../types';
import { DIFFICULTY_CONFIG } from '../config/difficultyConfig';
import {
  randomProperFraction,
  randomImproperFraction,
  addFractions,
  subtractFractions,
  simplifyFraction,
  formatFraction,
  formatMixedNumber,
  toMixedNumber,
  toImproperFraction,
  fractionToDecimal
} from '../utils/fractionUtils';

/**
 * Generate a random integer between min and max (inclusive)
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Select a random problem type based on weights
 */
function selectProblemType(weights: Record<string, number>): string {
  const entries = Object.entries(weights);
  const totalWeight = entries.reduce((sum, [, w]) => sum + w, 0);
  let random = Math.random() * totalWeight;

  for (const [type, weight] of entries) {
    random -= weight;
    if (random <= 0) return type;
  }

  return entries[0][0];
}

/**
 * Generate a fraction arithmetic problem (addition or subtraction)
 */
function generateFractionArithmeticProblem(
  isProper: boolean
): MathProblem {
  const denominators = DIFFICULTY_CONFIG.FRACTION_CONFIG.denominators;

  // Generate two fractions with compatible denominators for cleaner results
  // Pick denominators that share common factors
  const denom1 = denominators[randomInt(0, denominators.length - 1)];
  const compatibleDenoms = denominators.filter(d => d === denom1 || d % denom1 === 0 || denom1 % d === 0);
  const denom2 = compatibleDenoms[randomInt(0, compatibleDenoms.length - 1)];

  let frac1: Fraction;
  let frac2: Fraction;

  if (isProper) {
    frac1 = { numerator: randomInt(1, denom1 - 1), denominator: denom1 };
    frac2 = { numerator: randomInt(1, denom2 - 1), denominator: denom2 };
  } else {
    // For improper fractions, at least one should be improper
    frac1 = randomImproperFraction([denom1], 3);
    frac2 = randomProperFraction([denom2]);
  }

  // Randomly choose addition or subtraction
  const isAddition = Math.random() < 0.5;
  let result: Fraction;
  let displayOp: string;

  if (isAddition) {
    result = addFractions(frac1, frac2);
    displayOp = '+';
  } else {
    // Ensure positive result for subtraction
    const val1 = fractionToDecimal(frac1);
    const val2 = fractionToDecimal(frac2);
    if (val1 < val2) {
      [frac1, frac2] = [frac2, frac1];
    }
    result = subtractFractions(frac1, frac2);
    displayOp = '-';
  }

  const simplified = simplifyFraction(result);
  const numericAnswer = fractionToDecimal(simplified);

  // Format answer - show as simplified fraction or whole number
  let correctAnswer: string;
  if (simplified.denominator === 1) {
    correctAnswer = simplified.numerator.toString();
  } else {
    correctAnswer = formatFraction(simplified);
  }

  return {
    operand1: formatFraction(frac1),
    operand2: formatFraction(frac2),
    operation: isProper ? 'fraction' : 'improperFraction',
    correctAnswer,
    numericAnswer,
    displayString: `${formatFraction(frac1)} ${displayOp} ${formatFraction(frac2)} = ?`,
    answerFormat: simplified.denominator === 1 ? 'number' : 'fraction'
  };
}

/**
 * Generate a simplification problem
 */
function generateSimplificationProblem(): MathProblem {
  const denominators = DIFFICULTY_CONFIG.FRACTION_CONFIG.denominators;

  // Pick a denominator and create an unsimplified fraction
  const targetDenom = denominators[randomInt(0, denominators.length - 1)];
  const targetNumer = randomInt(1, targetDenom - 1);

  // Multiply by a factor to create unsimplified version
  const factor = randomInt(2, 4);
  const unsimplifiedNumer = targetNumer * factor;
  const unsimplifiedDenom = targetDenom * factor;

  const unsimplified: Fraction = { numerator: unsimplifiedNumer, denominator: unsimplifiedDenom };
  const simplified = simplifyFraction(unsimplified);
  const numericAnswer = fractionToDecimal(simplified);

  return {
    operand1: formatFraction(unsimplified),
    operation: 'fraction',
    correctAnswer: formatFraction(simplified),
    numericAnswer,
    displayString: `Simplify ${formatFraction(unsimplified)} = ?`,
    answerFormat: 'fraction'
  };
}

/**
 * Generate "X of Y" problem (e.g., 1/2 of 16)
 */
function generateOfNumberProblem(): MathProblem {
  const denominators = DIFFICULTY_CONFIG.FRACTION_CONFIG.denominators;
  const denom = denominators[randomInt(0, denominators.length - 1)];
  const numer = randomInt(1, denom - 1);

  // Generate a number that divides evenly
  const multiplier = randomInt(2, 10);
  const wholeNumber = denom * multiplier;

  const answer = (numer * wholeNumber) / denom;
  const fraction: Fraction = { numerator: numer, denominator: denom };

  return {
    operand1: formatFraction(fraction),
    operand2: wholeNumber,
    operation: 'fraction',
    correctAnswer: answer,
    numericAnswer: answer,
    displayString: `${formatFraction(fraction)} of ${wholeNumber} = ?`,
    answerFormat: 'number'
  };
}

/**
 * Generate mixed number to improper fraction conversion
 */
function generateMixedToImproperProblem(): MathProblem {
  const denominators = DIFFICULTY_CONFIG.FRACTION_CONFIG.denominators;
  const denom = denominators[randomInt(0, denominators.length - 1)];
  const numer = randomInt(1, denom - 1);
  const whole = randomInt(1, 5);

  const improper = toImproperFraction(whole, { numerator: numer, denominator: denom });
  const numericAnswer = fractionToDecimal(improper);

  return {
    operand1: formatMixedNumber(whole, { numerator: numer, denominator: denom }),
    operation: 'improperFraction',
    correctAnswer: formatFraction(improper),
    numericAnswer,
    displayString: `Convert ${formatMixedNumber(whole, { numerator: numer, denominator: denom })} to improper = ?`,
    answerFormat: 'fraction'
  };
}

/**
 * Generate improper fraction to mixed number conversion
 */
function generateImproperToMixedProblem(): MathProblem {
  const denominators = DIFFICULTY_CONFIG.FRACTION_CONFIG.denominators;
  const denom = denominators[randomInt(0, denominators.length - 1)];
  const whole = randomInt(1, 5);
  const remainder = randomInt(1, denom - 1);
  const numer = whole * denom + remainder;

  const improper: Fraction = { numerator: numer, denominator: denom };
  const mixed = toMixedNumber(improper);
  const numericAnswer = fractionToDecimal(improper);

  if (!mixed) {
    // Fallback if conversion fails
    return generateFractionArithmeticProblem(false);
  }

  const correctAnswer = formatMixedNumber(mixed.whole, mixed.fraction);

  return {
    operand1: formatFraction(improper),
    operation: 'improperFraction',
    correctAnswer,
    numericAnswer,
    displayString: `Convert ${formatFraction(improper)} to mixed = ?`,
    answerFormat: 'mixed'
  };
}

/**
 * Generate a proper fraction problem
 */
export function generateProperFractionProblem(): MathProblem {
  const weights = DIFFICULTY_CONFIG.FRACTION_CONFIG.typeWeights;
  const type = selectProblemType(weights);

  switch (type) {
    case 'arithmetic':
      return generateFractionArithmeticProblem(true);
    case 'simplification':
      return generateSimplificationProblem();
    case 'ofNumber':
      return generateOfNumberProblem();
    default:
      return generateFractionArithmeticProblem(true);
  }
}

/**
 * Generate an improper fraction problem
 */
export function generateImproperFractionProblem(): MathProblem {
  // Mix of arithmetic and conversions
  const rand = Math.random();

  if (rand < 0.4) {
    return generateFractionArithmeticProblem(false);
  } else if (rand < 0.7) {
    return generateMixedToImproperProblem();
  } else {
    return generateImproperToMixedProblem();
  }
}

/**
 * Generate wrong answers for fraction problems
 */
export function generateFractionWrongAnswers(
  correctAnswer: number | string,
  _numericAnswer: number
): (number | string)[] {
  const wrongAnswers: (number | string)[] = [];

  // If answer is a whole number
  if (typeof correctAnswer === 'number' || !correctAnswer.includes('/')) {
    const numeric = typeof correctAnswer === 'number' ? correctAnswer : parseFloat(correctAnswer);
    const maxOffset = Math.max(3, Math.floor(numeric * 0.2)) + 1;

    let attempts = 0;
    while (wrongAnswers.length < 2 && attempts < 50) {
      attempts++;
      let offset = randomInt(-maxOffset, maxOffset);
      if (offset === 0) offset = randomInt(1, 2);
      const wrong = numeric + offset;
      if (wrong > 0 && wrong !== numeric && !wrongAnswers.includes(wrong)) {
        wrongAnswers.push(wrong);
      }
    }
  } else {
    // Answer is a fraction - generate plausible wrong fractions
    const parts = correctAnswer.split('/');
    const numer = parseInt(parts[0]);
    const denom = parseInt(parts[1]);

    // Common mistakes: wrong numerator, wrong denominator, unsimplified
    const mistakes = [
      `${numer + 1}/${denom}`,
      `${numer - 1}/${denom}`,
      `${numer}/${denom + 1}`,
      `${numer}/${denom - 1}`,
      `${numer * 2}/${denom * 2}`, // Unsimplified
    ].filter(m => {
      const p = m.split('/');
      return parseInt(p[0]) > 0 && parseInt(p[1]) > 0 && m !== correctAnswer;
    });

    for (const mistake of mistakes) {
      if (!wrongAnswers.includes(mistake)) {
        wrongAnswers.push(mistake);
        if (wrongAnswers.length >= 2) break;
      }
    }

    // Fallback to numeric offsets
    while (wrongAnswers.length < 2) {
      const offset = wrongAnswers.length + 1;
      wrongAnswers.push(`${numer + offset}/${denom}`);
    }
  }

  return wrongAnswers.slice(0, 2);
}
