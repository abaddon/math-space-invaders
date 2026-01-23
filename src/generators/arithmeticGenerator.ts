// Arithmetic Generator - Addition, Subtraction, Multiplication, Division
// Handles basic arithmetic operations with configurable digit ranges

import type { MathProblem, DigitType, OperationCategory } from '../types';
import { DIFFICULTY_CONFIG } from '../config/difficultyConfig';

/**
 * Generate a random integer between min and max (inclusive)
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate an addition problem
 */
export function generateAdditionProblem(digitType: DigitType): MathProblem {
  const range = DIFFICULTY_CONFIG.DIGIT_RANGES[digitType];
  const operand1 = randomInt(range.min, range.max);
  const operand2 = randomInt(range.min, range.max);
  const answer = operand1 + operand2;

  return {
    operand1,
    operand2,
    operation: 'addition',
    correctAnswer: answer,
    numericAnswer: answer,
    displayString: `${operand1} + ${operand2} = ?`,
    answerFormat: 'number'
  };
}

/**
 * Generate a subtraction problem
 * Ensures result is always positive
 */
export function generateSubtractionProblem(digitType: DigitType): MathProblem {
  const range = DIFFICULTY_CONFIG.DIGIT_RANGES[digitType];

  // Generate two numbers and ensure larger - smaller
  const num1 = randomInt(range.min, range.max);
  const num2 = randomInt(range.min, range.max);

  // Ensure num1 >= num2 for positive result
  const operand1 = Math.max(num1, num2);
  const operand2 = Math.min(num1, num2);

  // Avoid same numbers (result would be 0)
  if (operand1 === operand2) {
    return generateSubtractionProblem(digitType);
  }

  const answer = operand1 - operand2;

  return {
    operand1,
    operand2,
    operation: 'subtraction',
    correctAnswer: answer,
    numericAnswer: answer,
    displayString: `${operand1} - ${operand2} = ?`,
    answerFormat: 'number'
  };
}

/**
 * Generate a multiplication problem
 * Uses limits to keep answers reasonable
 */
export function generateMultiplicationProblem(digitType: DigitType): MathProblem {
  const limits = DIFFICULTY_CONFIG.MULTIPLICATION_LIMITS[digitType];

  // For single digits, both factors can be full range
  // For double/triple, keep one factor small for reasonable answers
  let operand1: number;
  let operand2: number;

  if (digitType === 'single') {
    operand1 = randomInt(2, limits.factor1Max);
    operand2 = randomInt(2, limits.factor2Max);
  } else {
    // Keep one factor small (2-12), let other be larger
    operand1 = randomInt(2, limits.factor1Max);
    const range = DIFFICULTY_CONFIG.DIGIT_RANGES[digitType];
    operand2 = randomInt(range.min, Math.min(range.max, limits.factor2Max));
  }

  const answer = operand1 * operand2;

  return {
    operand1,
    operand2,
    operation: 'multiplication',
    correctAnswer: answer,
    numericAnswer: answer,
    displayString: `${operand1} × ${operand2} = ?`,
    answerFormat: 'number'
  };
}

/**
 * Generate a division problem
 * Always results in whole number
 */
export function generateDivisionProblem(digitType: DigitType): MathProblem {
  const limits = DIFFICULTY_CONFIG.DIVISION_LIMITS[digitType];

  // Generate divisor and quotient, then calculate dividend
  const divisor = randomInt(2, limits.divisorMax);

  // For single digits, quotient is small
  // For double/triple, quotient can be larger
  let quotient: number;
  if (digitType === 'single') {
    quotient = randomInt(2, limits.quotientMax);
  } else {
    const range = DIFFICULTY_CONFIG.DIGIT_RANGES[digitType];
    quotient = randomInt(2, Math.min(range.max, limits.quotientMax));
  }

  const dividend = divisor * quotient;

  return {
    operand1: dividend,
    operand2: divisor,
    operation: 'division',
    correctAnswer: quotient,
    numericAnswer: quotient,
    displayString: `${dividend} ÷ ${divisor} = ?`,
    answerFormat: 'number'
  };
}

/**
 * Generate an arithmetic problem based on operation type
 */
export function generateArithmeticProblem(
  operation: OperationCategory,
  digitType: DigitType
): MathProblem {
  switch (operation) {
    case 'addition':
      return generateAdditionProblem(digitType);
    case 'subtraction':
      return generateSubtractionProblem(digitType);
    case 'multiplication':
      return generateMultiplicationProblem(digitType);
    case 'division':
      return generateDivisionProblem(digitType);
    default:
      return generateAdditionProblem(digitType);
  }
}

/**
 * Generate wrong answers for an arithmetic problem
 * Creates plausible wrong answers close to the correct one
 */
export function generateArithmeticWrongAnswers(
  correctAnswer: number,
  operation: OperationCategory
): number[] {
  const wrongAnswers: number[] = [];

  // Calculate offset range based on answer size
  const maxOffset = Math.max(5, Math.floor(Math.abs(correctAnswer) * 0.3)) + 3;

  // For multiplication/division, common mistakes
  const commonMistakes: number[] = [];
  if (operation === 'multiplication') {
    // Off by one in one factor
    commonMistakes.push(correctAnswer + Math.ceil(correctAnswer * 0.1));
    commonMistakes.push(correctAnswer - Math.ceil(correctAnswer * 0.1));
  } else if (operation === 'division') {
    // Common division errors
    commonMistakes.push(correctAnswer + 1);
    commonMistakes.push(correctAnswer - 1);
    commonMistakes.push(correctAnswer * 2);
  }

  // Add common mistakes first if valid
  for (const mistake of commonMistakes) {
    if (mistake > 0 && mistake !== correctAnswer && !wrongAnswers.includes(mistake)) {
      wrongAnswers.push(mistake);
      if (wrongAnswers.length >= 2) break;
    }
  }

  // Fill remaining with random offsets
  let attempts = 0;
  while (wrongAnswers.length < 2 && attempts < 50) {
    attempts++;
    let offset = randomInt(-maxOffset, maxOffset);
    if (offset === 0) offset = randomInt(1, 3);

    const wrongAnswer = correctAnswer + offset;

    if (wrongAnswer > 0 && wrongAnswer !== correctAnswer && !wrongAnswers.includes(wrongAnswer)) {
      wrongAnswers.push(wrongAnswer);
    }
  }

  // Fallback if still not enough
  while (wrongAnswers.length < 2) {
    const fallback = correctAnswer + wrongAnswers.length + 1;
    if (!wrongAnswers.includes(fallback) && fallback !== correctAnswer) {
      wrongAnswers.push(fallback);
    }
  }

  return wrongAnswers;
}
