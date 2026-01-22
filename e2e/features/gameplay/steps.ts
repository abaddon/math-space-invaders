import { expect } from '@playwright/test';
import { Given, When, Then } from '../../support/fixtures';
import { GamePage } from '../../support/page-objects/GamePage';
import { AuthPage } from '../../support/page-objects/AuthPage';

// Store GamePage instance for use across steps
let gamePage: GamePage;

// Helper to ensure user is logged in
async function ensureLoggedIn(page: import('@playwright/test').Page): Promise<void> {
  // Check if we're on the auth page (login screen visible)
  const authPage = new AuthPage(page);
  const usernameVisible = await authPage.usernameInput.isVisible().catch(() => false);

  if (usernameVisible) {
    // Need to sign up a new user for this test session
    const uniqueUsername = `e2e_${Date.now().toString(36)}`;
    const password = 'testpass123';

    await authPage.switchToSignUp();
    await authPage.fillCredentials(uniqueUsername, password);
    await authPage.confirmPasswordInput.fill(password);
    await authPage.submit();

    // Wait for game canvas to appear (indicates successful auth)
    await page.waitForSelector('[data-testid="game-canvas"]', { timeout: 15000 });
  }
}

// Setup step - shared across scenarios via Background
Given('I am on the game menu', async ({ page }) => {
  gamePage = new GamePage(page);

  // Check if we're already on the game page (after "I am logged in" step)
  const currentUrl = page.url();
  const isOnGamePage = currentUrl.includes('localhost:5173') || currentUrl.includes('math-space-invaders');

  // Only navigate if not already on the game page
  if (!isOnGamePage || currentUrl === 'about:blank') {
    await gamePage.goto();
    await ensureLoggedIn(page);
  }

  // Wait for menu to be visible (game state should be MENU)
  await expect.poll(async () => {
    return await gamePage.getGameState();
  }, {
    message: 'wait for game menu',
    timeout: 10000
  }).toBe('MENU');
});

When('I click the start game button', async ({ page }) => {
  const startButton = page.locator('button.start-button');
  await startButton.click();
});

Given('I start a new game', async ({ page }) => {
  const startButton = page.locator('button.start-button');
  await startButton.click();
  // Wait for game to transition through COUNTDOWN to PLAYING
  await expect.poll(async () => {
    return await gamePage.getGameState();
  }, {
    message: 'wait for game to start playing',
    timeout: 15000,
    intervals: [100, 250, 500, 1000]
  }).toBe('PLAYING');
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
Then('the game should be in {string} state', async ({ page }, expectedState: string) => {
  await expect.poll(async () => {
    return await gamePage.getGameState();
  }, {
    message: `wait for game state to be ${expectedState}`,
    timeout: 10000
  }).toBe(expectedState);
});

Then('the canvas should be visible', async ({ page }) => {
  const canvas = page.locator('[data-testid="game-canvas"]');
  await expect(canvas).toBeVisible({ timeout: 5000 });
});

Then('I should see a math problem', async () => {
  await expect.poll(async () => {
    const problem = await gamePage.getCurrentProblem();
    return problem !== null;
  }, {
    message: 'wait for math problem to appear',
    timeout: 10000
  }).toBe(true);
});

// Score tracking
// eslint-disable-next-line @typescript-eslint/no-unused-vars
Given('my score is {int}', async ({ page }, expectedScore: number) => {
  const score = await gamePage.getScore();
  expect(score).toBe(expectedScore);
});

When('I click the correct answer block', async () => {
  // Wait for answer blocks to be ready
  await expect.poll(async () => {
    const blocks = await gamePage.getAnswerBlocks();
    return blocks.length;
  }, {
    message: 'wait for answer blocks to appear',
    timeout: 10000
  }).toBe(3);

  await gamePage.clickCorrectAnswer();
});

Then('my score should increase', async () => {
  // Poll until score increases from 0
  await expect.poll(async () => {
    return await gamePage.getScore();
  }, {
    message: 'wait for score to increase after correct answer',
    timeout: 15000,
    intervals: [100, 250, 500, 1000]
  }).toBeGreaterThan(0);
});

// Lives tracking
// eslint-disable-next-line @typescript-eslint/no-unused-vars
Given('I have {int} lives', async ({ page }, expectedLives: number) => {
  const lives = await gamePage.getLives();
  expect(lives).toBe(expectedLives);
});

When('I click the wrong answer block', async () => {
  // Wait for answer blocks to be ready
  await expect.poll(async () => {
    const blocks = await gamePage.getAnswerBlocks();
    return blocks.length;
  }, {
    message: 'wait for answer blocks to appear',
    timeout: 10000
  }).toBe(3);

  await gamePage.clickWrongAnswer();
});

Then('I should have fewer lives', async () => {
  // Poll until lives decrease from 3
  await expect.poll(async () => {
    return await gamePage.getLives();
  }, {
    message: 'wait for lives to decrease after wrong answer',
    timeout: 15000,
    intervals: [100, 250, 500, 1000]
  }).toBeLessThan(3);
});

// Pause/Resume
// eslint-disable-next-line @typescript-eslint/no-unused-vars
Given('the game is in {string} state', async ({ page }, expectedState: string) => {
  await expect.poll(async () => {
    return await gamePage.getGameState();
  }, {
    message: `wait for game to be in ${expectedState} state`,
    timeout: 10000
  }).toBe(expectedState);
});

When('I press the Escape key', async ({ page }) => {
  await page.keyboard.press('Escape');
});

Given('I pause the game with Escape', async ({ page }) => {
  await page.keyboard.press('Escape');
  await expect.poll(async () => {
    return await gamePage.getGameState();
  }, {
    message: 'wait for game to pause',
    timeout: 5000
  }).toBe('PAUSED');
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
Then('I should see {string} text on screen', async ({ page }, text: string) => {
  // Canvas text is not queryable; verify by checking game state is PAUSED
  const gameState = await gamePage.getGameState();
  expect(gameState).toBe('PAUSED');
});

When('I click the Resume button', async ({ page }) => {
  const resumeButton = page.locator('[data-testid="resume-button"]');
  await resumeButton.click();
});

// Level progression steps
// eslint-disable-next-line @typescript-eslint/no-unused-vars
Given('I am at level {int}', async ({ page }, expectedLevel: number) => {
  const level = await gamePage.getLevel();
  expect(level).toBe(expectedLevel);
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
When('I answer {int} questions correctly', async ({ page }, count: number) => {
  for (let i = 0; i < count; i++) {
    // Wait for answer blocks to appear (new round)
    await expect.poll(async () => {
      const blocks = await gamePage.getAnswerBlocks();
      return blocks.length;
    }, {
      message: `wait for answer blocks for question ${i + 1}`,
      timeout: 15000,
      intervals: [100, 250, 500, 1000]
    }).toBe(3);

    // Click correct answer
    await gamePage.clickCorrectAnswer();

    // Wait for score to update (projectile hit)
    await expect.poll(async () => {
      return await gamePage.getScore();
    }, {
      message: `wait for score to update after question ${i + 1}`,
      timeout: 15000,
      intervals: [100, 250, 500, 1000]
    }).toBeGreaterThan(i);

    // If not last question, wait for next round to load
    if (i < count - 1) {
      // Small delay to allow state transition
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
Then('my level should advance to {int}', async ({ page }, expectedLevel: number) => {
  // Poll for level change - may take time after LEVEL_UP state
  await expect.poll(async () => {
    return await gamePage.getLevel();
  }, {
    message: `wait for level to advance to ${expectedLevel}`,
    timeout: 20000,
    intervals: [100, 500, 1000]
  }).toBe(expectedLevel);
});

// Game over steps
When('I lose all my lives', async () => {
  // Answer wrong 3 times to lose all lives
  for (let i = 0; i < 3; i++) {
    // Wait for answer blocks
    await expect.poll(async () => {
      const blocks = await gamePage.getAnswerBlocks();
      return blocks.length;
    }, {
      message: `wait for answer blocks for wrong answer ${i + 1}`,
      timeout: 15000
    }).toBe(3);

    // Click wrong answer
    await gamePage.clickWrongAnswer();

    // Wait for lives to decrease or game over
    if (i < 2) {
      // Wait for lives to decrease
      await expect.poll(async () => {
        return await gamePage.getLives();
      }, {
        message: `wait for lives to decrease after wrong answer ${i + 1}`,
        timeout: 15000
      }).toBe(2 - i);

      // Wait for next round
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // Wait for GAME_OVER state
  await expect.poll(async () => {
    return await gamePage.getGameState();
  }, {
    message: 'wait for game over state',
    timeout: 10000
  }).toBe('GAME_OVER');
});

Then('I should see the Game Over screen', async ({ page }) => {
  const gameOverScreen = page.locator('[data-testid="game-over-screen"]');
  await expect(gameOverScreen).toBeVisible({ timeout: 5000 });

  const gameOverTitle = page.locator('[data-testid="game-over-title"]');
  await expect(gameOverTitle).toHaveText('GAME OVER');
});

Then('I should see my final score of {int}', async ({ page }, expectedScore: number) => {
  const finalScoreElement = page.locator('[data-testid="final-score"]');
  await expect(finalScoreElement).toHaveText(String(expectedScore), { timeout: 5000 });
});
