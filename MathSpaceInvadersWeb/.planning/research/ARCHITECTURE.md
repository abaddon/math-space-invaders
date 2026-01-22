# Architecture Research: E2E Test Organization

**Project:** Math Space Invaders Web
**Domain:** Playwright + Cucumber BDD E2E Testing
**Researched:** 2026-01-22
**Confidence:** HIGH

## Executive Summary

This research establishes the architecture for organizing Playwright + Cucumber E2E tests for a Canvas-based React game application. The recommended structure separates E2E tests from source code, uses domain-based Page Object Model organization, and addresses the unique challenges of testing HTML5 Canvas game elements.

**Key architectural decisions:**
- E2E tests in separate `/e2e` directory at project root (not in `/src`)
- Domain-driven Page Object Model organization (by feature area, not by page)
- Custom World pattern with Playwright fixtures for Cucumber integration
- Coordinate-based Canvas interaction pattern for game elements
- Role-based locators for UI, data-testid for Canvas/dynamic elements

## Recommended Directory Structure

Based on research into 2026 best practices for Playwright-Cucumber-TypeScript projects and E2E test organization patterns.

```
MathSpaceInvadersWeb/
├── src/                           # Application code (existing)
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── ...
├── test/                          # Unit tests (existing Vitest)
│   └── setup.ts
├── e2e/                           # E2E tests (NEW)
│   ├── config/
│   │   ├── cucumber.config.ts     # Cucumber configuration
│   │   ├── selectors.json         # Shared selectors/constants
│   │   └── test-data.json         # Test data fixtures
│   ├── features/                  # Gherkin feature files
│   │   ├── authentication/
│   │   │   ├── login.feature
│   │   │   └── signup.feature
│   │   ├── gameplay/
│   │   │   ├── game-start.feature
│   │   │   ├── answer-selection.feature
│   │   │   └── level-progression.feature
│   │   ├── leaderboard/
│   │   │   └── leaderboard.feature
│   │   └── teams/
│   │       ├── create-team.feature
│   │       ├── join-team.feature
│   │       └── team-management.feature
│   ├── step-definitions/          # Cucumber step implementations
│   │   ├── authentication.steps.ts
│   │   ├── gameplay.steps.ts
│   │   ├── leaderboard.steps.ts
│   │   ├── teams.steps.ts
│   │   └── common.steps.ts        # Shared/generic steps
│   ├── pages/                     # Page Object Model
│   │   ├── base/
│   │   │   └── BasePage.ts        # Base page class
│   │   ├── auth/
│   │   │   └── AuthPage.ts
│   │   ├── game/
│   │   │   ├── GamePage.ts
│   │   │   ├── CanvasInteractor.ts # Canvas-specific helper
│   │   │   └── HUDComponent.ts
│   │   ├── leaderboard/
│   │   │   └── LeaderboardPage.ts
│   │   ├── teams/
│   │   │   ├── TeamsPage.ts
│   │   │   ├── CreateTeamModal.ts
│   │   │   └── TeamSettingsModal.ts
│   │   └── settings/
│   │       └── SettingsPage.ts
│   ├── support/                   # Test infrastructure
│   │   ├── custom-world.ts        # Cucumber World + Playwright
│   │   ├── hooks.ts               # Before/After hooks
│   │   ├── fixtures.ts            # Playwright fixtures
│   │   └── helpers/
│   │       ├── wait-helpers.ts
│   │       ├── screenshot-helpers.ts
│   │       └── canvas-helpers.ts  # Canvas-specific utilities
│   └── tsconfig.json              # E2E-specific TypeScript config
├── playwright.config.ts           # Playwright configuration
└── package.json
```

**Rationale:**
- **Separation from src/**: E2E tests are deployment artifacts, not application code. Keeping them separate improves build times and clarifies boundaries.
- **Domain organization**: Features, steps, and pages organized by feature area (auth, gameplay, teams) improves maintainability as the project scales.
- **Explicit support/ directory**: Test infrastructure (World, hooks, fixtures) is centralized and reusable.

## Page Object Model Implementation

### Pattern Overview

Use the **domain-driven Page Object Model** where Page Objects represent feature areas rather than strict page boundaries. This suits the application's modal-heavy architecture.

### Base Page Pattern

```typescript
// e2e/pages/base/BasePage.ts
import { Page, Locator } from '@playwright/test';

export abstract class BasePage {
  protected readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // Common navigation
  async goto(path: string): Promise<void> {
    await this.page.goto(path);
  }

  // Common waiting patterns
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  // Common assertions
  async expectVisible(locator: Locator): Promise<void> {
    await expect(locator).toBeVisible();
  }

  // Screenshot helper
  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `screenshots/${name}.png` });
  }
}
```

### Standard Page Object Example

```typescript
// e2e/pages/auth/AuthPage.ts
import { Page } from '@playwright/test';
import { BasePage } from '../base/BasePage';

export class AuthPage extends BasePage {
  // Locators using role-based selectors (preferred for accessibility)
  private readonly usernameInput = this.page.getByRole('textbox', { name: 'Username' });
  private readonly passwordInput = this.page.getByRole('textbox', { name: 'Password' });
  private readonly loginButton = this.page.getByRole('button', { name: 'Login' });
  private readonly signupButton = this.page.getByRole('button', { name: 'Sign Up' });
  private readonly errorMessage = this.page.getByRole('alert');

  constructor(page: Page) {
    super(page);
  }

  // High-level actions
  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    await this.waitForPageLoad();
  }

  async expectLoginError(message: string): Promise<void> {
    await this.expectVisible(this.errorMessage);
    await expect(this.errorMessage).toHaveText(message);
  }

  async navigateToSignup(): Promise<void> {
    await this.signupButton.click();
  }
}
```

### Canvas-Specific Page Object Pattern

**Challenge:** Canvas elements don't expose traditional DOM elements. Solution: Coordinate-based interactions with helper abstraction.

```typescript
// e2e/pages/game/CanvasInteractor.ts
import { Page, Locator } from '@playwright/test';

export interface CanvasCoordinates {
  x: number;
  y: number;
}

export interface AnswerBlock {
  position: 'left' | 'center' | 'right';
  coordinates: CanvasCoordinates;
}

export class CanvasInteractor {
  private readonly canvas: Locator;

  // Pre-calculated answer block positions (percentage-based for responsiveness)
  private readonly answerBlockPositions = {
    left: { xPercent: 0.15, yPercent: 0.25 },
    center: { xPercent: 0.5, yPercent: 0.25 },
    right: { xPercent: 0.85, yPercent: 0.25 }
  };

  constructor(private readonly page: Page) {
    // Use data-testid for Canvas element since it has no role
    this.canvas = page.locator('[data-testid="game-canvas"]');
  }

  // Convert percentage-based position to absolute coordinates
  private async getAbsoluteCoordinates(
    xPercent: number,
    yPercent: number
  ): Promise<CanvasCoordinates> {
    const boundingBox = await this.canvas.boundingBox();
    if (!boundingBox) throw new Error('Canvas not found');

    return {
      x: boundingBox.x + (boundingBox.width * xPercent),
      y: boundingBox.y + (boundingBox.height * yPercent)
    };
  }

  // Click answer block by position
  async clickAnswerBlock(position: 'left' | 'center' | 'right'): Promise<void> {
    const positionConfig = this.answerBlockPositions[position];
    const coords = await this.getAbsoluteCoordinates(
      positionConfig.xPercent,
      positionConfig.yPercent
    );

    await this.canvas.click({
      position: {
        x: coords.x,
        y: coords.y
      }
    });
  }

  // Click answer block by value (requires reading HUD)
  async clickAnswerWithValue(value: string): Promise<void> {
    // This would require OCR or checking game state via test hooks
    // For now, implement via position and separate verification
    throw new Error('Not implemented - use clickAnswerBlock + verification');
  }

  // Wait for canvas to be ready
  async waitForGameReady(): Promise<void> {
    await this.canvas.waitFor({ state: 'visible' });
    // Additional wait for game engine initialization
    await this.page.waitForTimeout(500);
  }

  // Take canvas screenshot for debugging
  async screenshotCanvas(name: string): Promise<void> {
    await this.canvas.screenshot({ path: `screenshots/canvas-${name}.png` });
  }
}
```

```typescript
// e2e/pages/game/GamePage.ts
import { Page } from '@playwright/test';
import { BasePage } from '../base/BasePage';
import { CanvasInteractor } from './CanvasInteractor';
import { HUDComponent } from './HUDComponent';

export class GamePage extends BasePage {
  private readonly canvas: CanvasInteractor;
  private readonly hud: HUDComponent;

  // UI elements outside canvas use role-based locators
  private readonly startButton = this.page.getByRole('button', { name: 'Start Game' });
  private readonly pauseButton = this.page.getByRole('button', { name: 'Pause' });
  private readonly menuButton = this.page.getByRole('button', { name: 'Menu' });

  constructor(page: Page) {
    super(page);
    this.canvas = new CanvasInteractor(page);
    this.hud = new HUDComponent(page);
  }

  // High-level game actions
  async startGame(): Promise<void> {
    await this.startButton.click();
    await this.canvas.waitForGameReady();
  }

  async answerQuestion(position: 'left' | 'center' | 'right'): Promise<void> {
    await this.canvas.clickAnswerBlock(position);
  }

  async getCurrentScore(): Promise<number> {
    return await this.hud.getScore();
  }

  async getCurrentLevel(): Promise<number> {
    return await this.hud.getLevel();
  }

  async expectGameOver(): Promise<void> {
    const gameOverScreen = this.page.getByRole('heading', { name: 'Game Over' });
    await this.expectVisible(gameOverScreen);
  }
}
```

```typescript
// e2e/pages/game/HUDComponent.ts
import { Page, Locator } from '@playwright/test';

export class HUDComponent {
  // Use data-testid for HUD elements (may be Canvas-rendered or DOM)
  private readonly scoreDisplay: Locator;
  private readonly levelDisplay: Locator;
  private readonly livesDisplay: Locator;

  constructor(private readonly page: Page) {
    this.scoreDisplay = page.locator('[data-testid="hud-score"]');
    this.levelDisplay = page.locator('[data-testid="hud-level"]');
    this.livesDisplay = page.locator('[data-testid="hud-lives"]');
  }

  async getScore(): Promise<number> {
    const scoreText = await this.scoreDisplay.textContent();
    return parseInt(scoreText?.replace(/\D/g, '') || '0');
  }

  async getLevel(): Promise<number> {
    const levelText = await this.levelDisplay.textContent();
    return parseInt(levelText?.replace(/\D/g, '') || '0');
  }

  async getLives(): Promise<number> {
    const livesText = await this.livesDisplay.textContent();
    return parseInt(livesText?.replace(/\D/g, '') || '0');
  }

  async expectScore(expected: number): Promise<void> {
    await expect(this.scoreDisplay).toContainText(expected.toString());
  }
}
```

### Modal Page Object Pattern

```typescript
// e2e/pages/teams/CreateTeamModal.ts
import { Page } from '@playwright/test';
import { BasePage } from '../base/BasePage';

export class CreateTeamModal extends BasePage {
  // Modal-specific locators
  private readonly modal = this.page.getByRole('dialog', { name: 'Create Team' });
  private readonly teamNameInput = this.modal.getByRole('textbox', { name: 'Team Name' });
  private readonly descriptionInput = this.modal.getByRole('textbox', { name: 'Description' });
  private readonly createButton = this.modal.getByRole('button', { name: 'Create' });
  private readonly cancelButton = this.modal.getByRole('button', { name: 'Cancel' });

  constructor(page: Page) {
    super(page);
  }

  async waitForOpen(): Promise<void> {
    await this.expectVisible(this.modal);
  }

  async createTeam(name: string, description?: string): Promise<void> {
    await this.teamNameInput.fill(name);
    if (description) {
      await this.descriptionInput.fill(description);
    }
    await this.createButton.click();
    await this.waitForClose();
  }

  async waitForClose(): Promise<void> {
    await this.modal.waitFor({ state: 'hidden' });
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
    await this.waitForClose();
  }
}
```

## Fixtures and Hooks Organization

### Custom World Pattern

Cucumber doesn't use Playwright's native test runner, so we implement fixtures via Custom World and hooks.

```typescript
// e2e/support/custom-world.ts
import { World, IWorldOptions, setWorldConstructor } from '@cucumber/cucumber';
import { Browser, BrowserContext, Page, chromium } from '@playwright/test';

export interface CustomWorldOptions extends IWorldOptions {
  browser?: Browser;
  context?: BrowserContext;
  page?: Page;
}

export class CustomWorld extends World {
  browser?: Browser;
  context?: BrowserContext;
  page?: Page;

  constructor(options: IWorldOptions) {
    super(options);
  }

  // Initialize browser, context, and page
  async init(browserType: 'chromium' | 'firefox' | 'webkit' = 'chromium'): Promise<void> {
    this.browser = await chromium.launch({
      headless: process.env.HEADLESS !== 'false'
    });

    this.context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 },
      recordVideo: process.env.RECORD_VIDEO ? { dir: 'test-results/videos' } : undefined
    });

    this.page = await this.context.newPage();
  }

  // Cleanup
  async cleanup(): Promise<void> {
    if (this.page) await this.page.close();
    if (this.context) await this.context.close();
    if (this.browser) await this.browser.close();
  }
}

setWorldConstructor(CustomWorld);
```

### Hooks Configuration

```typescript
// e2e/support/hooks.ts
import { Before, After, Status, BeforeAll, AfterAll } from '@cucumber/cucumber';
import { CustomWorld } from './custom-world';

BeforeAll(async function() {
  console.log('Starting E2E test suite...');
});

Before(async function(this: CustomWorld) {
  // Initialize browser for each scenario
  await this.init();

  // Navigate to base URL
  await this.page!.goto(process.env.BASE_URL || 'http://localhost:5173');
});

After(async function(this: CustomWorld, { result, pickle }) {
  // Take screenshot on failure
  if (result?.status === Status.FAILED) {
    const screenshot = await this.page!.screenshot({
      path: `test-results/screenshots/${pickle.name}-failure.png`,
      fullPage: true
    });

    // Attach to Cucumber report
    this.attach(screenshot, 'image/png');
  }

  // Cleanup browser resources
  await this.cleanup();
});

AfterAll(async function() {
  console.log('E2E test suite complete.');
});
```

### Tagged Hooks for Specific Scenarios

```typescript
// e2e/support/hooks.ts (continued)

// Hook that runs only for authenticated scenarios
Before({ tags: '@authenticated' }, async function(this: CustomWorld) {
  // Reuse authentication state
  const storageState = 'test-results/auth-state.json';

  if (fs.existsSync(storageState)) {
    // Load existing auth state
    await this.context!.storageState({ path: storageState });
  } else {
    // Perform login and save state
    await this.page!.goto('/');
    // ... login logic ...
    await this.context!.storageState({ path: storageState });
  }
});

// Hook for Canvas tests (slower, needs more setup time)
Before({ tags: '@canvas or @gameplay' }, async function(this: CustomWorld) {
  // Increase timeout for Canvas rendering
  this.page!.setDefaultTimeout(10000);

  // Wait for Canvas to initialize
  await this.page!.waitForLoadState('networkidle');
});
```

### Playwright Fixtures Pattern (Alternative)

If using Playwright Test Runner instead of Cucumber:

```typescript
// e2e/support/fixtures.ts
import { test as base } from '@playwright/test';
import { AuthPage } from '../pages/auth/AuthPage';
import { GamePage } from '../pages/game/GamePage';
import { LeaderboardPage } from '../pages/leaderboard/LeaderboardPage';

type PageFixtures = {
  authPage: AuthPage;
  gamePage: GamePage;
  leaderboardPage: LeaderboardPage;
};

export const test = base.extend<PageFixtures>({
  authPage: async ({ page }, use) => {
    await use(new AuthPage(page));
  },

  gamePage: async ({ page }, use) => {
    await use(new GamePage(page));
  },

  leaderboardPage: async ({ page }, use) => {
    await use(new LeaderboardPage(page));
  }
});

export { expect } from '@playwright/test';
```

## Step Definition Organization

### Domain-Based Organization

Organize step definitions by feature domain, not by Gherkin keyword (Given/When/Then).

```typescript
// e2e/step-definitions/authentication.steps.ts
import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/custom-world';
import { AuthPage } from '../pages/auth/AuthPage';

Given('I am on the login page', async function(this: CustomWorld) {
  await this.page!.goto('/');
});

When('I login with username {string} and password {string}',
  async function(this: CustomWorld, username: string, password: string) {
    const authPage = new AuthPage(this.page!);
    await authPage.login(username, password);
});

Then('I should see a login error {string}',
  async function(this: CustomWorld, errorMessage: string) {
    const authPage = new AuthPage(this.page!);
    await authPage.expectLoginError(errorMessage);
});

Then('I should be logged in', async function(this: CustomWorld) {
  // Check for logout button presence
  const logoutButton = this.page!.getByRole('button', { name: 'Logout' });
  await expect(logoutButton).toBeVisible();
});
```

```typescript
// e2e/step-definitions/gameplay.steps.ts
import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/custom-world';
import { GamePage } from '../pages/game/GamePage';

Given('I have started a game', async function(this: CustomWorld) {
  const gamePage = new GamePage(this.page!);
  await gamePage.goto('/');
  await gamePage.startGame();
});

When('I select the {string} answer',
  async function(this: CustomWorld, position: 'left' | 'center' | 'right') {
    const gamePage = new GamePage(this.page!);
    await gamePage.answerQuestion(position);
});

Then('my score should be {int}', async function(this: CustomWorld, expectedScore: number) {
  const gamePage = new GamePage(this.page!);
  const actualScore = await gamePage.getCurrentScore();
  expect(actualScore).toBe(expectedScore);
});

Then('I should advance to level {int}', async function(this: CustomWorld, expectedLevel: number) {
  const gamePage = new GamePage(this.page!);
  const actualLevel = await gamePage.getCurrentLevel();
  expect(actualLevel).toBe(expectedLevel);
});
```

### Common/Shared Steps

```typescript
// e2e/step-definitions/common.steps.ts
import { Given, When, Then } from '@cucumber/cucumber';
import { CustomWorld } from '../support/custom-world';

Given('I navigate to {string}', async function(this: CustomWorld, path: string) {
  await this.page!.goto(path);
});

When('I click the {string} button', async function(this: CustomWorld, buttonName: string) {
  await this.page!.getByRole('button', { name: buttonName }).click();
});

Then('I should see {string}', async function(this: CustomWorld, text: string) {
  await expect(this.page!.getByText(text)).toBeVisible();
});

When('I wait for {int} seconds', async function(this: CustomWorld, seconds: number) {
  await this.page!.waitForTimeout(seconds * 1000);
});
```

### Step Definition Best Practices

1. **Keep steps thin**: Delegate to Page Objects, don't implement logic in steps
2. **Use parameterized steps**: Reduce duplication with `{string}`, `{int}`, etc.
3. **Abstract common patterns**: Create helper methods in Page Objects
4. **Domain-based files**: Group by feature (auth, gameplay, teams) not by Given/When/Then
5. **Avoid feature coupling**: Steps should be reusable across multiple features

## Locator Strategy

### Locator Priority (2026 Best Practices)

Based on Playwright official guidance and accessibility best practices:

```typescript
// 1. PREFERRED: Role-based locators (accessible, resilient)
page.getByRole('button', { name: 'Login' })
page.getByRole('textbox', { name: 'Username' })
page.getByRole('heading', { name: 'Welcome' })

// 2. GOOD: Label-based locators (user-facing)
page.getByLabel('Email address')
page.getByPlaceholder('Enter username')

// 3. ACCEPTABLE: Text-based locators (visible to users)
page.getByText('Sign up')
page.getByTitle('Close modal')

// 4. FALLBACK: Test ID (when role/text not available)
page.locator('[data-testid="game-canvas"]')
page.locator('[data-testid="hud-score"]')

// 5. LAST RESORT: CSS/XPath (brittle, avoid if possible)
page.locator('.answer-block:nth-child(2)')
page.locator('//div[@class="modal"]//button')
```

**When to use data-testid:**
- Canvas elements (no DOM representation)
- Highly dynamic UI where text changes
- Elements without semantic roles
- SVG/custom graphics
- Third-party components without good selectors

### Adding data-testid to Application

For Canvas and dynamic elements, add test IDs to the application:

```typescript
// src/components/Game.tsx
<canvas
  ref={canvasRef}
  data-testid="game-canvas"
  width={800}
  height={600}
/>

// For HUD (if DOM-based, not Canvas-rendered)
<div data-testid="hud-score">Score: {score}</div>
<div data-testid="hud-level">Level: {level}</div>
<div data-testid="hud-lives">Lives: {lives}</div>
```

## Configuration Files

### Cucumber Configuration

```typescript
// e2e/config/cucumber.config.ts
export default {
  require: ['e2e/step-definitions/**/*.ts', 'e2e/support/**/*.ts'],
  requireModule: ['ts-node/register'],
  format: [
    'progress-bar',
    'html:test-results/cucumber-report.html',
    'json:test-results/cucumber-report.json'
  ],
  formatOptions: {
    snippetInterface: 'async-await'
  },
  parallel: 2,
  retry: 1,
  paths: ['e2e/features/**/*.feature']
};
```

### Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Cucumber handles parallelization
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    }
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI
  }
});
```

### TypeScript Configuration for E2E

```json
// e2e/tsconfig.json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "types": ["node", "@playwright/test", "@cucumber/cucumber"],
    "esModuleInterop": true,
    "skipLibCheck": true,
    "strict": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": [
    "**/*.ts"
  ],
  "exclude": [
    "node_modules"
  ]
}
```

## Build Order and Implementation Sequence

### Phase 1: Foundation Setup
**Goal:** Establish testing infrastructure

1. **Install dependencies**
   ```bash
   npm install -D @playwright/test @cucumber/cucumber ts-node
   ```

2. **Create directory structure**
   - Create `/e2e` with subdirectories (config, features, step-definitions, pages, support)
   - Create `/e2e/tsconfig.json`

3. **Configure Cucumber + Playwright**
   - Create `cucumber.config.ts`
   - Create `playwright.config.ts`
   - Configure npm scripts

4. **Implement Custom World + Hooks**
   - Create `custom-world.ts`
   - Create `hooks.ts` with Before/After
   - Verify browser lifecycle works

### Phase 2: Base Infrastructure
**Goal:** Create reusable abstractions

1. **Create BasePage class**
   - Common navigation methods
   - Wait helpers
   - Screenshot utilities

2. **Create CanvasInteractor**
   - Coordinate calculation
   - Click methods
   - Canvas-specific helpers

3. **Create common step definitions**
   - Navigation steps
   - Wait steps
   - Generic interaction steps

4. **Add data-testid to critical elements**
   - Canvas element
   - HUD elements
   - Modals

### Phase 3: Authentication Flow (First Feature)
**Goal:** Prove end-to-end flow works

1. **Create auth.feature**
   ```gherkin
   Feature: User Authentication
     Scenario: Successful login
       Given I am on the login page
       When I login with username "testuser" and password "password123"
       Then I should be logged in
   ```

2. **Create AuthPage**
   - Locators for username, password, buttons
   - `login()` method
   - Error handling

3. **Create authentication.steps.ts**
   - Implement Given/When/Then for auth

4. **Run first test**
   - Debug and iterate
   - Verify screenshot on failure works

### Phase 4: Gameplay Flow (Canvas Testing)
**Goal:** Validate Canvas interaction pattern

1. **Create gameplay.feature**
   ```gherkin
   Feature: Gameplay
     Scenario: Answer a question correctly
       Given I have started a game
       When I select the "left" answer
       Then my score should increase
   ```

2. **Create GamePage + HUDComponent**
   - Canvas interaction via CanvasInteractor
   - HUD reading methods

3. **Create gameplay.steps.ts**
   - Game start
   - Answer selection
   - Score/level verification

4. **Test Canvas coordinate accuracy**
   - Manual verification of click positions
   - Screenshot debugging
   - Adjust coordinate percentages if needed

### Phase 5: Expand Feature Coverage
**Goal:** Cover remaining features

1. **Leaderboard feature**
   - Create leaderboard.feature
   - Create LeaderboardPage
   - Create leaderboard.steps.ts

2. **Teams feature**
   - Create team-related features
   - Create TeamsPage + modals
   - Create teams.steps.ts

3. **Settings feature**
   - Create settings.feature
   - Create SettingsPage
   - Create settings.steps.ts

### Phase 6: CI/CD Integration
**Goal:** Automate in pipeline

1. **Create GitHub Actions workflow**
   ```yaml
   - name: Run E2E tests
     run: npm run test:e2e
   ```

2. **Configure test artifacts**
   - Upload screenshots
   - Upload videos
   - Upload HTML report

3. **Optimize for CI**
   - Parallel execution tuning
   - Retry configuration
   - Timeout adjustments

### Estimated Timeline

| Phase | Effort | Dependencies |
|-------|--------|--------------|
| Phase 1: Foundation | 4-6 hours | None |
| Phase 2: Base Infrastructure | 6-8 hours | Phase 1 |
| Phase 3: Auth Flow | 4-6 hours | Phase 2 |
| Phase 4: Gameplay Flow | 8-10 hours | Phase 2, Phase 3 |
| Phase 5: Feature Coverage | 12-16 hours | Phase 4 |
| Phase 6: CI/CD | 2-4 hours | Phase 5 |
| **Total** | **36-50 hours** | |

## Anti-Patterns to Avoid

### 1. Feature-Coupled Step Definitions
**Bad:**
```typescript
// login.steps.ts - only works for login.feature
Given('I am on the login page', ...)
```

**Good:**
```typescript
// authentication.steps.ts - works across all auth features
Given('I am on the login page', ...)
Given('I am on the signup page', ...)
```

### 2. Logic in Step Definitions
**Bad:**
```typescript
When('I login', async function(this: CustomWorld) {
  await this.page!.fill('#username', 'testuser');
  await this.page!.fill('#password', 'pass123');
  await this.page!.click('#login-btn');
  await this.page!.waitForSelector('.dashboard');
});
```

**Good:**
```typescript
When('I login', async function(this: CustomWorld) {
  const authPage = new AuthPage(this.page!);
  await authPage.login('testuser', 'pass123');
});
```

### 3. Brittle CSS Selectors for Canvas
**Bad:**
```typescript
await page.locator('canvas > div:nth-child(2)').click();
```

**Good:**
```typescript
await canvasInteractor.clickAnswerBlock('center');
```

### 4. Hardcoded Coordinates
**Bad:**
```typescript
await page.click('canvas', { position: { x: 400, y: 150 } });
```

**Good:**
```typescript
// Use percentage-based calculations that adapt to viewport
await canvasInteractor.clickAnswerBlock('center');
```

### 5. No Separation Between E2E and Unit Tests
**Bad:**
```
src/
  components/
    Game.test.ts        # Unit test
    Game.e2e.spec.ts    # E2E test (wrong location!)
```

**Good:**
```
src/
  components/
    Game.test.ts        # Unit test
e2e/
  features/
    gameplay.feature    # E2E test
```

## Integration with Existing Project

### Co-existence with Vitest

The project already uses Vitest for unit testing. E2E tests are complementary:

| Test Type | Location | Tool | Purpose |
|-----------|----------|------|---------|
| Unit | `src/**/*.test.ts` | Vitest | Test functions, utils, generators |
| Integration | `src/**/*.test.ts` | Vitest + React Testing Library | Test components in isolation |
| E2E | `e2e/**/*.feature` | Playwright + Cucumber | Test full user flows |

### npm Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run",
    "test:e2e": "cucumber-js",
    "test:e2e:headed": "HEADLESS=false cucumber-js",
    "test:e2e:debug": "PWDEBUG=1 cucumber-js",
    "test:all": "npm run test:unit && npm run test:e2e"
  }
}
```

### Pre-commit Hook Strategy

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "vitest related --run"
      // Note: E2E tests NOT run on pre-commit (too slow)
    ]
  }
}
```

E2E tests run in CI only, not on every commit.

## Sources

**Confidence: HIGH** - All recommendations based on official documentation and 2026 best practices.

**Directory Structure & Organization:**
- [E2E Tests Project Structure Organizing](https://medium.com/jagaad/e2e-tests-project-structure-organizing-c1b688e852a5)
- [Ways to Organize End-to-End Tests](https://adequatica.medium.com/ways-to-organize-end-to-end-tests-76439c2fdebb)
- [Playwright + Cucumber TypeScript Framework](https://github.com/tzero86/cucumber-typescript-playwright)

**Page Object Model:**
- [Page object models | Playwright (Official)](https://playwright.dev/docs/pom)
- [Page Object Model with Playwright: Tutorial | BrowserStack](https://www.browserstack.com/guide/page-object-model-with-playwright)
- [Page Object Model with Playwright and TypeScript](https://codilime.com/blog/page-object-model-with-playwright-and-typescript/)

**Canvas Testing:**
- [Automating Canvas Testing with Playwright and Object Detection Models](https://medium.com/@BioCatchTechBlog/automating-canvas-testing-with-playwright-and-object-detection-models-8d58235b17b7)
- [HTML5 Canvas Testing with CanvasGrid and Playwright](https://dev.to/fonzi/testing-html5-canvas-with-canvasgrid-and-playwright-5h4c)
- [Using Playwright Codegen to Capture Element Coordinates](https://medium.com/@dobulbekovach/using-playwright-codegen-to-capture-element-coordinates-for-precise-e2e-testing-faf5cb6504e9)

**Fixtures & Hooks:**
- [Fixtures | Playwright (Official)](https://playwright.dev/docs/test-fixtures)
- [Fixtures in Playwright [2026] | BrowserStack](https://www.browserstack.com/guide/fixtures-in-playwright)
- [How To Set Up A Custom World For Cucumber/Playwright Tests](https://dilshankelsen.com/set-up-custom-world-for-cucumber-playwright-tests-in-typescript/)
- [Building a Robust Automation Framework with Playwright, TypeScript & Cucumber](https://medium.com/@rajesh.yemul_42550/building-a-robust-automation-framework-with-playwright-typescript-cucumber-0e390a04218d)

**Step Definitions:**
- [Step organization | Cucumber (Official)](https://cucumber.io/docs/gherkin/step-organization/)
- [Cucumber Testing in 2026 | BrowserStack](https://www.browserstack.com/guide/learn-about-cucumber-testing-tool)

**Locator Strategy:**
- [Locators | Playwright (Official)](https://playwright.dev/docs/locators)
- [15 Best Practices for Playwright testing in 2026 | BrowserStack](https://www.browserstack.com/guide/playwright-best-practices)
- [Playwright Selectors: Types and Best Practices (2026) | BrowserStack](https://www.browserstack.com/guide/playwright-selectors)
- [Best Practices | Playwright (Official)](https://playwright.dev/docs/best-practices)
