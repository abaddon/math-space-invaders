// Math Problem Generator

import type { MathProblem, MathOperation, AnswerBlock } from './types';

const randomInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

function getMaxRange(level: number): number {
  if (level <= 2) return 10;
  if (level <= 4) return 15;
  if (level <= 6) return 20;
  return Math.min(30, 10 + level * 2);
}

function getAvailableOperations(level: number): MathOperation[] {
  if (level <= 1) return ['addition'];
  if (level <= 2) return ['addition', 'subtraction'];
  if (level <= 4) return ['addition', 'subtraction', 'multiplication'];
  return ['addition', 'subtraction', 'multiplication', 'division'];
}

export function generateMathProblem(level: number): MathProblem {
  const availableOps = getAvailableOperations(level);
  const operation = availableOps[randomInt(0, availableOps.length - 1)];
  const maxRange = getMaxRange(level);

  let operand1: number, operand2: number, correctAnswer: number, displayString: string;

  switch (operation) {
    case 'addition':
      operand1 = randomInt(1, maxRange);
      operand2 = randomInt(1, maxRange);
      correctAnswer = operand1 + operand2;
      displayString = `${operand1} + ${operand2} = ?`;
      break;

    case 'subtraction':
      operand1 = randomInt(2, maxRange);
      operand2 = randomInt(1, operand1 - 1);
      correctAnswer = operand1 - operand2;
      displayString = `${operand1} - ${operand2} = ?`;
      break;

    case 'multiplication':
      const multMax = Math.min(12, Math.max(5, Math.floor(maxRange / 2)));
      operand1 = randomInt(2, multMax);
      operand2 = randomInt(2, multMax);
      correctAnswer = operand1 * operand2;
      displayString = `${operand1} × ${operand2} = ?`;
      break;

    case 'division':
      operand2 = randomInt(2, Math.min(10, maxRange));
      correctAnswer = randomInt(2, Math.min(10, maxRange));
      operand1 = operand2 * correctAnswer;
      displayString = `${operand1} ÷ ${operand2} = ?`;
      break;

    default:
      operand1 = randomInt(1, 10);
      operand2 = randomInt(1, 10);
      correctAnswer = operand1 + operand2;
      displayString = `${operand1} + ${operand2} = ?`;
  }

  return { operand1, operand2, operation, correctAnswer, displayString };
}

function generateWrongAnswers(correctAnswer: number): number[] {
  const wrongAnswers: number[] = [];
  const maxOffset = Math.max(5, Math.floor(correctAnswer * 0.3)) + 3;

  while (wrongAnswers.length < 2) {
    let offset = randomInt(-maxOffset, maxOffset);
    if (offset === 0) offset = randomInt(1, 3);
    const wrongAnswer = correctAnswer + offset;

    if (wrongAnswer > 0 && wrongAnswer !== correctAnswer && !wrongAnswers.includes(wrongAnswer)) {
      wrongAnswers.push(wrongAnswer);
    }
  }

  return wrongAnswers;
}

export function generateAnswerBlocks(
  correctAnswer: number,
  canvasWidth: number,
  blockWidth: number,
  startY: number
): AnswerBlock[] {
  const wrongAnswers = generateWrongAnswers(correctAnswer);
  const allAnswers = [correctAnswer, ...wrongAnswers];

  // Shuffle
  for (let i = allAnswers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allAnswers[i], allAnswers[j]] = [allAnswers[j], allAnswers[i]];
  }

  const padding = 30;
  const spacing = (canvasWidth - padding * 2 - blockWidth * 3) / 2;

  return allAnswers.map((value, index) => ({
    id: `answer-${index}-${Date.now()}`,
    value,
    isCorrect: value === correctAnswer,
    x: padding + index * (blockWidth + spacing) + blockWidth / 2,
    y: startY,
  }));
}
