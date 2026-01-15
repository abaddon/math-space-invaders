// Difficulty Configuration - Central configuration for level progression
// This file defines all difficulty parameters for easy tuning and extension

import type { OperationCategory, DigitType, TierDefinition } from '../types';

export const DIFFICULTY_CONFIG = {
  // Time settings (in seconds)
  BASE_TIME: 10,          // Starting time at beginning of each tier
  TIME_DECAY: 0.9,        // 10% reduction per level within tier
  MIN_TIME: 2,            // Minimum time allowed
  LEVELS_PER_TIER: 5,     // Number of levels in each tier

  // Correct answers needed to advance level
  ANSWERS_PER_LEVEL: 10,

  // Tier definitions - each tier introduces new operations or complexity
  TIERS: [
    {
      tier: 1,
      levelRange: [1, 5] as [number, number],
      operations: ['addition', 'subtraction'] as OperationCategory[],
      digitType: 'single' as DigitType,
      resetTime: true,
      description: 'Basic addition and subtraction with single digits'
    },
    {
      tier: 2,
      levelRange: [6, 10] as [number, number],
      operations: ['addition', 'subtraction', 'multiplication', 'division'] as OperationCategory[],
      digitType: 'single' as DigitType,
      resetTime: true,
      description: 'All basic operations with single digits'
    },
    {
      tier: 3,
      levelRange: [11, 15] as [number, number],
      operations: ['multiplication', 'division', 'fraction'] as OperationCategory[],
      digitType: 'single' as DigitType,
      resetTime: true,
      description: 'Adding proper fractions'
    },
    {
      tier: 4,
      levelRange: [16, 20] as [number, number],
      operations: ['division', 'fraction', 'improperFraction'] as OperationCategory[],
      digitType: 'single' as DigitType,
      resetTime: true,
      description: 'Adding improper fractions and mixed numbers'
    },
    {
      tier: 5,
      levelRange: [21, 25] as [number, number],
      operations: ['fraction', 'improperFraction', 'percentage'] as OperationCategory[],
      digitType: 'single' as DigitType,
      resetTime: true,
      description: 'Adding percentages'
    },
    {
      tier: 6,
      levelRange: [26, 30] as [number, number],
      operations: ['improperFraction', 'percentage', 'metricConversion'] as OperationCategory[],
      digitType: 'single' as DigitType,
      resetTime: true,
      description: 'Adding metric conversions'
    },
    {
      tier: 7,
      levelRange: [31, 35] as [number, number],
      operations: ['addition', 'subtraction'] as OperationCategory[],
      digitType: 'double' as DigitType,
      resetTime: true,
      description: 'Basic addition and subtraction with double digits'
    },
    {
      tier: 8,
      levelRange: [36, 40] as [number, number],
      operations: ['addition', 'subtraction', 'multiplication', 'division'] as OperationCategory[],
      digitType: 'double' as DigitType,
      resetTime: true,
      description: 'All basic operations with double digits'
    },
    {
      tier: 9,
      levelRange: [41, 45] as [number, number],
      operations: ['multiplication', 'division', 'fraction'] as OperationCategory[],
      digitType: 'double' as DigitType,
      resetTime: true,
      description: 'Adding proper fractions'
    },
    {
      tier: 10,
      levelRange: [46, 50] as [number, number],
      operations: ['division', 'fraction', 'improperFraction'] as OperationCategory[],
      digitType: 'double' as DigitType,
      resetTime: true,
      description: 'Adding improper fractions and mixed numbers'
    },
    {
      tier: 11,
      levelRange: [51, 55] as [number, number],
      operations: ['fraction', 'improperFraction', 'percentage'] as OperationCategory[],
      digitType: 'double' as DigitType,
      resetTime: true,
      description: 'Adding percentages'
    },
    {
      tier: 12,
      levelRange: [56, 60] as [number, number],
      operations: ['improperFraction', 'percentage', 'metricConversion'] as OperationCategory[],
      digitType: 'double' as DigitType,
      resetTime: true,
      description: 'Adding metric conversions'
    },
    {
      tier: 13,
      levelRange: [61, 65] as [number, number],
      operations: ['addition', 'subtraction'] as OperationCategory[],
      digitType: 'triple' as DigitType,
      resetTime: true,
      description: 'Basic addition and subtraction with triple digits'
    },
    {
      tier: 14,
      levelRange: [66, 70] as [number, number],
      operations: ['addition', 'subtraction', 'multiplication', 'division'] as OperationCategory[],
      digitType: 'triple' as DigitType,
      resetTime: true,
      description: 'All basic operations with triple digits'
    },
    {
      tier: 15,
      levelRange: [71, 75] as [number, number],
      operations: ['multiplication', 'division', 'fraction'] as OperationCategory[],
      digitType: 'triple' as DigitType,
      resetTime: true,
      description: 'Adding proper fractions'
    },
    {
      tier: 16,
      levelRange: [76, 80] as [number, number],
      operations: ['division', 'fraction', 'improperFraction'] as OperationCategory[],
      digitType: 'triple' as DigitType,
      resetTime: true,
      description: 'Adding improper fractions and mixed numbers'
    },
    {
      tier: 17,
      levelRange: [81, 85] as [number, number],
      operations: ['fraction', 'improperFraction', 'percentage'] as OperationCategory[],
      digitType: 'triple' as DigitType,
      resetTime: true,
      description: 'Adding percentages'
    },
    {
      tier: 18,
      levelRange: [86, 90] as [number, number],
      operations: ['improperFraction', 'percentage', 'metricConversion'] as OperationCategory[],
      digitType: 'triple' as DigitType,
      resetTime: true,
      description: 'Adding metric conversions'
    },
    {
      tier: 8,
      levelRange: [91, 200] as [number, number],
      operations: ['addition', 'subtraction', 'multiplication', 'division', 'fraction', 'improperFraction', 'percentage', 'metricConversion'] as OperationCategory[],
      digitType: 'triple' as DigitType,
      resetTime: true,
      description: 'Adding metric conversions'
    }
  ] as TierDefinition[],

  //operations: ['addition', 'subtraction', 'multiplication', 'division', 'fraction', 'improperFraction', 'percentage', 'metricConversion'] as OperationCategory[],
  // single   double   triple

  // Digit ranges for number generation
  DIGIT_RANGES: {
    single: { min: 1, max: 9 },
    double: { min: 10, max: 99 },
    triple: { min: 100, max: 999 }
  } as Record<DigitType, { min: number; max: number }>,

  // Multiplication limits to keep answers reasonable
  MULTIPLICATION_LIMITS: {
    single: { factor1Max: 9, factor2Max: 9 },
    double: { factor1Max: 12, factor2Max: 99 },
    triple: { factor1Max: 12, factor2Max: 999 }
  } as Record<DigitType, { factor1Max: number; factor2Max: number }>,

  // Division limits
  DIVISION_LIMITS: {
    single: { divisorMax: 9, quotientMax: 9 },
    double: { divisorMax: 12, quotientMax: 99 },
    triple: { divisorMax: 12, quotientMax: 999 }
  } as Record<DigitType, { divisorMax: number; quotientMax: number }>,

  // Fraction configuration
  FRACTION_CONFIG: {
    // Common denominators for cleaner math
    denominators: [2, 3, 4, 5, 6, 8, 10, 12],
    // Probability weights for different fraction problem types
    typeWeights: {
      arithmetic: 40,      // a/b + c/d or a/b - c/d
      simplification: 30,  // Simplify 6/8
      ofNumber: 30         // 1/2 of 16
    }
  },

  // Percentage configuration
  PERCENTAGE_CONFIG: {
    // Common percentages for cleaner math
    commonPercentages: [5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 80, 90, 100],
    // Probability weights for different percentage problem types
    typeWeights: {
      findPercentageOf: 50,  // What is 25% of 80?
      findWhatPercent: 50    // 20 is what % of 80?
    }
  },

  // Metric conversion configuration
  METRIC_CONFIG: {
    // Conversion factors
    conversions: {
      // Length
      km_m: { factor: 1000, display: ['km', 'm'] },
      m_cm: { factor: 100, display: ['m', 'cm'] },
      cm_mm: { factor: 10, display: ['cm', 'mm'] },
      m_mm: { factor: 1000, display: ['m', 'mm'] },

      // Weight
      kg_g: { factor: 1000, display: ['kg', 'g'] },
      g_mg: { factor: 1000, display: ['g', 'mg'] },

      // Volume
      L_mL: { factor: 1000, display: ['L', 'mL'] },

      // Area
      km2_m2: { factor: 1000000, display: ['km²', 'm²'] },
      m2_cm2: { factor: 10000, display: ['m²', 'cm²'] }
    } as Record<string, { factor: number; display: [string, string] }>,

    // Which conversions are available (for easy enabling/disabling)
    enabledConversions: [
      'km_m', 'm_cm', 'cm_mm',
      'kg_g', 'g_mg',
      'L_mL',
      'm2_cm2'
    ]
  },

  // Operation weights (probability of each operation being selected)
  // Higher weight = more likely to be selected
  OPERATION_WEIGHTS: {
    addition: 20,
    subtraction: 20,
    multiplication: 15,
    division: 15,
    fraction: 10,
    improperFraction: 8,
    percentage: 7,
    metricConversion: 5
  } as Record<OperationCategory, number>
};

// Helper to get tier by level
export function getTierForLevel(level: number): TierDefinition | null {
  for (const tier of DIFFICULTY_CONFIG.TIERS) {
    if (level >= tier.levelRange[0] && level <= tier.levelRange[1]) {
      return tier;
    }
  }
  // For levels beyond defined tiers, use the last tier's config
  return DIFFICULTY_CONFIG.TIERS[DIFFICULTY_CONFIG.TIERS.length - 1];
}

// Helper to get the highest defined tier number
export function getMaxDefinedTier(): number {
  return DIFFICULTY_CONFIG.TIERS.length;
}
