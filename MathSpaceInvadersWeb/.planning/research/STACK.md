# Stack Research: E2E Testing Infrastructure

**Project:** Math Space Invaders Web
**Researched:** 2026-01-22
**Focus:** E2E testing with Playwright + Cucumber BDD

## Executive Summary

For adding E2E testing with BDD to this existing React 19 + Vite + TypeScript game, **use playwright-bdd** (not traditional Cucumber-as-runner). This approach:
- Leverages Playwright's native test runner (parallel execution, built-in reporters, trace viewer)
- Maintains Gherkin syntax for BDD scenarios
- Integrates cleanly with existing Vitest unit testing
- Provides TypeScript-first development experience
- Supports GitHub Actions CI/CD with existing workflows

**Confidence:** MEDIUM - Based on official Playwright documentation and community patterns verified across multiple sources. Package versions verified via WebSearch (January 2026).

---

## Recommended Core Packages

### E2E Testing & BDD

| Package | Version | Purpose | Why |
|---------|---------|---------|-----|
| `@playwright/test` | `^1.57.0` | E2E test runner | Industry-standard browser automation, 45%+ market adoption. Version 1.57+ uses Chrome for Testing (more authentic than Chromium). Native TypeScript/ESM support. |
| `playwright-bdd` | `^8.4.2` | Gherkin → Playwright | Converts BDD scenarios into Playwright tests. Uses Playwright runner (not Cucumber runner) for full parallel execution, fixtures, and native reporting. |

**Rationale for playwright-bdd over @cucumber/cucumber:**
- **Playwright runner = native features**: Parallel test execution, automatic waits, screenshot/video capture, trace viewer, built-in reporters
- **No test runner conflict**: Using Cucumber as runner means losing Playwright's test runner capabilities
- **TypeScript-first**: Native TypeScript support without extra configuration
- **Simpler architecture**: Single test runner instead of orchestrating two frameworks
- **CI/CD friendly**: Direct integration with GitHub Actions Playwright workflows

### Coverage Collection

| Package | Version | Purpose | Why |
|---------|---------|---------|-----|
| `vite-plugin-istanbul` | `^6.0.0` | Instrument Vite builds | Injects Istanbul instrumentation during dev server startup for E2E coverage. Compatible with existing Vitest coverage setup. |
| `nyc` | `^17.0.0` | Coverage reporter | Industry-standard Istanbul CLI. Merges coverage from E2E tests, generates reports (HTML, LCOV, text). |
| `@istanbuljs/nyc-config-typescript` | `^1.0.2` | TypeScript coverage | Preconfigured NYC settings for TypeScript projects. |

**Coverage approach:**
- E2E coverage via Istanbul instrumentation (vite-plugin-istanbul)
- Unit test coverage via Vitest's built-in V8 coverage
- Separate but complementary - can merge if needed, but typically kept distinct

### Reporting & CI/CD

| Package | Version | Purpose | Why |
|---------|---------|---------|-----|
| `multiple-cucumber-html-reporter` | `^3.7.0` | HTML reports | Generates pretty HTML reports from Cucumber JSON. Better than basic Playwright HTML reporter for stakeholder communication. |

**Note:** Playwright's native HTML reporter is sufficient for developer use. `multiple-cucumber-html-reporter` adds value for stakeholder/PM visibility with Cucumber-style feature reporting.

---

## Integration Architecture

### How Packages Work Together

```
Feature Files (.feature)
    ↓
playwright-bdd (converts to .spec.ts)
    ↓
@playwright/test (executes tests)
    ↓
Coverage collected (vite-plugin-istanbul)
    ↓
Reports generated (Playwright HTML + Cucumber JSON → HTML)
```

**Build flow:**
1. **Pre-test**: `playwright-bdd` CLI generates `.spec.ts` files from `.feature` files
2. **Test execution**: Playwright test runner executes generated specs
3. **Coverage**: Istanbul collects coverage during execution (if ISTANBUL_COVERAGE env var set)
4. **Reporting**: Playwright generates native reports; optional Cucumber HTML report from JSON

### Directory Structure

```
MathSpaceInvadersWeb/
├── e2e/
│   ├── features/              # Gherkin .feature files
│   │   ├── authentication.feature
│   │   ├── gameplay.feature
│   │   └── leaderboard.feature
│   ├── steps/                 # Step definitions
│   │   ├── authentication.steps.ts
│   │   ├── gameplay.steps.ts
│   │   └── leaderboard.steps.ts
│   ├── fixtures/              # Playwright fixtures
│   │   ├── base.ts           # Extended test with coverage
│   │   └── pages.ts          # Page object fixtures
│   └── support/               # Helpers
│       ├── world.ts          # Shared context
│       └── hooks.ts          # Before/After hooks
├── .gen/                      # Generated .spec.ts (git-ignored)
├── playwright.config.ts       # Playwright configuration
├── playwright-bdd.config.ts   # BDD-specific config
└── .nyc_output/              # Coverage data (git-ignored)
```

**Why this structure:**
- `/e2e` separate from `/src` and `/tests` - clear separation of concerns
- `.gen/` for generated specs - git-ignored, regenerated before each test run
- Matches Playwright conventions while supporting BDD workflow

---

## TypeScript Configuration

### New tsconfig for E2E Tests

Create `tsconfig.e2e.json`:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["node", "@playwright/test"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true
  },
  "include": [
    "e2e/**/*.ts",
    ".gen/**/*.ts"
  ],
  "exclude": [
    "node_modules"
  ]
}
```

**Key differences from existing tsconfig.app.json:**
- `types`: Adds `@playwright/test` for Playwright APIs
- `include`: Covers `e2e/` and generated `.gen/` directories
- `module`: ESNext with bundler resolution (matches Playwright's TypeScript ESM support in 1.57+)
- Extends base config to inherit project-wide strict settings

### Update playwright.config.ts

```typescript
import { defineConfig } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

const testDir = defineBddConfig({
  features: 'e2e/features/**/*.feature',
  steps: 'e2e/steps/**/*.ts',
  outputDir: '.gen'
});

export default defineConfig({
  testDir,
  tsconfig: './tsconfig.e2e.json',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'playwright-report/cucumber-report.json' }],
    process.env.CI ? ['github'] : ['list']
  ],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    env: {
      ISTANBUL_COVERAGE: process.env.COVERAGE === 'true' ? '1' : '0'
    }
  }
});
```

---

## npm Scripts Structure

### Add to package.json

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest",
    "test:unit:ui": "vitest --ui",
    "test:unit:coverage": "vitest run --coverage",

    "test:e2e": "npm run test:e2e:generate && playwright test",
    "test:e2e:generate": "bddgen",
    "test:e2e:ui": "npm run test:e2e:generate && playwright test --ui",
    "test:e2e:debug": "npm run test:e2e:generate && playwright test --debug",
    "test:e2e:headed": "npm run test:e2e:generate && playwright test --headed",
    "test:e2e:coverage": "COVERAGE=true npm run test:e2e && npm run coverage:report",

    "coverage:report": "nyc report --reporter=html --reporter=lcov --reporter=text",
    "coverage:merge": "nyc merge .nyc_output coverage/merged-coverage.json",

    "playwright:install": "playwright install --with-deps",
    "playwright:codegen": "playwright codegen http://localhost:5173",
    "playwright:report": "playwright show-report",
    "playwright:trace": "playwright show-trace"
  }
}
```

**Script rationale:**
- `test:e2e:generate`: Explicitly generate specs (makes workflow visible)
- `test:e2e`: Main command - generate then test
- `test:e2e:coverage`: Runs with coverage, then generates reports
- `playwright:install`: One-time browser installation
- Separate unit/E2E test commands - run independently or together

### Pre-commit Hook Update

Update `lint-staged` in package.json:

```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "vitest related --run"
    ],
    "e2e/**/*.feature": [
      "npm run test:e2e:generate"
    ]
  }
}
```

**Regenerates specs when features change** - ensures `.gen/` stays in sync.

---

## Vite Configuration for Coverage

### Update vite.config.ts

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import istanbul from 'vite-plugin-istanbul';

export default defineConfig({
  plugins: [
    react(),
    istanbul({
      include: 'src/**/*.{ts,tsx}',
      exclude: [
        'node_modules',
        'tests',
        'e2e',
        '**/*.spec.ts',
        '**/*.test.ts'
      ],
      extension: ['.ts', '.tsx'],
      requireEnv: true, // Only instrument if ISTANBUL_COVERAGE env var is set
      forceBuildInstrument: false
    })
  ],
  build: {
    sourcemap: true // Required for accurate coverage
  }
});
```

**Key settings:**
- `requireEnv: true`: Only instruments when `ISTANBUL_COVERAGE=1` (prevents instrumentation in dev)
- `include: 'src/**'`: Only instrument application code
- `exclude`: Skip test files, node_modules
- `sourcemap: true`: Enables accurate line-by-line coverage

---

## Compatibility Notes

### Working with Existing Vitest Setup

**Separation of concerns:**
- **Vitest**: Unit tests (`/tests`), component tests, isolated logic
- **Playwright**: E2E tests (`/e2e`), full user flows, browser interactions

**No conflicts:**
- Different test runners (Vitest vs Playwright)
- Different coverage tools (V8 vs Istanbul)
- Different configuration files (`vitest.config.ts` vs `playwright.config.ts`)

**Shared infrastructure:**
- Both use TypeScript with similar settings
- Both generate HTML reports (different formats)
- Both integrate with GitHub Actions
- Both support coverage reporting

### Coverage Strategy

**Recommended approach: Separate but complementary**

```
Unit Test Coverage (Vitest + V8)
├── Logic functions (generators, services)
├── React components (React Testing Library)
└── Utilities and helpers

E2E Test Coverage (Playwright + Istanbul)
├── Full user flows (authentication, gameplay)
├── Integration between components
└── Canvas rendering behavior
```

**Why not merge coverage?**
- Different instrumentation (V8 vs Istanbul)
- Different goals (unit isolation vs integration)
- Complex merging process for minimal value

**If merging is required later:**
1. Convert V8 coverage to Istanbul format (possible but complex)
2. Use `nyc merge` to combine
3. Generate unified report

**Current recommendation: Keep separate** - simpler, clearer, same practical value.

---

## GitHub Actions Integration

### Add to .github/workflows/

**E2E Testing Workflow** (`.github/workflows/e2e.yml`):

```yaml
name: E2E Tests

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  e2e:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Generate BDD specs
        run: npm run test:e2e:generate

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          CI: true

      - name: Upload Playwright report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30

      - name: Upload coverage
        if: success()
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: e2e
```

**Integrates with existing deployment workflow** - runs E2E tests before deploying to GitHub Pages.

---

## Canvas Testing Considerations

Math Space Invaders uses **HTML5 Canvas rendering at 60 FPS**. Special considerations:

### Visual Testing Approach

**Playwright's visual comparison** - Use `toHaveScreenshot()` for canvas verification:

```typescript
// In step definition
await expect(page.locator('canvas#gameCanvas'))
  .toHaveScreenshot('gameplay-active.png', {
    maxDiffPixels: 100 // Allow small rendering differences
  });
```

**Why visual testing for canvas:**
- Canvas content not queryable via DOM selectors
- Visual regression catches rendering bugs
- Works across browsers (Chrome, Firefox, Safari)

### Canvas Interaction Testing

**Use coordinate-based clicks** for answer blocks:

```typescript
// Click answer block at known position
const canvas = page.locator('canvas#gameCanvas');
const box = await canvas.boundingBox();
await page.mouse.click(
  box.x + 100,  // Answer block X
  box.y + 200   // Answer block Y
);
```

**Verification strategy:**
- Test game state changes (score, level) via DOM elements
- Test HUD updates (lives, timer) via text content
- Test canvas visually only for critical rendering checks

### Performance Testing

**Clock mocking** for frame-rate independent tests:

```typescript
// Mock game clock for consistent timing
await page.clock.install({ time: 0 });
await page.clock.runFor(1000); // Advance 1 second
// Verify projectile position
```

**Prevents flaky tests** caused by timing variations.

---

## Installation Commands

```bash
# Core E2E + BDD
npm install -D @playwright/test@^1.57.0 playwright-bdd@^8.4.2

# Coverage
npm install -D vite-plugin-istanbul@^6.0.0 nyc@^17.0.0 @istanbuljs/nyc-config-typescript@^1.0.2

# Reporting (optional but recommended)
npm install -D multiple-cucumber-html-reporter@^3.7.0

# Install Playwright browsers
npx playwright install --with-deps
```

**Total package additions: 5-6 packages** (minimal footprint).

---

## Next Steps for Implementation

1. **Install packages** - Run installation commands above
2. **Create directory structure** - `/e2e/features`, `/e2e/steps`, etc.
3. **Configure TypeScript** - Add `tsconfig.e2e.json`
4. **Configure Playwright** - Create `playwright.config.ts` with BDD config
5. **Update Vite config** - Add `vite-plugin-istanbul`
6. **Write first feature** - Start with authentication flow
7. **Add npm scripts** - Copy script structure from above
8. **Update GitHub Actions** - Add E2E workflow

**Estimated setup time: 2-4 hours** for experienced developer.

---

## Sources

### High Confidence (Official Documentation & Package Repositories)
- [Playwright Release Notes](https://playwright.dev/docs/release-notes) - Version 1.57 features
- [playwright-bdd GitHub Repository](https://github.com/vitalets/playwright-bdd) - Version 8.4.2 verification
- [Playwright TypeScript Documentation](https://playwright.dev/docs/test-typescript) - TypeScript configuration

### Medium Confidence (Verified Community Sources)
- [Playwright and Cucumber Automation | BrowserStack](https://www.browserstack.com/guide/playwright-cucumber) - Integration approaches
- [Playwright BDD testing - you don't need Cucumber!](https://javascript.plainenglish.io/playwright-bdd-testing-you-dont-need-cucumber-ae38085c51b7) - playwright-bdd rationale
- [GitHub - vitalets/playwright-bdd](https://github.com/vitalets/playwright-bdd) - Architecture and peer dependencies
- [Cucumber vs Playwright | BrowserStack](https://www.browserstack.com/guide/cucumber-vs-playwright) - Comparison
- [Playwright + BDD with TypeScript: A Practical Guide](https://medium.com/@mail2sree6/playwright-bdd-with-typescript-a-practical-guide-to-fast-readable-e2e-tests-6bd1dca6b3d1) - TypeScript setup
- [Getting Started with Playwright and TypeScript in 2026](https://www.browserstack.com/guide/playwright-typescript) - Configuration patterns

### Coverage & Reporting
- [Adding Playwright Tests to your Vite Project with Code Coverage](https://mickydore.medium.com/adding-playwright-tests-to-your-vite-project-with-code-coverage-f6cfa65f0209) - vite-plugin-istanbul setup
- [playwright-test-coverage GitHub](https://github.com/mxschmitt/playwright-test-coverage) - Istanbul integration demo
- [Setting up CI | Playwright](https://playwright.dev/docs/ci-intro) - GitHub Actions configuration

### Canvas Testing
- [15 Best Practices for Playwright testing in 2026](https://www.browserstack.com/guide/playwright-best-practices) - General best practices
- [HTML5 Canvas Testing with CanvasGrid and Playwright](https://dev.to/fonzi/testing-html5-canvas-with-canvasgrid-and-playwright-5h4c) - Canvas testing approaches
- [Playwright visual testing: a complete guide](https://testdino.com/blog/playwright-visual-testing/) - Visual regression strategies

---

## Confidence Assessment

| Area | Confidence | Reason |
|------|-----------|--------|
| Package Selection | HIGH | Official Playwright docs + verified npm packages + community consensus |
| Versions | MEDIUM | WebSearch verification (January 2026), but npm.com blocked for direct verification |
| TypeScript Config | HIGH | Official Playwright TypeScript documentation + multiple verified sources |
| Integration Approach | HIGH | Clear architectural separation, proven pattern with existing Vitest |
| Coverage Strategy | MEDIUM | Verified approach (vite-plugin-istanbul), but complex merging noted |
| Canvas Testing | MEDIUM | Multiple sources confirm visual testing approach, coordinate-based interaction |

**Overall confidence: MEDIUM-HIGH** - Strong verification for core stack, moderate for specific integration details.
