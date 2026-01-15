// Metric Conversion Generator
// Generates problems for converting between metric units:
// - Length: km, m, cm, mm
// - Weight: kg, g, mg
// - Volume: L, mL
// - Area: km², m², cm²

import type { MathProblem } from '../types';
import { DIFFICULTY_CONFIG } from '../config/difficultyConfig';

/**
 * Generate a random integer between min and max (inclusive)
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Get a random enabled conversion type
 */
function getRandomConversion(): {
  key: string;
  factor: number;
  fromUnit: string;
  toUnit: string;
} {
  const config = DIFFICULTY_CONFIG.METRIC_CONFIG;
  const enabled = config.enabledConversions;
  const key = enabled[randomInt(0, enabled.length - 1)];
  const conversion = config.conversions[key];

  return {
    key,
    factor: conversion.factor,
    fromUnit: conversion.display[0],
    toUnit: conversion.display[1]
  };
}

/**
 * Generate a metric conversion problem
 * Randomly chooses between larger→smaller and smaller→larger conversions
 */
export function generateMetricConversionProblem(): MathProblem {
  const conversion = getRandomConversion();
  const { factor, fromUnit, toUnit } = conversion;

  // Randomly decide direction: larger to smaller or smaller to larger
  const isLargerToSmaller = Math.random() < 0.5;

  let value: number;
  let answer: number;
  let displayFrom: string;
  let displayTo: string;

  if (isLargerToSmaller) {
    // Converting from larger unit to smaller (multiply)
    // e.g., 5 km = ? m (multiply by 1000)
    value = randomInt(1, 20);
    answer = value * factor;
    displayFrom = fromUnit;
    displayTo = toUnit;
  } else {
    // Converting from smaller unit to larger (divide)
    // e.g., 5000 m = ? km (divide by 1000)
    // Generate a value that divides evenly
    const multiplier = randomInt(1, 20);
    answer = multiplier;
    value = multiplier * factor;
    displayFrom = toUnit;
    displayTo = fromUnit;
  }

  // Format display value with commas for large numbers
  const formattedValue = value.toLocaleString();
  const formattedAnswer = answer.toLocaleString();

  return {
    operand1: `${formattedValue} ${displayFrom}`,
    operation: 'metricConversion',
    correctAnswer: `${formattedAnswer} ${displayTo}`,
    numericAnswer: answer,
    displayString: `Convert ${formattedValue} ${displayFrom} to ${displayTo} = ?`,
    answerFormat: 'unit'
  };
}

/**
 * Generate wrong answers for metric conversion problems
 * Common mistakes: off by factor of 10, wrong direction
 */
export function generateMetricWrongAnswers(
  correctAnswer: number,
  _problem: MathProblem
): number[] {
  const wrongAnswers: number[] = [];

  // Common metric conversion mistakes
  const commonMistakes = [
    correctAnswer * 10,           // Off by one decimal place
    correctAnswer / 10,           // Off by one decimal place other direction
    correctAnswer * 100,          // Off by two decimal places
    correctAnswer / 100,          // Off by two decimal places other direction
    correctAnswer * 1000,         // Used wrong conversion factor
    correctAnswer / 1000,         // Used wrong conversion factor
    correctAnswer + correctAnswer * 0.1, // 10% off
    correctAnswer - correctAnswer * 0.1, // 10% off
  ];

  // Add valid mistakes
  for (const mistake of commonMistakes) {
    const rounded = Math.round(mistake);
    if (rounded > 0 && rounded !== correctAnswer && !wrongAnswers.includes(rounded)) {
      wrongAnswers.push(rounded);
      if (wrongAnswers.length >= 2) break;
    }
  }

  // Fill with nearby values if needed
  let offset = 1;
  while (wrongAnswers.length < 2) {
    const wrong = correctAnswer + offset * (wrongAnswers.length % 2 === 0 ? 1 : -1);
    if (wrong > 0 && wrong !== correctAnswer && !wrongAnswers.includes(wrong)) {
      wrongAnswers.push(wrong);
    }
    offset++;
    if (offset > 100) break; // Safety limit
  }

  // Final fallback
  while (wrongAnswers.length < 2) {
    wrongAnswers.push(correctAnswer + wrongAnswers.length + 1);
  }

  return wrongAnswers.slice(0, 2);
}

/**
 * Format a metric answer for display
 */
export function formatMetricAnswer(value: number, unit: string): string {
  return `${value.toLocaleString()} ${unit}`;
}

/**
 * Parse a metric answer string to get numeric value
 */
export function parseMetricAnswer(answer: string): number {
  // Remove unit and commas, parse as number
  const numericPart = answer.replace(/[^\d.-]/g, '').replace(/,/g, '');
  return parseFloat(numericPart);
}
