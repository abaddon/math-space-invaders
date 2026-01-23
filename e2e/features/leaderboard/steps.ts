import { Given, When, Then } from '../../support/fixtures';
import { expect } from '@playwright/test';
import { LeaderboardPage } from '../../support/page-objects/LeaderboardPage';
import { GamePage } from '../../support/page-objects/GamePage';
import { AuthPage } from '../../support/page-objects/AuthPage';
// Firebase helpers available for seeding test data when needed
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { seedLeaderboardScore } from '../../support/helpers/firebase-helpers';

// Store instances for use across steps
let leaderboardPage: LeaderboardPage;
let gamePage: GamePage;

// --- Helper Functions ---

/**
 * Ensure user is logged in and capture nickname.
 */
async function ensureLoggedIn(page: import('@playwright/test').Page): Promise<void> {
  const authPage = new AuthPage(page);
  const usernameVisible = await authPage.usernameInput.isVisible().catch(() => false);

  if (usernameVisible) {
    // Need to sign up a new user
    const uniqueUsername = `e2e_lb_${Date.now().toString(36)}`;
    const password = 'testpass123';

    await authPage.switchToSignUp();
    await authPage.fillCredentials(uniqueUsername, password);
    await authPage.confirmPasswordInput.fill(password);
    await authPage.submit();

    // Wait for game to load
    await page.waitForSelector('[data-testid="game-canvas"], button.start-button', { timeout: 15000 });
  }
}

// --- Leaderboard-Specific Given Steps ---

Given('the leaderboard is open from menu', async ({ page }) => {
  gamePage = new GamePage(page);
  leaderboardPage = new LeaderboardPage(page);

  // Navigate to app and login if needed
  await page.goto('/');
  await ensureLoggedIn(page);

  // Wait for menu to be ready
  await expect.poll(async () => {
    return await gamePage.getGameState();
  }, {
    message: 'wait for game menu',
    timeout: 10000
  }).toBe('MENU');

  // Open leaderboard from menu
  await page.locator('.leaderboard-btn').click();
  await leaderboardPage.waitForLeaderboard();
});

// --- Leaderboard-Specific When Steps ---

When('I open the leaderboard from the menu', async ({ page }) => {
  leaderboardPage = new LeaderboardPage(page);

  // Click the leaderboard button in menu
  await page.locator('.leaderboard-btn').click();
  await leaderboardPage.waitForLeaderboard();
});

When('I open the leaderboard from game over', async ({ page }) => {
  leaderboardPage = new LeaderboardPage(page);

  // Click VIEW LEADERBOARD button on game over screen
  await page.locator('.leaderboard-btn.secondary').click();
  await leaderboardPage.waitForLeaderboard();
});

When('I close the leaderboard', async () => {
  await leaderboardPage.close();
});

When('I wait for the game to start', async ({ page }) => {
  gamePage = new GamePage(page);

  // Wait for game to transition through COUNTDOWN to PLAYING
  await expect.poll(async () => {
    return await gamePage.getGameState();
  }, {
    message: 'wait for game to start playing',
    timeout: 15000,
    intervals: [100, 250, 500, 1000]
  }).toBe('PLAYING');
});

When('I answer one question correctly', async ({ page }) => {
  gamePage = new GamePage(page);

  // Wait for answer blocks to appear
  await expect.poll(async () => {
    const blocks = await gamePage.getAnswerBlocks();
    return blocks.length;
  }, {
    message: 'wait for answer blocks to appear',
    timeout: 10000
  }).toBe(3);

  // Click correct answer
  await gamePage.clickCorrectAnswer();

  // Wait for score to update
  await expect.poll(async () => {
    return await gamePage.getScore();
  }, {
    message: 'wait for score to increase after correct answer',
    timeout: 15000,
    intervals: [100, 250, 500, 1000]
  }).toBeGreaterThan(0);
});

When('I click wrong answers until game over', async ({ page }) => {
  gamePage = new GamePage(page);

  // Keep clicking wrong answers until game over
  // This is more resilient than tracking exact life counts
  const maxAttempts = 10; // Safety limit
  for (let i = 0; i < maxAttempts; i++) {
    // Check if game is already over
    const currentState = await gamePage.getGameState();
    if (currentState === 'GAME_OVER') {
      break;
    }

    // Wait for answer blocks (might not appear if game just ended)
    const blocks = await gamePage.getAnswerBlocks();
    if (blocks.length !== 3) {
      // No blocks yet, wait a bit and check state again
      await page.waitForTimeout(300);
      continue;
    }

    // Click wrong answer
    await gamePage.clickWrongAnswer();

    // Brief pause to let the game process the hit
    await page.waitForTimeout(300);
  }

  // Wait for GAME_OVER state
  await expect.poll(async () => {
    return await gamePage.getGameState();
  }, {
    message: 'wait for game over state',
    timeout: 10000
  }).toBe('GAME_OVER');
});

// --- Leaderboard-Specific Then Steps ---

Then('I should see entries with nicknames and scores', async () => {
  const entries = await leaderboardPage.getEntries();

  expect(entries.length).toBeGreaterThan(0);

  // Verify each entry has required fields
  for (const entry of entries) {
    expect(entry.nickname).toBeTruthy();
    expect(typeof entry.score).toBe('number');
    expect(entry.score).toBeGreaterThanOrEqual(0);
  }
});

Then('scores should be sorted highest-first', async () => {
  const isSorted = await leaderboardPage.areScoresSorted();
  expect(isSorted).toBe(true);
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
Then('I should see my score in the leaderboard', async ({ page }) => {
  // The user's score may not appear in the visible entries if their score is too low
  // (many higher scores from other test runs push them off the list)
  // Instead, check the "Your Stats" section which always shows current player's stats

  // Wait for the stats section to appear and have a non-zero high score
  await expect.poll(async () => {
    const stats = await leaderboardPage.getPlayerStats();
    // Stats should exist and show a score > 0 (we answered at least one correctly)
    return stats !== null && stats.highScore > 0;
  }, {
    message: 'wait for player stats to show score > 0',
    timeout: 10000
  }).toBe(true);

  // Verify the stats show our score was recorded
  const stats = await leaderboardPage.getPlayerStats();
  expect(stats).not.toBeNull();
  expect(stats!.highScore).toBeGreaterThan(0);
  expect(stats!.gamesPlayed).toBeGreaterThanOrEqual(1);
});

Then('I should see the main menu', async ({ page }) => {
  // Verify menu buttons are visible (different name to avoid conflict with teams/steps.ts)
  await expect(page.locator('button.start-button')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('.leaderboard-btn')).toBeVisible();
});

Then('I should see the empty state message', async () => {
  const isEmpty = await leaderboardPage.isEmpty();
  expect(isEmpty).toBe(true);
});

Then('I should see the leaderboard modal', async () => {
  // Verify leaderboard modal is visible
  await leaderboardPage.waitForLeaderboard();
  await expect(leaderboardPage.modal).toBeVisible();
});

Then('the leaderboard should display scores sorted highest-first', async () => {
  const isSorted = await leaderboardPage.areScoresSorted();
  expect(isSorted).toBe(true);
});
