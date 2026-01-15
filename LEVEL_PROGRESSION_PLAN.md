# Level Progression System - Implementation Plan

## Overview

The new level progression system manages difficulty through **3 independent dimensions**:
1. **Time Available** - How long before the answer block reaches the bottom (5s → 2s)
2. **Operation Types** - Which math operations are available
3. **Number Complexity** - Single, double, or triple digit numbers

The system is organized into **Tiers** (groups of 5 levels) where each tier introduces new operations or complexity.

---

## Tier Structure

| Tier | Levels | Operations | Digits | Time Behavior |
|------|--------|------------|--------|---------------|
| 1 | 1-5 | Addition, Subtraction | Single (1-9) | 5s → 3.28s (-10%/level) |
| 2 | 6-10 | +Multiplication, Division | Single (1-9) | Reset 5s → 3.28s |
| 3 | 11-15 | Add, Sub, Mul, Div | Double (10-99) | Reset 5s → 3.28s |
| 4 | 16-20 | +Fractions | Double (10-99) | Reset 5s → 3.28s |
| 5 | 21-25 | +Improper Fractions | Double (10-99) | Reset 5s → 3.28s |
| 6 | 26-30 | +Percentages | Double (10-99) | Reset 5s → 3.28s |
| 7 | 31-35 | All operations | Triple (100-999) | Reset 5s → 3.28s |
| 8 | 36-40 | +Metric Conversions | Triple (100-999) | Reset 5s → 3.28s |
| 9+ | 41+ | All operations | Triple (100-999) | Continue decreasing until 2s minimum, then stay at 2s |

---

## Time Calculation Logic

### Formula
```
timeAvailable = BASE_TIME × (TIME_DECAY ^ levelWithinTier)
```

Where:
- `BASE_TIME = 5 seconds`
- `TIME_DECAY = 0.9` (10% reduction per level)
- `MIN_TIME = 2 seconds`
- `levelWithinTier = (level - 1) % 5` for tiers 1-8

### Time by Level (within each tier)

| Level in Tier | Multiplier | Time (seconds) |
|---------------|------------|----------------|
| 1 | 1.0 | 5.00s |
| 2 | 0.9 | 4.50s |
| 3 | 0.81 | 4.05s |
| 4 | 0.729 | 3.65s |
| 5 | 0.656 | 3.28s |

### Time Reset Behavior

- **Tiers 1-8**: Time resets to 5s at the start of each tier
- **Tier 9+** (Level 41+): Time continues decreasing from where Tier 8 ended
  - Level 41: continues from 3.28s × 0.9 = 2.95s
  - Level 42: 2.66s
  - Level 43: 2.39s
  - Level 44: 2.15s
  - Level 45+: 2.00s (minimum reached, stays here)

---

## Operation Types Configuration

### Operation Categories

```typescript
type OperationCategory =
  | 'addition'
  | 'subtraction'
  | 'multiplication'
  | 'division'
  | 'fraction'           // Proper fractions (numerator < denominator)
  | 'improperFraction'   // Improper fractions (numerator >= denominator)
  | 'percentage'
  | 'metricConversion';
```

### Operations by Tier

| Tier | New Operations Added | Cumulative Operations |
|------|---------------------|----------------------|
| 1 | addition, subtraction | 2 |
| 2 | multiplication, division | 4 |
| 3 | (none - digit upgrade) | 4 |
| 4 | fraction | 5 |
| 5 | improperFraction | 6 |
| 6 | percentage | 7 |
| 7 | (none - digit upgrade) | 7 |
| 8 | metricConversion | 8 |

---

## Number Complexity (Digits)

### Digit Ranges

| Digits | Min | Max | Examples |
|--------|-----|-----|----------|
| Single | 1 | 9 | 3, 7, 9 |
| Double | 10 | 99 | 23, 45, 87 |
| Triple | 100 | 999 | 123, 456, 789 |

### Digits by Tier

| Tiers | Digit Type |
|-------|------------|
| 1-2 | Single |
| 3-6 | Double |
| 7+ | Triple |

---

## Problem Generation Details

### 1. Addition
```
operand1 + operand2 = ?
```
- Both operands use current digit range
- Answer is sum

### 2. Subtraction
```
operand1 - operand2 = ?
```
- operand1 > operand2 (always positive result)
- Both use current digit range

### 3. Multiplication
```
operand1 × operand2 = ?
```
- For single digits: 2-9 × 2-9
- For double digits: 2-12 × 10-99 (keep one factor small for reasonable answers)
- For triple digits: 2-12 × 100-999

### 4. Division
```
operand1 ÷ operand2 = ?
```
- Always results in whole number
- Generate: divisor, quotient → dividend = divisor × quotient
- Divisor limited to 2-12 for playability

### 5. Fractions (Proper)
Three formats randomly selected:

**Format A - Arithmetic:**
```
a/b + c/d = ?    (result as simplified fraction or decimal)
a/b - c/d = ?
```

**Format B - Simplification:**
```
Simplify 6/8 = ?
```

**Format C - Of a number:**
```
1/2 of 16 = ?
```

- Denominators: 2, 3, 4, 5, 6, 8, 10, 12
- Results should be clean numbers or simple fractions

### 6. Improper Fractions
Same formats as fractions but:
- Numerator >= denominator allowed
- Can include mixed number conversions:
```
Convert 7/4 to mixed = ?    (Answer: 1 3/4)
Convert 2 1/3 to improper = ?   (Answer: 7/3)
```

### 7. Percentages
Two formats:

**Format A - Find percentage of number:**
```
What is 25% of 80 = ?
```
- Percentages: 10%, 20%, 25%, 50%, 75%, etc.
- Numbers chosen to give clean results

**Format B - Find the percentage:**
```
20 is what % of 80 = ?
```

### 8. Metric Conversions
Categories:
- **Length**: km, m, cm, mm
- **Weight**: kg, g, mg
- **Volume**: L, mL
- **Area**: km², m², cm²

Format:
```
Convert 5 km to m = ?
Convert 2500 g to kg = ?
Convert 3 m² to cm² = ?
```

Conversion factors stored in config for easy tuning.

---

## Architecture Design

### New Type Definitions (`types.ts`)

```typescript
// Difficulty Tier Configuration
export interface DifficultyTier {
  tierNumber: number;
  levelRange: [number, number];  // [startLevel, endLevel]
  operations: OperationCategory[];
  digitType: 'single' | 'double' | 'triple';
  baseTime: number;  // Time at first level of tier
}

// Operation Configuration (for extensibility)
export interface OperationConfig {
  type: OperationCategory;
  weight: number;  // Probability weight for selection
  enabled: boolean;
}

// Level Configuration (computed)
export interface LevelConfig {
  level: number;
  tier: number;
  timeAvailable: number;
  operations: OperationCategory[];
  digitRange: { min: number; max: number };
}

// Extended MathProblem
export interface MathProblem {
  operand1: number | string;  // string for fractions like "3/4"
  operand2?: number | string;
  operation: OperationCategory;
  correctAnswer: number | string;
  displayString: string;
  answerFormat: 'number' | 'fraction' | 'mixed' | 'percentage' | 'unit';
}
```

### New Files Structure

```
src/
├── config/
│   └── difficultyConfig.ts    # Tier definitions, time constants, operation weights
├── generators/
│   ├── index.ts               # Main generator that delegates to specialists
│   ├── arithmeticGenerator.ts # +, -, ×, ÷
│   ├── fractionGenerator.ts   # Fractions and improper fractions
│   ├── percentageGenerator.ts # Percentage problems
│   └── metricGenerator.ts     # Metric conversion problems
├── utils/
│   ├── levelUtils.ts          # Calculate tier, time, operations for any level
│   └── fractionUtils.ts       # GCD, simplification, fraction math
└── mathGenerator.ts           # Updated to use new system (backward compatible API)
```

### Core Configuration (`difficultyConfig.ts`)

```typescript
export const DIFFICULTY_CONFIG = {
  // Time settings
  BASE_TIME: 5,           // seconds
  TIME_DECAY: 0.9,        // 10% reduction per level
  MIN_TIME: 2,            // minimum seconds

  // Tier definitions
  TIERS: [
    {
      tier: 1,
      levels: [1, 5],
      operations: ['addition', 'subtraction'],
      digits: 'single',
      resetTime: true
    },
    {
      tier: 2,
      levels: [6, 10],
      operations: ['addition', 'subtraction', 'multiplication', 'division'],
      digits: 'single',
      resetTime: true
    },
    // ... etc
  ],

  // Digit ranges
  DIGIT_RANGES: {
    single: { min: 1, max: 9 },
    double: { min: 10, max: 99 },
    triple: { min: 100, max: 999 }
  },

  // Metric conversion factors
  METRIC_CONVERSIONS: {
    length: {
      km_m: 1000,
      m_cm: 100,
      cm_mm: 10
    },
    weight: {
      kg_g: 1000,
      g_mg: 1000
    },
    volume: {
      L_mL: 1000
    },
    area: {
      km2_m2: 1000000,
      m2_cm2: 10000
    }
  }
};
```

---

## Speed Implementation (Falling Blocks)

Current system uses pixel speed. New system uses **time-based approach**:

### Calculation
```typescript
function calculateFallSpeed(canvasHeight: number, timeAvailable: number): number {
  // Distance to travel = canvas height - HUD - problem area - starship
  const fallDistance = canvasHeight - 50 - 60 - 100; // approximately 490px on 700px canvas

  // Speed in pixels per frame (assuming 60fps)
  const framesAvailable = timeAvailable * 60;
  return fallDistance / framesAvailable;
}
```

### Example Speeds
| Time | Pixels/Frame (60fps) |
|------|---------------------|
| 5.0s | ~1.63 px/frame |
| 4.0s | ~2.04 px/frame |
| 3.0s | ~2.72 px/frame |
| 2.0s | ~4.08 px/frame |

---

## Answer Block Considerations

### For Fraction/Percentage Answers

Answers may need to display:
- Whole numbers: `24`
- Fractions: `3/4`
- Mixed numbers: `1 1/2`
- Percentages: `25%`
- Units: `5000 m`

**UI Changes needed:**
- Wider answer blocks for longer displays
- Smaller font for complex answers
- Auto-sizing based on answer length

### Wrong Answer Generation

For each operation type, generate plausible wrong answers:
- **Arithmetic**: ±1-5 from correct answer
- **Fractions**: Common mistakes (wrong denominator, unsimplified)
- **Percentages**: Common errors (forgetting to divide by 100, etc.)
- **Metrics**: Off by a factor of 10 or 100

---

## Implementation Steps

### Phase 1: Configuration & Types
1. Create `difficultyConfig.ts` with all tier definitions
2. Update `types.ts` with new interfaces
3. Create `levelUtils.ts` for level → config calculations

### Phase 2: Generators
4. Create `arithmeticGenerator.ts` (refactor from current)
5. Create `fractionGenerator.ts` with all three formats
6. Create `percentageGenerator.ts` with both formats
7. Create `metricGenerator.ts` with all unit types
8. Create main `generators/index.ts` to orchestrate

### Phase 3: Game Integration
9. Update `mathGenerator.ts` to use new system
10. Update `App.tsx` to use time-based speed calculation
11. Update answer block rendering for new answer formats

### Phase 4: UI Polish
12. Adjust answer block sizes for different answer types
13. Add visual indicators for current tier/operation types
14. Test all level transitions

### Phase 5: Testing & Tuning
15. Play-test each tier transition
16. Adjust timing and difficulty as needed
17. Verify answer generation produces valid problems

---

## Extensibility Points

The design allows easy future additions:

1. **New Operations**: Add to `OperationCategory` type and create new generator
2. **Adjust Timing**: Modify `DIFFICULTY_CONFIG.TIME_DECAY` or `BASE_TIME`
3. **New Tiers**: Add entries to `TIERS` array
4. **Operation Weights**: Add weights to favor certain operations
5. **New Digit Ranges**: Add to `DIGIT_RANGES` (e.g., 'quad' for 4-digit numbers)
6. **New Metric Types**: Add to `METRIC_CONVERSIONS` (e.g., time, temperature)

---

## Questions Resolved

1. **Fractions**: Mixed format (arithmetic, simplification, "of a number")
2. **Metrics**: All categories (length, weight, volume, area)
3. **Percentages**: Both formats (find % of number, find what %)
4. **Time Reset**: Resets each tier until operations/digits match previous tier, then continues decreasing to 2s minimum

---

## Summary

This system provides:
- **Clear progression** through 8+ tiers of increasing difficulty
- **Three difficulty dimensions** that scale independently
- **Flexible configuration** for easy tuning
- **Extensible architecture** for adding new operation types
- **Time-based mechanics** for consistent gameplay feel
