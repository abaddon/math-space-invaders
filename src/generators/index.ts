// Main Generator Orchestrator
// Coordinates all specialized generators based on level configuration

import type { MathProblem, AnswerBlock, OperationCategory, LevelConfig } from '../types';
import { getLevelConfig, selectRandomOperation } from '../utils/levelUtils';
import {
  generateArithmeticProblem,
  generateArithmeticWrongAnswers
} from './arithmeticGenerator';
import {
  generateProperFractionProblem,
  generateImproperFractionProblem,
  generateFractionWrongAnswers
} from './fractionGenerator';
import {
  generatePercentageProblem,
  generatePercentageWrongAnswers
} from './percentageGenerator';
import {
  generateMetricConversionProblem,
  generateMetricWrongAnswers
} from './metricGenerator';

/**
 * Generate a math problem for the given level
 * Automatically selects appropriate operation and difficulty
 */
export function generateProblem(level: number): MathProblem {
  const config = getLevelConfig(level);
  const operation = selectRandomOperation(config.operations);

  return generateProblemForOperation(operation, config);
}

/**
 * Generate a problem for a specific operation
 */
export function generateProblemForOperation(
  operation: OperationCategory,
  config: LevelConfig
): MathProblem {
  switch (operation) {
    case 'addition':
    case 'subtraction':
    case 'multiplication':
    case 'division':
      return generateArithmeticProblem(operation, config.digitType);

    case 'fraction':
      return generateProperFractionProblem();

    case 'improperFraction':
      return generateImproperFractionProblem();

    case 'percentage':
      return generatePercentageProblem();

    case 'metricConversion':
      return generateMetricConversionProblem();

    default:
      // Fallback to addition
      return generateArithmeticProblem('addition', config.digitType);
  }
}

/**
 * Generate wrong answers for a problem
 */
export function generateWrongAnswers(problem: MathProblem): (number | string)[] {
  switch (problem.operation) {
    case 'addition':
    case 'subtraction':
    case 'multiplication':
    case 'division':
      return generateArithmeticWrongAnswers(problem.numericAnswer, problem.operation);

    case 'fraction':
    case 'improperFraction':
      return generateFractionWrongAnswers(problem.correctAnswer, problem.numericAnswer);

    case 'percentage':
      return generatePercentageWrongAnswers(problem.numericAnswer, problem);

    case 'metricConversion':
      return generateMetricWrongAnswers(problem.numericAnswer, problem);

    default:
      return generateArithmeticWrongAnswers(problem.numericAnswer, 'addition');
  }
}

/**
 * Generate answer blocks for a problem
 * Includes correct answer and wrong answers, shuffled
 */
export function generateAnswerBlocks(
  problem: MathProblem,
  canvasWidth: number,
  blockWidth: number,
  startY: number
): AnswerBlock[] {
  const wrongAnswers = generateWrongAnswers(problem);

  // Build all answers array
  const allAnswers: { value: number | string; numericValue: number; isCorrect: boolean }[] = [
    {
      value: problem.correctAnswer,
      numericValue: problem.numericAnswer,
      isCorrect: true
    },
    ...wrongAnswers.map((wrong, index) => ({
      value: wrong,
      numericValue: typeof wrong === 'number' ? wrong : parseFloat(wrong.toString().replace(/[^\d.-]/g, '')) || index + 1,
      isCorrect: false
    }))
  ];

  // Shuffle answers
  for (let i = allAnswers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allAnswers[i], allAnswers[j]] = [allAnswers[j], allAnswers[i]];
  }

  // Calculate positions
  const padding = 30;
  const numBlocks = allAnswers.length;
  const spacing = (canvasWidth - padding * 2 - blockWidth * numBlocks) / (numBlocks - 1);

  return allAnswers.map((answer, index) => ({
    id: `answer-${index}-${Date.now()}`,
    value: answer.value,
    numericValue: answer.numericValue,
    isCorrect: answer.isCorrect,
    x: padding + index * (blockWidth + spacing) + blockWidth / 2,
    y: startY,
    answerFormat: problem.answerFormat
  }));
}

/**
 * Get level configuration (re-export for convenience)
 */
export { getLevelConfig } from '../utils/levelUtils';

/**
 * Calculate fall speed for time-based difficulty (re-export)
 */
export { calculateFallSpeed, calculateTimeForLevel } from '../utils/levelUtils';
