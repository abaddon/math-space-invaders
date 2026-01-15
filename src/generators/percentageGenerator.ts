// Percentage Generator
// Generates percentage problems in two formats:
// - Find percentage of number (What is 25% of 80?)
// - Find what percentage (20 is what % of 80?)

import type { MathProblem } from '../types';
import { DIFFICULTY_CONFIG } from '../config/difficultyConfig';

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
 * Generate "What is X% of Y?" problem
 */
function generateFindPercentageOfProblem(): MathProblem {
  const percentages = DIFFICULTY_CONFIG.PERCENTAGE_CONFIG.commonPercentages;
  const percentage = percentages[randomInt(0, percentages.length - 1)];

  // Generate a base number that gives a clean result
  // The result should be a whole number
  let baseNumber: number;
  let answer: number;

  // Find a base number that gives clean result
  const factor = 100 / percentage;

  if (Number.isInteger(factor)) {
    // percentage divides 100 evenly
    baseNumber = factor * randomInt(1, 20);
    answer = (percentage * baseNumber) / 100;
  } else {
    // Use multiples to ensure clean answer
    const multiplier = randomInt(1, 10);
    answer = multiplier * (percentage <= 50 ? 1 : Math.ceil(percentage / 10));
    baseNumber = (answer * 100) / percentage;

    // If baseNumber isn't clean, try again with simpler numbers
    if (!Number.isInteger(baseNumber)) {
      baseNumber = 100 * randomInt(1, 5);
      answer = (percentage * baseNumber) / 100;
    }
  }

  return {
    operand1: percentage,
    operand2: baseNumber,
    operation: 'percentage',
    correctAnswer: answer,
    numericAnswer: answer,
    displayString: `What is ${percentage}% of ${baseNumber}?`,
    answerFormat: 'number'
  };
}

/**
 * Generate "X is what % of Y?" problem
 */
function generateFindWhatPercentProblem(): MathProblem {
  const percentages = DIFFICULTY_CONFIG.PERCENTAGE_CONFIG.commonPercentages;
  const percentage = percentages[randomInt(0, percentages.length - 1)];

  // Generate base and part that result in clean percentage
  const baseNumber = randomInt(2, 20) * 10; // 20, 30, ... 200
  const part = (percentage * baseNumber) / 100;

  return {
    operand1: part,
    operand2: baseNumber,
    operation: 'percentage',
    correctAnswer: percentage,
    numericAnswer: percentage,
    displayString: `${part} is what % of ${baseNumber}?`,
    answerFormat: 'percentage'
  };
}

/**
 * Generate a percentage problem
 */
export function generatePercentageProblem(): MathProblem {
  const weights = DIFFICULTY_CONFIG.PERCENTAGE_CONFIG.typeWeights;
  const type = selectProblemType(weights);

  switch (type) {
    case 'findPercentageOf':
      return generateFindPercentageOfProblem();
    case 'findWhatPercent':
      return generateFindWhatPercentProblem();
    default:
      return generateFindPercentageOfProblem();
  }
}

/**
 * Generate wrong answers for percentage problems
 */
export function generatePercentageWrongAnswers(
  correctAnswer: number,
  problem: MathProblem
): number[] {
  const wrongAnswers: number[] = [];

  // Common percentage mistakes
  const commonMistakes: number[] = [];

  if (problem.displayString.includes('what %')) {
    // For "what % of" problems, common mistakes are nearby percentages
    const percentages = DIFFICULTY_CONFIG.PERCENTAGE_CONFIG.commonPercentages;
    for (const p of percentages) {
      if (p !== correctAnswer && Math.abs(p - correctAnswer) <= 25) {
        commonMistakes.push(p);
      }
    }
    // Also add half and double
    commonMistakes.push(correctAnswer * 2);
    commonMistakes.push(Math.floor(correctAnswer / 2));
  } else {
    // For "X% of Y" problems
    const operand2 = typeof problem.operand2 === 'number' ? problem.operand2 : 0;
    // Common mistake: forgetting to divide by 100
    if (typeof problem.operand1 === 'number') {
      commonMistakes.push(problem.operand1 * operand2); // Forgot /100
    }
    // Off by factor of 10
    commonMistakes.push(correctAnswer * 10);
    commonMistakes.push(Math.floor(correctAnswer / 10));
    // Nearby values
    commonMistakes.push(correctAnswer + 5);
    commonMistakes.push(correctAnswer - 5);
    commonMistakes.push(correctAnswer + 10);
    commonMistakes.push(correctAnswer - 10);
  }

  // Add valid common mistakes
  for (const mistake of commonMistakes) {
    if (mistake > 0 && mistake !== correctAnswer && !wrongAnswers.includes(mistake)) {
      wrongAnswers.push(mistake);
      if (wrongAnswers.length >= 2) break;
    }
  }

  // Fill with random offsets if needed
  let attempts = 0;
  while (wrongAnswers.length < 2 && attempts < 50) {
    attempts++;
    const offset = randomInt(-20, 20);
    if (offset === 0) continue;

    const wrong = correctAnswer + offset;
    if (wrong > 0 && wrong !== correctAnswer && !wrongAnswers.includes(wrong)) {
      wrongAnswers.push(wrong);
    }
  }

  // Fallback
  while (wrongAnswers.length < 2) {
    const fallback = correctAnswer + wrongAnswers.length + 1;
    if (!wrongAnswers.includes(fallback)) {
      wrongAnswers.push(fallback);
    }
  }

  return wrongAnswers.slice(0, 2);
}
