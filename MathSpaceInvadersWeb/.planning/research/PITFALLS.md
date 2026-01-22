# Pitfalls Research: E2E Testing for Canvas-Based Games

**Domain:** E2E Testing with BDD for HTML5 Canvas Game + Firebase Backend
**Researched:** 2026-01-22
**Project:** Math Space Invaders Web (React 19 + Vite + Canvas + Firebase)

## Executive Summary

Adding E2E tests to a Canvas-based game presents unique challenges that differ from traditional DOM-based applications. The three critical failure modes are:

1. **Canvas Opacity**: Game elements render on Canvas, invisible to traditional DOM selectors
2. **Firebase Test Pollution**: Production data contamination from test runs without proper isolation
3. **Timing Fragility**: 60 FPS animations and physics create race conditions in tests

This research identifies 18 specific pitfalls across 5 categories, prioritized by severity and phase relevance.

---

## Critical Pitfalls

These mistakes cause rewrites, major refactoring, or abandoned test suites.

### CRITICAL-1: Testing Canvas Elements via DOM Queries

**What goes wrong:**
Teams attempt to use standard Playwright/Cypress selectors (`page.locator('.answer-block')`) to find game elements rendered on Canvas. These selectors return nothing because Canvas renders everything as pixels, not DOM elements.

**Why it happens:**
- Natural reflex from DOM-based E2E testing
- Lack of awareness that Canvas is a single `<canvas>` element containing a bitmap
- BDD scenarios written assuming DOM structure ("When I click the answer block")

**Consequences:**
- All game interaction tests fail immediately
- Team realizes fundamental approach is wrong after writing scenarios
- Requires complete rethink of testing strategy (2-3 day setback)

**Prevention:**
**Phase 1 (Setup):** Add `data-testid` attributes to NON-Canvas interactive elements (buttons, modals, HUD elements)
**Phase 2 (Core Flows):** For Canvas interactions:
- Option A: Expose game state via `window.gameState` and test state transitions instead of UI
- Option B: Use coordinate-based clicks `page.locator('canvas').click({ position: { x: 400, y: 300 } })`
- Option C: Add "test mode" that renders ARIA labels on Canvas elements (accessibility + testability)

**Detection:**
- Test fails with "Element not found" on first Canvas interaction
- `page.locator('canvas').innerHTML` shows empty or single element

**Sources:**
- [Playwright vs Cypress Guide](https://devin-rosario.medium.com/playwright-vs-cypress-the-2026-enterprise-testing-guide-ade8b56d3478)
- [HTML5 Canvas Accessibility](https://pauljadam.com/demos/canvas.html)

---

### CRITICAL-2: Firebase Production Data Contamination

**What goes wrong:**
E2E tests run against production Firebase, creating test scores on leaderboards, polluting user data, and potentially triggering billing alerts from excessive reads/writes.

**Why it happens:**
- Default Firebase initialization points to production
- Developers forget to switch config in test environment
- No Firebase Emulator setup in CI/CD

**Consequences:**
- Production leaderboard filled with "test_user_123" entries
- Real user data potentially deleted by test cleanup scripts
- Firebase billing spike from test runs
- Loss of trust in production data integrity

**Prevention:**
**Phase 1 (Setup):**
```typescript
// firebase.ts - Environment-aware initialization
const isTestEnv = import.meta.env.MODE === 'test' ||
                  window.location.hostname.includes('localhost:4000');

if (isTestEnv) {
  connectFirestoreEmulator(db, 'localhost', 8080);
}
```

**Phase 1 (Setup - CI):**
```yaml
# .github/workflows/e2e.yml
- name: Start Firebase Emulators
  run: |
    npm install -g firebase-tools
    firebase emulators:start --only firestore,auth &
    sleep 5  # Wait for emulators to start
```

**Phase 2 (Core Flows):** Every test file:
```typescript
beforeEach(async () => {
  // Clear emulator data between tests
  await fetch('http://localhost:8080/emulator/v1/projects/demo-project/databases/(default)/documents', {
    method: 'DELETE'
  });
});
```

**Detection:**
- Check Firebase console for unexpected test data
- Monitor Firebase usage metrics for spikes during CI runs
- Test fails in CI with "ECONNREFUSED localhost:8080" (good - means it's trying to use emulator)

**Sources:**
- [Firebase Test Isolation Best Practices](https://firebase.google.com/docs/rules/unit-tests)
- [Firebase Emulator Integration](https://firebase.google.com/docs/emulator-suite)
- [Programmatic Auth with Firebase](https://makerkit.dev/blog/tutorials/programmatic-authentication-firebase-cypress)

---

### CRITICAL-3: Missing Java Dependency in GitHub Actions

**What goes wrong:**
Firebase Emulator requires Java, but GitHub Actions runners don't have it by default. Tests fail in CI with cryptic "Java not found" errors, despite working locally.

**Why it happens:**
- Firebase Emulator has Java dependency (often undocumented in quick-start guides)
- Local development machines typically have Java installed
- CI environment is bare-bones

**Consequences:**
- All CI E2E tests fail immediately
- Developers waste hours debugging "works on my machine" issues
- CI pipeline blocked until Java installation step added

**Prevention:**
**Phase 1 (Setup):**
```yaml
# .github/workflows/e2e.yml
- name: Setup Java (for Firebase Emulator)
  uses: actions/setup-java@v4
  with:
    distribution: 'temurin'
    java-version: '17'

- name: Install Firebase Tools
  run: npm install -g firebase-tools

- name: Start Emulators
  run: firebase emulators:start --only firestore,auth --project demo-project &
```

**Detection:**
- CI logs show "Error: java: command not found"
- Firebase emulator fails to start with Java-related error

**Sources:**
- [Firebase Emulator GitHub Actions Setup](https://github.com/firebase/firebase-tools/issues/2337)
- [Firebase Emulator Common Errors](https://medium.com/@g.kawin/lesson-learned-from-firebase-emulator-for-running-an-integration-test-on-github-action-d0c24e5be815)

---

### CRITICAL-4: Static/Singleton WebDriver in Parallel Execution

**What goes wrong:**
When running tests in parallel, a static WebDriver instance gets reassigned, causing tests to interact with the wrong browser instance or fail with "session not found" errors.

**Why it happens:**
- Natural pattern from single-threaded test execution
- Cucumber step definitions often use static fields for convenience
- Parallelization added later without refactoring shared state

**Consequences:**
- Tests pass in serial, fail randomly in parallel
- Flaky "element not found" errors
- One test's actions affect another test's browser
- Team disables parallelization, losing 3-5x speed improvement

**Prevention:**
**Phase 2 (Core Flows):**
```typescript
// BAD - Static shared state
class Steps {
  private static page: Page;

  @Given('I am on the game page')
  async navigateToGame() {
    await Steps.page.goto('/');  // WRONG - shared across threads
  }
}

// GOOD - Instance-based state
class Steps {
  private page: Page;

  constructor(page: Page) {
    this.page = page;  // Each scenario gets own instance
  }

  @Given('I am on the game page')
  async navigateToGame() {
    await this.page.goto('/');
  }
}
```

**Phase 3 (CI/CD):** Use Playwright's built-in parallelization:
```typescript
// playwright.config.ts
export default defineConfig({
  workers: process.env.CI ? 2 : undefined,  // Limit workers in CI
  fullyParallel: true,
});
```

**Detection:**
- Tests pass when run with `--workers=1`, fail with `--workers=4`
- "Session not found" or "Target closed" errors in parallel mode
- Test A affects test B's state (e.g., test A's login persists in test B)

**Sources:**
- [BDD Cucumber Anti-Patterns](https://medium.com/@aj.516147/common-anti-patterns-in-cucumber-how-to-avoid-them-ab73c63df180)
- [GitHub Actions Parallel Testing](https://www.testmo.com/guides/github-actions-parallel-testing/)

---

## Moderate Pitfalls

These cause delays, flaky tests, or technical debt.

### MODERATE-1: Hard-Coded Waits for Animations

**What goes wrong:**
Tests use `page.waitForTimeout(2000)` to wait for answer blocks to fall, projectiles to fly, or explosions to finish. Tests become slow (2s per animation) and flaky (animation sometimes takes 2.1s).

**Why it happens:**
- Easiest solution to timing issues
- Animations are hard to detect completion programmatically
- Lack of awareness of better wait strategies

**Consequences:**
- Test suite takes 10+ minutes for simple flows
- Random failures when CI is slow (animations take longer under load)
- 6.5% flakiness rate reported in real-world Cypress suites

**Prevention:**
**Phase 2 (Core Flows):**
```typescript
// BAD - Hard-coded wait
await page.waitForTimeout(2000);  // Hope animation finishes
expect(score).toBe(100);

// GOOD - Wait for state change
await page.waitForFunction(() => {
  return window.gameState?.score === 100;
}, { timeout: 5000 });

// BETTER - Disable animations in test mode
await page.addInitScript(() => {
  window.TEST_MODE = true;  // Game checks this flag
});
// In game code:
const ANIMATION_DURATION = window.TEST_MODE ? 0 : 500;
```

**Phase 2 (Core Flows - Alternative):**
Enable `reducedMotion` mode:
```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    reducedMotion: 'reduce',  // Tells app to skip animations
  },
});
```

**Detection:**
- Test suite takes >5 minutes for basic flows
- Tests fail intermittently with "expected 100, got 0" (assertion ran before state updated)
- CI logs show many `waitForTimeout` calls

**Sources:**
- [Animation Timing E2E Best Practices](https://elvanco.com/blog/how-to-configure-timeouts-and-delays-in-e2e-tests)
- [Dealing with Timing Issues](https://www.joshmorony.com/dealing-with-timing-issues-in-ionic-e2e-tests/)
- [Playwright Best Practices 2026](https://www.browserstack.com/guide/playwright-best-practices)

---

### MODERATE-2: UI-Coupled BDD Scenarios

**What goes wrong:**
Gherkin scenarios describe implementation details instead of user behavior:
```gherkin
# BAD
Scenario: Answer math problem
  Given I am on the game page
  When I click the canvas at coordinates (400, 300)
  And I wait for the projectile animation to complete
  And I verify the particle explosion rendered
  Then the score increments by 10
```

Instead of:
```gherkin
# GOOD
Scenario: Correct answer increases score
  Given I am playing a level with the problem "2 + 2"
  When I shoot the correct answer "4"
  Then my score increases by 10
```

**Why it happens:**
- Writing scenarios AFTER implementation (anti-pattern #1)
- Technical team writing scenarios without product owner
- Copying examples from DOM-based E2E guides

**Consequences:**
- Scenarios break when UI changes (button moved, coordinate shifted)
- Non-technical stakeholders can't understand tests
- Tests provide no documentation value
- Refactoring requires rewriting all scenarios

**Prevention:**
**Phase 1 (Setup):**
- Write scenarios BEFORE implementation
- Use business language: "shoot correct answer" not "click canvas at (x, y)"
- Abstract implementation in step definitions
- Review scenarios with non-technical stakeholder

**Phase 2 (Core Flows):**
```typescript
// Step definition hides implementation
@When('I shoot the correct answer {string}')
async shootCorrectAnswer(answer: string) {
  // Implementation can change without touching scenario
  const answerBlock = await this.gameState.findAnswerBlock(answer);
  await this.page.locator('canvas').click({
    position: { x: answerBlock.x, y: answerBlock.y }
  });
}
```

**Detection:**
- Scenarios mention CSS selectors, coordinates, or element IDs
- Scenarios use words like "click", "div", "button" instead of domain terms
- Product owner can't read scenarios

**Sources:**
- [Cucumber Anti-Patterns Part 1](https://cucumber.io/blog/bdd/cucumber-antipatterns-part-one/)
- [Cucumber Anti-Patterns Part 2](https://cucumber.io/blog/bdd/cucumber-anti-patterns-part-two/)
- [BDD Best Practices](https://www.testevolve.com/blog/best-practices-and-anti-patterns-in-bdd-cucumber-automation-part-1)

---

### MODERATE-3: Bypassing Authentication UI Instead of Testing It

**What goes wrong:**
Tests programmatically create Firebase auth tokens to skip login, meaning the login flow itself is never E2E tested.

**Why it happens:**
- Cypress documentation recommends programmatic auth for speed
- Developers follow recommendation without considering tradeoffs
- Login is slow (2-3 seconds per test)

**Consequences:**
- Login bugs reach production (broken in real browsers, passing in tests)
- No coverage of auth error states (wrong password, network timeout)
- Team discovers login broken when users complain

**Prevention:**
**Phase 2 (Core Flows):**
Use BOTH approaches:
1. **Login E2E test (1 test):** Full login flow with UI, error states
2. **Programmatic auth (other tests):** Skip login for speed

```typescript
// login.spec.ts - TEST login UI
test('User can log in with valid credentials', async ({ page }) => {
  await page.goto('/');
  await page.fill('[data-testid="username"]', 'testuser');
  await page.fill('[data-testid="password"]', 'password123');
  await page.click('[data-testid="login-button"]');
  await expect(page.locator('[data-testid="game-hud"]')).toBeVisible();
});

// gameplay.spec.ts - SKIP login UI
test.beforeEach(async ({ page }) => {
  // Programmatic auth for speed
  await page.addInitScript((token) => {
    localStorage.setItem('firebase_token', token);
  }, await generateFirebaseToken());
  await page.goto('/game');
});
```

**Detection:**
- Zero E2E tests for login flow
- All tests use programmatic auth setup
- Test coverage report shows auth components untested

**Sources:**
- [Programmatic Authentication with Firebase](https://makerkit.dev/blog/tutorials/programmatic-authentication-firebase-cypress)
- [Testing Strategies](https://docs.fireact.dev/best-practices/testing/)

---

### MODERATE-4: Not Using Visual Regression for Canvas

**What goes wrong:**
Team tests game state (score, level, lives) but never validates visual rendering. Bugs like "answer blocks render offscreen" or "particle effects invisible" pass tests but break user experience.

**Why it happens:**
- Canvas state is easy to test (expose `window.gameState`)
- Visual rendering is harder (requires screenshot comparison)
- Assumption that state correctness implies visual correctness

**Consequences:**
- Visual bugs reach production (layout broken, colors wrong, elements overlapping)
- Canvas rendering bugs invisible to state-based tests
- Users report "game looks broken" but tests pass

**Prevention:**
**Phase 4 (Extended Scenarios):**
Add visual regression tests using Playwright's `toHaveScreenshot()`:

```typescript
test('Answer blocks render in correct positions', async ({ page }) => {
  await page.goto('/game');
  await page.waitForFunction(() => window.gameState?.answerBlocks.length === 3);

  // Visual snapshot
  await expect(page.locator('canvas')).toHaveScreenshot('answer-blocks.png', {
    maxDiffPixels: 100,  // Allow minor rendering differences
  });
});
```

**Phase 4 (Extended Scenarios - Config):**
```typescript
// playwright.config.ts
export default defineConfig({
  expect: {
    toHaveScreenshot: {
      maxDiffPixels: 100,
      threshold: 0.2,  // 20% difference tolerance
    },
  },
});
```

**Detection:**
- No screenshot comparison tests
- Visual bugs reported by users but missed by tests
- Test coverage is state-only (no rendering validation)

**Sources:**
- [Visual Regression Testing Vitest vs Playwright](https://mayashavin.com/articles/visual-testing-vitest-playwright)
- [Game Engine Visual Testing](https://github.com/playcanvas/engine/issues/7697)
- [Visual Regression Tools 2026](https://thectoclub.com/tools/best-visual-regression-testing-tools/)

---

### MODERATE-5: Flaky Tests Not Quarantined

**What goes wrong:**
One flaky test (fails 10% of the time) blocks entire CI pipeline. Team either:
1. Re-runs CI until it passes (wastes time)
2. Ignores test failures (defeats purpose of CI)
3. Deletes flaky test (loses coverage)

**Why it happens:**
- Timing issues with animations
- Network flakiness with Firebase calls
- Parallel execution race conditions

**Consequences:**
- CI becomes untrusted ("just re-run it")
- Deployment blocked by flaky tests
- Team morale drops ("tests are useless")
- 6.5% flakiness rate reported in production Cypress suites

**Prevention:**
**Phase 3 (CI/CD):**
Quarantine flaky tests into separate suite:

```typescript
// playwright.config.ts
export default defineConfig({
  projects: [
    {
      name: 'stable',
      testMatch: /.*\.spec\.ts/,
      testIgnore: /.*\.flaky\.spec\.ts/,
    },
    {
      name: 'quarantine',
      testMatch: /.*\.flaky\.spec\.ts/,
      retries: 3,  // Auto-retry flaky tests
    },
  ],
});
```

```yaml
# .github/workflows/e2e.yml
- name: Run Stable Tests
  run: npm run test:e2e -- --project=stable

- name: Run Quarantined Tests (non-blocking)
  run: npm run test:e2e -- --project=quarantine
  continue-on-error: true  # Don't fail build
```

**Phase 3 (CI/CD - Alternative):**
Use retry logic with exponential backoff:
```typescript
test('Score increments on correct answer', async ({ page }) => {
  // Auto-retry on failure
  await expect(async () => {
    await page.reload();
    await shootCorrectAnswer(page);
    await expect(page.locator('[data-testid="score"]')).toHaveText('10');
  }).toPass({ intervals: [1000, 2000, 5000], timeout: 10000 });
});
```

**Detection:**
- Same test fails intermittently (10-30% failure rate)
- CI requires multiple re-runs to pass
- Team starts saying "ignore that test, it's flaky"

**Sources:**
- [Testing in 2026 Strategies](https://www.nucamp.co/blog/testing-in-2026-jest-react-testing-library-and-full-stack-testing-strategies)
- [BuildPulse Flaky Test Detection](https://buildpulse.io/)
- [GitHub Actions Parallel Testing](https://www.testmo.com/guides/github-actions-parallel-testing/)

---

### MODERATE-6: Node.js Version Mismatch (Firebase Emulator + GitHub Actions)

**What goes wrong:**
Firebase Emulator fails in GitHub Actions with "ECONNREFUSED ::1:4400" because Node.js 18+ has IPv6 issues with localhost resolution.

**Why it happens:**
- Node 18 changed localhost resolution behavior
- Firebase Emulator expects IPv4 (127.0.0.1) but gets IPv6 (::1)
- Works locally (Node 16) but fails in CI (Node 18+)

**Consequences:**
- All E2E tests fail in CI
- Developers can't reproduce locally
- Wasted hours debugging "works on my machine"

**Prevention:**
**Phase 1 (Setup):**
```yaml
# .github/workflows/e2e.yml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'  # Use Node 20 (fixed IPv6 issues)

- name: Start Firebase Emulators
  run: |
    firebase emulators:start --only firestore,auth --project demo-project &
  env:
    NODE_OPTIONS: '--dns-result-order=ipv4first'  # Force IPv4
```

**Phase 1 (Setup - Alternative):**
Explicitly use IPv4 address:
```typescript
// firebase.ts
if (import.meta.env.MODE === 'test') {
  connectFirestoreEmulator(db, '127.0.0.1', 8080);  // NOT 'localhost'
}
```

**Detection:**
- CI logs show "ECONNREFUSED ::1:4400"
- Tests pass locally but fail in GitHub Actions
- Firebase Emulator connection errors mention IPv6

**Sources:**
- [Firebase Emulator GitHub Actions Issues](https://medium.com/@g.kawin/lesson-learned-from-firebase-emulator-for-running-an-integration-test-on-github-action-d0c24e5be815)
- [Firebase Emulator Connection Refused](https://github.com/firebase/firebase-tools/issues/2337)

---

## Minor Pitfalls

These cause annoyance but are fixable without major rework.

### MINOR-1: Writing Feature Files After Implementation

**What goes wrong:**
Team builds the game, then writes Gherkin scenarios to match existing implementation. Scenarios become implementation documentation instead of behavior specification.

**Why it happens:**
- Pressure to ship features quickly
- BDD is new to the team
- Treating BDD as "just another test format"

**Consequences:**
- Scenarios don't drive development (miss BDD value)
- Tests are biased toward implementation (don't catch design flaws)
- Scenarios are verbose and technical

**Prevention:**
**Phase 1 (Setup):**
Establish BDD workflow:
1. Write scenario in Gherkin (behavior)
2. Run scenario (fails - no implementation)
3. Write step definitions
4. Implement feature to make scenario pass

**Phase 2 (Core Flows):**
Example workflow:
```gherkin
# 1. Write scenario FIRST
Feature: Math Problem Progression
  Scenario: Player advances to next level after 10 correct answers
    Given I am playing Level 1 with 9 correct answers
    When I answer the next problem correctly
    Then I advance to Level 2
    And I see a "Level Up!" message
```

```typescript
// 2. Implement step definitions (FAILS - no game code yet)
@When('I answer the next problem correctly')
async answerCorrectly() {
  await this.shootCorrectAnswer();
}
```

```typescript
// 3. Implement game feature to make test pass
function checkLevelUp() {
  if (correctAnswers >= 10) {
    level++;
    showLevelUpMessage();
  }
}
```

**Detection:**
- Git history shows feature implementation committed before scenarios
- Scenarios match implementation 1:1 (no discovery of edge cases)
- Team says "we need to write tests for this feature" instead of "we need to write this feature"

**Sources:**
- [Cucumber Anti-Patterns](https://cucumber.io/docs/guides/anti-patterns/)
- [BDD Best Practices](https://www.testevolve.com/blog/best-practices-and-anti-patterns-in-bdd-cucumber-automation-part-1)

---

### MINOR-2: Using Cucumber for Unit Tests

**What goes wrong:**
Team writes Gherkin scenarios for low-level functions like `calculateScore()` or `generateMathProblem()`, making tests verbose and slow.

**Why it happens:**
- Enthusiasm for BDD leads to overuse
- Misunderstanding of BDD scope (business behavior, not code units)
- Cucumber is "the testing framework" so everything uses it

**Consequences:**
- Test suite becomes slow (Cucumber overhead for simple tests)
- Scenarios are unreadable ("Given I have a MathProblem object with operand1=5...")
- Maintenance burden increases (two places to update: Gherkin + step definitions)

**Prevention:**
**Phase 1 (Setup):**
Define test boundaries:
- **Unit tests (Vitest):** Functions, classes, utilities (fast, no BDD)
- **E2E tests (Playwright + Cucumber):** User journeys, business flows (slow, BDD)

```typescript
// GOOD - Unit test for utility function
describe('calculateScore', () => {
  it('awards 10 points for correct answer', () => {
    expect(calculateScore(true, 1)).toBe(10);
  });
});

// BAD - Cucumber for unit test
Scenario: Score calculation
  Given the answer is correct
  And the difficulty level is 1
  When I calculate the score
  Then the score should be 10
```

**Detection:**
- Gherkin files for individual functions or classes
- Scenarios describe data transformations instead of user behavior
- E2E test suite takes >30 minutes for basic flows

**Sources:**
- [Cucumber Anti-Patterns](https://medium.com/@aj.516147/common-anti-patterns-in-cucumber-how-to-avoid-them-ab73c63df180)
- [BDD Testing Without Cucumber](https://www.browserstack.com/guide/playwright-bdd)

---

### MINOR-3: Not Caching Firebase Emulator Binaries in CI

**What goes wrong:**
Every CI run downloads 100+ MB of Firebase Emulator binaries, adding 30-60 seconds to build time.

**Why it happens:**
- GitHub Actions cache not configured
- Unaware that Firebase downloads binaries on first run
- Works fine locally (cached after first download)

**Consequences:**
- Slow CI builds (extra minute per run)
- Wasted bandwidth
- Higher CI costs (more compute time)

**Prevention:**
**Phase 3 (CI/CD):**
```yaml
# .github/workflows/e2e.yml
- name: Cache Firebase Emulators
  uses: actions/cache@v4
  with:
    path: ~/.cache/firebase/emulators
    key: firebase-emulators-${{ runner.os }}

- name: Install Firebase Tools
  run: npm install -g firebase-tools

- name: Start Emulators
  run: firebase emulators:start --only firestore,auth --project demo-project &
```

**Detection:**
- CI logs show "Downloading Cloud Firestore Emulator..."
- CI build takes 30-60s longer than local build
- Multiple CI runs show same download logs

**Sources:**
- [Firebase Emulator GitHub Actions](https://github.com/invertase/firebase-emulator-action)
- [GitHub Actions CI Setup](https://courses.cs.northwestern.edu/394/guides/github-actions-setup.php)

---

### MINOR-4: Over-Specifying Scenarios (Too Many Details)

**What goes wrong:**
Scenarios include unnecessary implementation details:
```gherkin
# BAD - Over-specified
Scenario: Answer math problem
  Given I am on the game page
  And the canvas is 800x600 pixels
  And there are 3 answer blocks
  And the answer blocks are at coordinates (200, 100), (400, 100), (600, 100)
  And the problem is "2 + 2 = ?"
  And the correct answer is "4"
  When I click the canvas at coordinates (400, 100)
  Then the score increments by 10
```

Instead of:
```gherkin
# GOOD - Essential details only
Scenario: Correct answer increases score
  Given I am playing a level with the problem "2 + 2"
  When I shoot the correct answer "4"
  Then my score increases by 10
```

**Why it happens:**
- Translating implementation details directly into Gherkin
- Lack of abstraction in step definitions
- Copy-pasting scenarios and adding details

**Consequences:**
- Scenarios are unreadable
- Small UI changes break many tests
- Maintenance burden increases

**Prevention:**
**Phase 2 (Core Flows):**
Apply "essential details only" rule:
- Include: User intent, business rules, expected outcomes
- Exclude: Coordinates, colors, pixel sizes, CSS classes

```typescript
// Step definition hides implementation details
@Given('I am playing a level with the problem {string}')
async playLevel(problem: string) {
  // Setup game state - coordinates, canvas size, etc. hidden here
  await this.gameState.startLevel(problem);
}
```

**Detection:**
- Scenarios mention CSS classes, coordinates, colors
- Scenarios are >10 lines long
- Non-technical stakeholders say "I don't understand this"

**Sources:**
- [Cucumber Anti-Patterns](https://www.thinkcode.se/blog/2016/06/22/cucumber-antipatterns)
- [BDD Anti-Patterns](https://medium.com/technogise/common-anti-patterns-in-automations-coupled-with-bdd-7cbe50aeb04b)

---

### MINOR-5: Not Deleting Obsolete Scenarios

**What goes wrong:**
Team accumulates hundreds of redundant scenarios. Example:
- `score_increment.feature` (original)
- `score_increment_v2.feature` (refactored)
- `scoring.feature` (consolidated)

All three test the same behavior. Test suite takes 20 minutes instead of 5.

**Why it happens:**
- Fear of deleting tests ("what if we need it?")
- No test review process
- Copy-paste culture (duplicate instead of refactor)

**Consequences:**
- Slow test runs (500 tests instead of 200)
- Maintenance burden (fix same bug in 3 places)
- Flaky test rate increases (more tests = more flake)

**Prevention:**
**Phase 4 (Extended Scenarios):**
Establish test hygiene:
1. Review test suite monthly
2. Delete scenarios made redundant by newer tests
3. Consolidate overlapping scenarios
4. Track test coverage (remove low-value tests)

```bash
# Example cleanup
# Before: 500 tests, 15 minutes
# After: 200 tests, 5 minutes, same coverage

# Delete obsolete
rm features/score_increment.feature  # Replaced by scoring.feature
rm features/score_increment_v2.feature  # Replaced by scoring.feature

# Consolidate
# features/level_up_v1.feature (20 scenarios)
# features/level_up_v2.feature (20 scenarios)
# → features/level_progression.feature (15 scenarios, full coverage)
```

**Detection:**
- Test suite takes >10 minutes for basic flows
- Multiple feature files test same behavior
- Git blame shows scenarios untouched for 6+ months

**Sources:**
- [Cucumber Anti-Patterns](https://medium.com/@aj.516147/common-anti-patterns-in-cucumber-how-to-avoid-them-ab73c63df180)
- [Cypress I Ran 500 Tests](https://medium.com/lets-code-future/cypress-vs-playwright-i-ran-500-e2e-tests-in-both-heres-what-broke-2afc448470ee)

---

## Phase-Specific Warnings

Pitfalls mapped to roadmap phases where they're most likely to occur.

| Phase | Likely Pitfall | Severity | Mitigation |
|-------|---------------|----------|------------|
| **Phase 1: Setup & Configuration** | CRITICAL-2: Production Firebase contamination | CRITICAL | Set up emulator FIRST, add env checks |
| **Phase 1: Setup & Configuration** | CRITICAL-3: Missing Java in CI | CRITICAL | Add Java setup step to workflow |
| **Phase 1: Setup & Configuration** | MODERATE-6: Node version mismatch | MODERATE | Pin Node 20, use IPv4 addresses |
| **Phase 2: Core User Flows** | CRITICAL-1: Testing Canvas via DOM | CRITICAL | Expose game state OR use coordinates |
| **Phase 2: Core User Flows** | MODERATE-1: Hard-coded waits | MODERATE | Disable animations in test mode |
| **Phase 2: Core User Flows** | MODERATE-2: UI-coupled scenarios | MODERATE | Write scenarios BEFORE implementation |
| **Phase 2: Core User Flows** | MODERATE-3: Bypassing auth entirely | MODERATE | Test auth UI once, programmatic elsewhere |
| **Phase 3: CI/CD Integration** | CRITICAL-4: Static WebDriver in parallel | CRITICAL | Use instance-based state, not static |
| **Phase 3: CI/CD Integration** | MODERATE-5: Flaky tests not quarantined | MODERATE | Separate stable vs. quarantine suites |
| **Phase 3: CI/CD Integration** | MINOR-3: No emulator cache | MINOR | Add Firebase cache to workflow |
| **Phase 4: Extended Scenarios** | MODERATE-4: No visual regression | MODERATE | Add screenshot comparison tests |
| **Phase 4: Extended Scenarios** | MINOR-5: Not deleting obsolete tests | MINOR | Monthly test review, delete duplicates |

---

## Canvas-Specific Testing Strategies

Best practices for testing Canvas-based games that don't fit traditional DOM testing.

### Strategy 1: Expose Game State (Recommended)

```typescript
// src/App.tsx
useEffect(() => {
  if (import.meta.env.MODE === 'test') {
    window.gameState = {
      score,
      level,
      lives,
      answerBlocks,
      currentProblem,
      projectiles,
    };
  }
}, [score, level, lives, answerBlocks, currentProblem, projectiles]);
```

```typescript
// tests/gameplay.spec.ts
test('Score increments on correct answer', async ({ page }) => {
  await page.goto('/');
  const initialScore = await page.evaluate(() => window.gameState.score);
  await shootCorrectAnswer(page);
  await page.waitForFunction((prev) => window.gameState.score > prev, initialScore);
  const newScore = await page.evaluate(() => window.gameState.score);
  expect(newScore).toBe(initialScore + 10);
});
```

### Strategy 2: Coordinate-Based Clicks (Fragile)

```typescript
// Calculate answer block position based on game layout
async function clickAnswerBlock(page: Page, answerText: string) {
  const answerBlocks = await page.evaluate(() => window.gameState.answerBlocks);
  const targetBlock = answerBlocks.find(block => block.answer === answerText);
  await page.locator('canvas').click({
    position: { x: targetBlock.x, y: targetBlock.y }
  });
}
```

**Warning:** Breaks if layout changes, resolution changes, or Canvas scaling applied.

### Strategy 3: Test Hooks (Best for Complex Games)

```typescript
// src/game/GameEngine.ts
class GameEngine {
  private testHooks?: {
    onScoreChange?: (score: number) => void;
    onLevelUp?: (level: number) => void;
    onGameOver?: () => void;
  };

  constructor() {
    if (import.meta.env.MODE === 'test') {
      this.testHooks = window.testHooks || {};
    }
  }

  updateScore(delta: number) {
    this.score += delta;
    this.testHooks?.onScoreChange?.(this.score);
  }
}
```

```typescript
// tests/gameplay.spec.ts
test('Score increments on correct answer', async ({ page }) => {
  let scoreChanged = false;
  await page.exposeFunction('onScoreChange', (score: number) => {
    if (score === 10) scoreChanged = true;
  });
  await page.addInitScript(() => {
    window.testHooks = {
      onScoreChange: window.onScoreChange,
    };
  });

  await page.goto('/');
  await shootCorrectAnswer(page);
  await expect.poll(() => scoreChanged).toBe(true);
});
```

---

## Firebase Testing Best Practices

### Best Practice 1: Always Use Emulator in Tests

```typescript
// src/firebase.ts
import { connectFirestoreEmulator } from 'firebase/firestore';

const isTestEnv = import.meta.env.MODE === 'test' ||
                  process.env.NODE_ENV === 'test' ||
                  window.location.hostname.includes('localhost:4000');

if (isTestEnv) {
  connectFirestoreEmulator(db, '127.0.0.1', 8080);  // Use IPv4, not 'localhost'
}
```

### Best Practice 2: Clear Data Between Tests

```typescript
// tests/helpers/firebase.ts
export async function clearFirestoreData() {
  await fetch('http://127.0.0.1:8080/emulator/v1/projects/demo-project/databases/(default)/documents', {
    method: 'DELETE',
  });
}

// tests/setup.ts
beforeEach(async () => {
  await clearFirestoreData();
});
```

### Best Practice 3: Seed Test Data Programmatically

```typescript
// tests/helpers/seed.ts
export async function seedTestUser() {
  await addDoc(collection(db, 'users'), {
    username: 'testuser',
    score: 0,
    level: 1,
  });
}

// tests/leaderboard.spec.ts
test('Leaderboard displays top scores', async ({ page }) => {
  await seedTestUser();
  await page.goto('/leaderboard');
  await expect(page.locator('[data-testid="player-name"]')).toHaveText('testuser');
});
```

---

## GitHub Actions Optimization

### Optimization 1: Matrix Strategy for Parallel Tests

```yaml
# .github/workflows/e2e.yml
jobs:
  e2e:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        shard: [1, 2, 3, 4]
    steps:
      - name: Run Tests (Shard ${{ matrix.shard }})
        run: npm run test:e2e -- --shard=${{ matrix.shard }}/4
```

### Optimization 2: Cache Dependencies

```yaml
- name: Cache Node Modules
  uses: actions/cache@v4
  with:
    path: node_modules
    key: ${{ runner.os }}-node-${{ hashFiles('package-lock.json') }}

- name: Cache Playwright Browsers
  uses: actions/cache@v4
  with:
    path: ~/.cache/ms-playwright
    key: ${{ runner.os }}-playwright-${{ hashFiles('package-lock.json') }}

- name: Cache Firebase Emulators
  uses: actions/cache@v4
  with:
    path: ~/.cache/firebase/emulators
    key: firebase-emulators-${{ runner.os }}
```

### Optimization 3: Fail Fast for Critical Errors

```yaml
jobs:
  e2e:
    strategy:
      fail-fast: true  # Stop all jobs if one fails
      matrix:
        shard: [1, 2, 3, 4]
```

---

## Confidence Assessment

| Category | Confidence | Rationale |
|----------|-----------|-----------|
| Canvas Testing Pitfalls | **MEDIUM** | WebSearch results + accessibility docs, but limited Canvas-specific E2E guidance |
| Firebase Isolation | **HIGH** | Official Firebase docs + recent GitHub issues (2026) |
| BDD/Cucumber Anti-Patterns | **HIGH** | Official Cucumber docs + multiple authoritative sources |
| CI/CD Pitfalls | **HIGH** | Recent 2026 articles + GitHub Actions docs |
| Timing/Animation Issues | **HIGH** | Multiple sources + Playwright official best practices |

### Sources Verification

All critical pitfalls verified with:
- Official documentation (Firebase, Cucumber, Playwright)
- Recent 2026 articles (testing trends, common mistakes)
- Real-world GitHub issues (Firebase emulator, CI setup)

### Low Confidence Areas

1. **Canvas visual regression specifics**: Limited guidance on Canvas-specific screenshot comparison (generic visual testing only)
2. **Game engine testing patterns**: Most sources are generic E2E, not game-specific
3. **React 19 compatibility**: Very recent release, limited E2E testing guidance

---

## Recommended Deep Research Topics

Areas requiring phase-specific investigation:

### Phase 2: Core Flows
- **Topic:** Optimal Canvas testing strategy for this specific game
- **Question:** Expose state vs. coordinate clicks vs. test hooks?
- **Why:** Need to validate approach works with 60 FPS animation + particle effects

### Phase 3: CI/CD
- **Topic:** GitHub Actions browser installation
- **Question:** Use Playwright's built-in browsers or custom install?
- **Why:** Optimize CI build time (browser download is slowest step)

### Phase 4: Extended Scenarios
- **Topic:** Visual regression tolerance tuning
- **Question:** What `maxDiffPixels` threshold prevents false positives?
- **Why:** Canvas rendering varies slightly across environments

---

## Summary: Top 5 Pitfalls to Avoid

1. **CRITICAL-2: Production Firebase Contamination** - Set up emulator FIRST, before any E2E tests
2. **CRITICAL-1: Testing Canvas via DOM** - Expose game state or use coordinates, not `.locator()`
3. **CRITICAL-3: Missing Java in CI** - Add Java setup step to GitHub Actions workflow
4. **MODERATE-1: Hard-Coded Waits** - Disable animations in test mode, use state-based waits
5. **MODERATE-2: UI-Coupled Scenarios** - Write Gherkin scenarios BEFORE implementation

Follow these 5 and you'll avoid 80% of E2E testing pain in this project.

---

## Sources

### Canvas Testing
- [Playwright vs Cypress: The 2026 Enterprise Testing Guide](https://devin-rosario.medium.com/playwright-vs-cypress-the-2026-enterprise-testing-guide-ade8b56d3478)
- [HTML5 Canvas Accessibility](https://pauljadam.com/demos/canvas.html)
- [Chart.js Accessibility](https://www.chartjs.org/docs/latest/general/accessibility.html)

### Firebase Testing
- [Firebase Security Rules Unit Tests](https://firebase.google.com/docs/rules/unit-tests)
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)
- [Programmatic Authentication with Firebase and Cypress](https://makerkit.dev/blog/tutorials/programmatic-authentication-firebase-cypress)
- [Firebase Emulator GitHub Actions Issues](https://medium.com/@g.kawin/lesson-learned-from-firebase-emulator-for-running-an-integration-test-on-github-action-d0c24e5be815)
- [Firebase Tools GitHub Issues](https://github.com/firebase/firebase-tools/issues/2337)

### BDD/Cucumber
- [Cucumber Anti-Patterns Official](https://cucumber.io/docs/guides/anti-patterns/)
- [Cucumber Anti-Patterns Part 1](https://cucumber.io/blog/bdd/cucumber-antipatterns-part-one/)
- [Cucumber Anti-Patterns Part 2](https://cucumber.io/blog/bdd/cucumber-anti-patterns-part-two/)
- [Common Anti-Patterns in Cucumber](https://medium.com/@aj.516147/common-anti-patterns-in-cucumber-how-to-avoid-them-ab73c63df180)
- [BDD Best Practices](https://www.testevolve.com/blog/best-practices-and-anti-patterns-in-bdd-cucumber-automation-part-1)

### CI/CD & GitHub Actions
- [GitHub Actions Parallel Testing](https://www.testmo.com/guides/github-actions-parallel-testing/)
- [Testing in 2026 Strategies](https://www.nucamp.co/blog/testing-in-2026-jest-react-testing-library-and-full-stack-testing-strategies)
- [BuildPulse Flaky Test Detection](https://buildpulse.io/)

### Animation & Timing
- [Configure Timeouts And Delays in E2E Tests](https://elvanco.com/blog/how-to-configure-timeouts-and-delays-in-e2e-tests)
- [Dealing with Timing Issues in E2E Tests](https://www.joshmorony.com/dealing-with-timing-issues-in-ionic-e2e-tests/)
- [Playwright Best Practices 2026](https://www.browserstack.com/guide/playwright-best-practices)

### Visual Regression
- [Visual Testing Vitest vs Playwright](https://mayashavin.com/articles/visual-testing-vitest-playwright)
- [PlayCanvas Engine Visual Testing Proposal](https://github.com/playcanvas/engine/issues/7697)
- [Best Visual Regression Testing Tools 2026](https://thectoclub.com/tools/best-visual-regression-testing-tools/)
