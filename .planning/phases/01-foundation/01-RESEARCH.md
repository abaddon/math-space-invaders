# Phase 1: Foundation Setup - Research

**Researched:** 2026-01-22
**Domain:** E2E Testing with Playwright + Cucumber BDD
**Confidence:** HIGH

## Summary

Phase 1 establishes the testing infrastructure for BDD-style E2E tests using playwright-bdd (version 8.4.2), which converts Gherkin feature files into Playwright test files. Unlike traditional Cucumber runners, playwright-bdd generates test files that run directly via the Playwright test runner, providing full access to Playwright's parallelization, reporting, and debugging capabilities.

The standard approach uses a two-command workflow: `bddgen` generates test files from features/steps, then `playwright test` executes them. This separation enables watch mode, better IDE integration, and leverages Playwright's built-in TypeScript compilation.

**Primary recommendation:** Use playwright-bdd 8.4.2 with `defineBddConfig()` in playwright.config.ts, organize tests in `/e2e` directory with feature-based subdirectories, and leverage Playwright's automatic screenshot-on-failure rather than custom hooks.

## Standard Stack

The established libraries/tools for Playwright + BDD testing:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| playwright-bdd | ^8.4.2 | BDD test generation | Official Playwright BDD integration, actively maintained, 591+ stars |
| @playwright/test | ^1.50+ | Test runner | Required peer dependency, provides fixtures and runner |
| @cucumber/cucumber | ^11.0+ | Gherkin parsing | Peer dependency for feature file parsing |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @types/node | latest | Node.js types | TypeScript projects (this project uses TS) |
| typescript | ~5.9.3 | TypeScript compiler | Already in project devDependencies |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| playwright-bdd | @cucumber/cucumber directly | Lose Playwright runner benefits (parallelization, trace viewer, fixtures) |
| playwright-bdd | Playwright without BDD | Lose business-readable Gherkin syntax |

**Installation:**
```bash
npm install -D playwright-bdd @playwright/test
npx playwright install chromium
```

## Architecture Patterns

### Recommended Project Structure
```
MathSpaceInvadersWeb/
├── e2e/
│   ├── config/
│   │   └── playwright.config.ts      # Playwright + BDD config
│   ├── features/
│   │   ├── onboarding/              # Feature-based organization
│   │   │   ├── user-login.feature
│   │   │   └── steps.ts             # Co-located steps
│   │   ├── playing/
│   │   │   ├── game-start.feature
│   │   │   └── steps.ts
│   │   └── social/
│   │       ├── leaderboard.feature
│   │       └── steps.ts
│   ├── pages/                        # Page Object Model
│   │   ├── LoginPage.ts
│   │   ├── GamePage.ts
│   │   └── LeaderboardPage.ts
│   └── support/
│       ├── fixtures.ts               # Custom fixtures
│       └── world.ts                  # Custom World (optional)
├── .features-gen/                    # Auto-generated (gitignored)
├── test-results/                     # Auto-cleaned by Playwright
└── playwright-report/                # HTML reports
```

### Pattern 1: defineBddConfig() Setup
**What:** Configuration function that defines BDD test generation settings
**When to use:** Required in playwright.config.ts for playwright-bdd
**Example:**
```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

const testDir = defineBddConfig({
  paths: ['e2e/features/**/*.feature'],
  require: ['e2e/features/**/*.ts'],
});

export default defineConfig({
  testDir,
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
    viewport: { width: 1920, height: 1080 },
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  reporter: [
    ['html', { open: 'always' }],
    ['line'],
  ],
  outputDir: 'test-results',
});
```

### Pattern 2: Co-located Steps with Features
**What:** Place step definitions in same directory as feature files
**When to use:** Default organization for playwright-bdd 8.x
**Example:**
```
features/
├── onboarding/
│   ├── user-login.feature
│   └── steps.ts          # Steps only for user-login.feature
```

### Pattern 3: Page Object as Fixture
**What:** Use Playwright fixtures to inject Page Objects into steps
**When to use:** Always - cleaner than Custom World pattern
**Example:**
```typescript
// support/fixtures.ts
import { test as base } from 'playwright-bdd';
import { LoginPage } from '../pages/LoginPage';

export const test = base.extend<{ loginPage: LoginPage }>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
});

// features/onboarding/steps.ts
import { Given, When, Then } from 'playwright-bdd/decorators';
import { test } from '../../support/fixtures';

Given('I am on the login page', async ({ loginPage }) => {
  await loginPage.navigate();
});
```

### Pattern 4: Two-Command Workflow
**What:** Separate test generation from test execution
**When to use:** All test runs
**Example:**
```json
// package.json
{
  "scripts": {
    "test:e2e": "npx bddgen && npx playwright test",
    "test:e2e:headed": "npx bddgen && npx playwright test --headed",
    "test:e2e:ui": "npx bddgen && npx playwright test --ui"
  }
}
```

### Anti-Patterns to Avoid
- **Manual importTestFrom configuration:** Version 8.x auto-detects test imports, manual config is deprecated
- **Custom Before/After hooks for screenshots:** Use Playwright's built-in `screenshot: 'only-on-failure'` instead
- **Global step definitions:** Co-locate steps with features to avoid conflicts
- **Custom World for simple cases:** Use fixtures pattern instead (simpler, better TypeScript support)

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Screenshot on failure | Custom afterEach hook | `screenshot: 'only-on-failure'` config | Playwright captures immediately after failure, before hooks run |
| Browser lifecycle | Custom Before/After hooks | Playwright fixtures | Auto-cleanup, parallel execution support, better DI |
| Dev server management | Manual spawn/kill scripts | `webServer` config | Playwright manages lifecycle, waits for server ready |
| Test file cleanup | Custom rimraf scripts | Playwright auto-cleanup | `outputDir` cleaned automatically before each run |
| TypeScript compilation | ts-node/register | Playwright's built-in loader | Faster, handles ESM correctly, no configuration needed |
| Step definition imports | Manual test.extend() | Auto-detection in v8.x | Simpler config, less boilerplate |

**Key insight:** Playwright-bdd is designed to leverage Playwright's runner capabilities. Don't replicate traditional Cucumber patterns (World, hooks) when Playwright provides better alternatives (fixtures, config).

## Common Pitfalls

### Pitfall 1: Using Deprecated World Pattern
**What goes wrong:** Version 7 used `World` and `WorldOptions`, but version 8 may have renamed these to `BddWorld` and `BddWorldOptions`
**Why it happens:** Outdated tutorials reference old API
**How to avoid:** Use fixture pattern instead of Custom World for most cases. If World is needed, check current playwright-bdd API docs for correct import names
**Warning signs:** Import errors for `World` or `WorldOptions`

### Pitfall 2: Wrong Output Directory Structure
**What goes wrong:** Multiple projects share same `outputDir`, causing file conflicts and screenshot storage issues
**Why it happens:** playwright-bdd requires unique `outputDir` per project configuration
**How to avoid:** Each `defineBddConfig()` call must have unique `outputDir`. For single project, use default returned value as `testDir`
**Warning signs:** "outputDir already in use" errors, missing screenshots

### Pitfall 3: Duplicate Step Definitions
**What goes wrong:** "Multiple step definitions match..." error
**Why it happens:** Traditional Cucumber loads all steps globally; playwright-bdd 8.x supports scoped steps
**How to avoid:** Organize steps by feature directory, or use scoped directories with parentheses notation `(feature-name)/`
**Warning signs:** Ambiguous step definition errors during bddgen

### Pitfall 4: Missing bddgen Before Test Run
**What goes wrong:** No tests found, or tests run stale code
**Why it happens:** Forgot to run `bddgen` to regenerate test files after feature/step changes
**How to avoid:** Chain commands in package.json: `"test:e2e": "npx bddgen && npx playwright test"`
**Warning signs:** Feature changes don't appear in test runs, "no tests found" errors

### Pitfall 5: CI Environment Variables
**What goes wrong:** Dev server reuse fails in CI, tests hang
**Why it happens:** `reuseExistingServer` defaults to true, but CI needs fresh server
**How to avoid:** Use `reuseExistingServer: !process.env.CI` pattern
**Warning signs:** CI hangs on webServer startup, timeout errors

### Pitfall 6: TypeScript Configuration Conflicts
**What goes wrong:** Step definitions not found, import errors
**Why it happens:** Playwright only supports specific tsconfig options: `allowJs`, `baseUrl`, `paths`, `references`
**How to avoid:** Keep tsconfig simple, rely on Playwright's built-in TypeScript loader
**Warning signs:** Module resolution errors, "Cannot find module" for step definitions

### Pitfall 7: Manual Screenshot Hooks
**What goes wrong:** Screenshots captured after DOM changes, less useful for debugging
**Why it happens:** Using afterEach hooks, which run after state changes
**How to avoid:** Use `screenshot: 'only-on-failure'` config - Playwright captures immediately after failure
**Warning signs:** Screenshots don't show actual failure state

## Code Examples

Verified patterns from official sources:

### Minimal playwright.config.ts with BDD
```typescript
// Source: playwright-bdd documentation, version 8.x
import { defineConfig } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

const testDir = defineBddConfig({
  paths: ['e2e/features/**/*.feature'],
  require: ['e2e/features/**/*.ts'],
});

export default defineConfig({
  testDir,
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
    actionTimeout: 10000,
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  reporter: [['html', { open: 'always' }]],
});
```

### Feature File Example
```gherkin
# Source: Gherkin best practices + user context decisions
# e2e/features/onboarding/user-login.feature

Feature: User Login
  As a player
  I want to log in to my account
  So I can access my saved progress

  @smoke
  Scenario: Successful login with valid credentials
    Given I am on the login page
    When I enter username "player1" and password "password123"
    And I click the login button
    Then I should see the main menu
    And I should see my username "player1" displayed

  Scenario: Failed login with invalid credentials
    Given I am on the login page
    When I enter username "invalid" and password "wrong"
    And I click the login button
    Then I should see an error message "Invalid credentials"
```

### Step Definitions (Co-located)
```typescript
// Source: playwright-bdd documentation + fixtures pattern
// e2e/features/onboarding/steps.ts
import { Given, When, Then } from 'playwright-bdd/decorators';
import { expect } from '@playwright/test';
import { test } from '../../support/fixtures';

Given('I am on the login page', async ({ loginPage }) => {
  await loginPage.navigate();
});

When('I enter username {string} and password {string}',
  async ({ loginPage }, username: string, password: string) => {
    await loginPage.enterCredentials(username, password);
});

When('I click the login button', async ({ loginPage }) => {
  await loginPage.clickLogin();
});

Then('I should see the main menu', async ({ page }) => {
  await expect(page.locator('[data-testid="main-menu"]')).toBeVisible();
});

Then('I should see my username {string} displayed',
  async ({ page }, username: string) => {
    await expect(page.locator('[data-testid="user-display"]'))
      .toContainText(username);
});

Then('I should see an error message {string}',
  async ({ page }, errorMessage: string) => {
    await expect(page.locator('[data-testid="error-message"]'))
      .toContainText(errorMessage);
});
```

### Page Object Model
```typescript
// Source: Playwright POM best practices
// e2e/pages/LoginPage.ts
import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.locator('[data-testid="username-input"]');
    this.passwordInput = page.locator('[data-testid="password-input"]');
    this.loginButton = page.locator('[data-testid="login-button"]');
    this.errorMessage = page.locator('[data-testid="error-message"]');
  }

  async navigate() {
    await this.page.goto('/');
  }

  async enterCredentials(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
  }

  async clickLogin() {
    await this.loginButton.click();
  }

  async getErrorMessage(): Promise<string> {
    return await this.errorMessage.textContent() || '';
  }
}
```

### Custom Fixtures Setup
```typescript
// Source: playwright-bdd fixtures documentation
// e2e/support/fixtures.ts
import { test as base } from 'playwright-bdd';
import { LoginPage } from '../pages/LoginPage';
import { GamePage } from '../pages/GamePage';

type CustomFixtures = {
  loginPage: LoginPage;
  gamePage: GamePage;
};

export const test = base.extend<CustomFixtures>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  gamePage: async ({ page }, use) => {
    const gamePage = new GamePage(page);
    await use(gamePage);
  },
});

export { expect } from '@playwright/test';
```

### Package.json Scripts
```json
// Source: playwright-bdd workflow patterns + user context
{
  "scripts": {
    "test:e2e": "npx bddgen && npx playwright test",
    "test:e2e:headed": "npx bddgen && npx playwright test --headed",
    "test:e2e:ui": "npx bddgen && npx playwright test --ui",
    "test:e2e:debug": "npx bddgen && npx playwright test --debug",
    "test:e2e:smoke": "npx bddgen --tags @smoke && npx playwright test"
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Cucumber runner | Playwright runner | v7.0 (2024) | Full Playwright features: parallelization, trace viewer, fixtures |
| Manual `importTestFrom` | Auto-detection | v8.0 (2025) | Simpler config, less boilerplate |
| Custom World pattern | Fixtures pattern | v8.0 (2025) | Better TypeScript support, cleaner DI |
| requireModule for TS | Playwright's loader | v8.0 (2025) | Faster compilation, ESM support |
| Global step definitions | Scoped step definitions | v8.0 (2025) | Prevents duplicate step errors |

**Deprecated/outdated:**
- **`importTestFrom` config:** v8.x auto-detects, manual config unnecessary
- **`requireModule: ['ts-node/register']`:** Playwright compiles TS natively
- **Minimum Node 16:** v8.x requires Node 18+
- **Minimum Playwright 1.34:** v8.x requires Playwright 1.35+

## Open Questions

Things that couldn't be fully resolved:

1. **Custom World vs Fixtures for Canvas Testing**
   - What we know: Fixtures pattern is recommended for most cases
   - What's unclear: Whether Canvas-specific context (CanvasInteractor) needs Custom World or can use fixtures
   - Recommendation: Start with fixtures pattern, migrate to Custom World only if fixtures prove insufficient

2. **Firebase Emulator Integration**
   - What we know: Firebase Emulator needed for test data isolation (from user context)
   - What's unclear: How to configure webServer to launch both Vite dev server AND Firebase Emulator
   - Recommendation: Research Phase 2 should investigate multi-server configuration or Before/BeforeAll hooks for emulator lifecycle

3. **Exact playwright-bdd World/BddWorld API in 8.4.2**
   - What we know: Version 7 had World, version 8 may have renamed it
   - What's unclear: Current export names in 8.4.2 (documentation site didn't provide full API reference)
   - Recommendation: During implementation, verify actual exports from 'playwright-bdd' package

## Sources

### Primary (HIGH confidence)
- [playwright-bdd GitHub repository](https://github.com/vitalets/playwright-bdd) - Latest version 8.4.2, installation, workflow
- [playwright-bdd CHANGELOG](https://github.com/vitalets/playwright-bdd/blob/main/CHANGELOG.md) - Version 8.x breaking changes and features
- [Playwright Official Documentation - Configuration](https://playwright.dev/docs/test-configuration) - baseURL, webServer, screenshot config
- [Playwright Official Documentation - Reporters](https://playwright.dev/docs/test-reporters) - HTML reporter open options
- [Playwright Official Documentation - Fixtures](https://playwright.dev/docs/test-fixtures) - Custom fixtures pattern
- [Playwright Official Documentation - Web Server](https://playwright.dev/docs/test-webserver) - webServer configuration

### Secondary (MEDIUM confidence)
- [playwright-bdd DeepWiki - Getting Started](https://deepwiki.com/vitalets/playwright-bdd/2-getting-started) - Installation and setup workflow
- [playwright-bdd DeepWiki - API Reference](https://deepwiki.com/vitalets/playwright-bdd/9-api-reference) - defineBddConfig options
- [playwright-bdd DeepWiki - Hooks and Fixtures](https://deepwiki.com/vitalets/playwright-bdd/4.3-hooks-and-fixtures) - Hook types and usage
- [playwright-bdd DeepWiki - Multiple Projects](https://deepwiki.com/vitalets/playwright-bdd/5.3-multiple-projects) - outputDir uniqueness requirement
- [Playwright + BDD with TypeScript Guide (Dec 2025)](https://medium.com/@sreekanth.parikipandla/playwright-bdd-with-typescript-a-practical-guide-to-fast-readable-e2e-tests-6bd1dca6b3d1) - Configuration examples
- [Hooks vs Background in Playwright BDD (Jan 2026)](https://medium.com/@alpanamishra2009/hooks-vs-background-in-playwright-bdd-what-goes-where-b308e635cee1) - Hook best practices

### Tertiary (LOW confidence)
- [15 Best Practices for Playwright testing in 2026](https://www.browserstack.com/guide/playwright-best-practices) - General testing patterns
- [Playwright BDD Testing Without Cucumber](https://www.browserstack.com/guide/playwright-bdd) - Alternative approaches (not using playwright-bdd)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official package verified, version 8.4.2 confirmed from CHANGELOG
- Architecture: HIGH - Patterns verified from official documentation and recent guides (2025-2026)
- Pitfalls: MEDIUM - Based on GitHub issues and community discussions, not exhaustive official documentation
- Code examples: HIGH - Derived from official Playwright docs and playwright-bdd patterns

**Research date:** 2026-01-22
**Valid until:** 2026-02-22 (30 days - playwright-bdd is stable, updates quarterly)
