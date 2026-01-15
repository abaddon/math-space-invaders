# Level Progression System - Documentation

## Overview

The level progression system manages difficulty through **3 independent dimensions**:
1. **Time Available** - How long before the answer block reaches the bottom (10s → 2s)
2. **Operation Types** - Which math operations are available
3. **Number Complexity** - Single, double, or triple digit numbers

The system is organized into **18 Tiers** (3 levels each) that cycle through operation types at each digit complexity level.

---

## Configuration Summary

| Setting | Value |
|---------|-------|
| Base Time | 10 seconds |
| Time Decay | 10% per level |
| Minimum Time | 2 seconds |
| Levels per Tier | 3 (variable) |
| Answers per Level | 10 |

---

## Tier Structure

### Single Digits (Tiers 1-6, Levels 1-18)

| Tier | Levels | Operations | Digits |
|------|--------|------------|--------|
| 1 | 1-3 | Addition, Subtraction | Single (1-9) |
| 2 | 4-6 | Addition, Subtraction, Multiplication, Division | Single (1-9) |
| 3 | 7-9 | Multiplication, Division, Fractions | Single (1-9) |
| 4 | 10-12 | Division, Fractions, Improper Fractions | Single (1-9) |
| 5 | 13-15 | Fractions, Improper Fractions, Percentages | Single (1-9) |
| 6 | 16-18 | Improper Fractions, Percentages, Metric Conversions | Single (1-9) |

### Double Digits (Tiers 7-12, Levels 19-36)

| Tier | Levels | Operations | Digits |
|------|--------|------------|--------|
| 7 | 19-21 | Addition, Subtraction | Double (10-99) |
| 8 | 22-24 | Addition, Subtraction, Multiplication, Division | Double (10-99) |
| 9 | 25-27 | Multiplication, Division, Fractions | Double (10-99) |
| 10 | 28-30 | Division, Fractions, Improper Fractions | Double (10-99) |
| 11 | 31-33 | Fractions, Improper Fractions, Percentages | Double (10-99) |
| 12 | 34-36 | Improper Fractions, Percentages, Metric Conversions | Double (10-99) |

### Triple Digits (Tiers 13-18, Levels 37-54)

| Tier | Levels | Operations | Digits |
|------|--------|------------|--------|
| 13 | 37-39 | Addition, Subtraction | Triple (100-500) |
| 14 | 40-42 | Addition, Subtraction, Multiplication, Division | Triple (100-500) |
| 15 | 43-45 | Multiplication, Division, Fractions | Triple (100-500) |
| 16 | 46-48 | Division, Fractions, Improper Fractions | Triple (100-500) |
| 17 | 49-51 | Fractions, Improper Fractions, Percentages | Triple (100-500) |
| 18 | 52-54 | Improper Fractions, Percentages, Metric Conversions | Triple (100-500) |

### Endless Mode (Tier 19+, Levels 55+)

| Tier | Levels | Operations | Digits |
|------|--------|------------|--------|
| 19 | 55-200 | ALL operations | Triple (100-500) |

---

## Time Calculation Logic

### Formula
```
timeAvailable = BASE_TIME × (TIME_DECAY ^ levelWithinTier)
```

Where:
- `BASE_TIME = 10 seconds`
- `TIME_DECAY = 0.9` (10% reduction per level)
- `MIN_TIME = 2 seconds`

### Time by Level (within each tier)

| Level in Tier | Multiplier | Time (seconds) |
|---------------|------------|----------------|
| 1 | 1.0 | 10.00s |
| 2 | 0.9 | 9.00s |
| 3 | 0.81 | 8.10s |

### Time Reset Behavior

- Time resets to 10s at the start of each new tier
- Each tier spans 3 levels
- After all defined tiers, time continues decreasing until hitting 2s minimum

---

## Operation Types

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

### Operation Progression Pattern

The operations follow a sliding window pattern at each digit level:
1. Basic: Addition, Subtraction
2. Intermediate: +Multiplication, Division
3. Fractions: Multiplication, Division, Fractions
4. Mixed Numbers: Division, Fractions, Improper Fractions
5. Percentages: Fractions, Improper Fractions, Percentages
6. Conversions: Improper Fractions, Percentages, Metric Conversions

This pattern repeats for single → double → triple digits.

---

## Number Complexity (Digits)

### Digit Ranges

| Digits | Min | Max | Examples |
|--------|-----|-----|----------|
| Single | 1 | 9 | 3, 7, 9 |
| Double | 10 | 99 | 23, 45, 87 |
| Triple | 100 | 500 | 123, 345, 456 |

### Digits by Tier Group

| Tiers | Levels | Digit Type |
|-------|--------|------------|
| 1-6 | 1-18 | Single |
| 7-12 | 19-36 | Double |
| 13-18 | 37-54 | Triple |
| 19+ | 55+ | Triple |

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
- For triple digits: 2-12 × 100-500

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
a/b + c/d = ?    (result as simplified fraction)
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
Two formats (50% each):

**Format A - Find percentage of number:**
```
What is 25% of 80 = ?
```
- Percentages: 5%, 10%, 15%, 20%, 25%, 30%, 40%, 50%, 60%, 75%, 80%, 90%, 100%
- Numbers chosen to give clean results

**Format B - Find the percentage:**
```
20 is what % of 80 = ?
```

### 8. Metric Conversions
Categories:
- **Length**: km ↔ m, m ↔ cm, cm ↔ mm
- **Weight**: kg ↔ g, g ↔ mg
- **Volume**: L ↔ mL
- **Area**: m² ↔ cm²

Format:
```
Convert 5 km to m = ?
Convert 2500 g to kg = ?
```

---

## File Structure

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
└── mathGenerator.ts           # Main API (backward compatible)
```

---

## Operation Weights

Operations are selected with weighted probability:

| Operation | Weight |
|-----------|--------|
| Addition | 20 |
| Subtraction | 20 |
| Multiplication | 15 |
| Division | 15 |
| Fraction | 10 |
| Improper Fraction | 8 |
| Percentage | 7 |
| Metric Conversion | 5 |

Higher weight = more likely to be selected within available operations.

---

## Extensibility Points

The design allows easy future additions:

1. **New Operations**: Add to `OperationCategory` type and create new generator
2. **Adjust Timing**: Modify `DIFFICULTY_CONFIG.TIME_DECAY` or `BASE_TIME`
3. **New Tiers**: Add entries to `TIERS` array
4. **Operation Weights**: Modify `OPERATION_WEIGHTS`
5. **New Digit Ranges**: Add to `DIGIT_RANGES`
6. **New Metric Types**: Add to `METRIC_CONFIG.conversions`

---

## Summary

This system provides:
- **18 defined tiers** plus endless mode
- **Progressive difficulty** cycling through operations at 3 digit levels
- **Time-based mechanics** (10s → 2s minimum)
- **Sliding window operations** - gradual introduction of new concepts
- **Flexible configuration** for easy tuning
- **Extensible architecture** for adding new operation types
