import { Given, When, Then } from '../../support/fixtures';
import { expect } from '@playwright/test';
import { LeaderboardPage } from '../../support/page-objects/LeaderboardPage';
import { GamePage } from '../../support/page-objects/GamePage';
import { AuthPage } from '../../support/page-objects/AuthPage';
import { seedLeaderboardScore } from '../../support/helpers/firebase-helpers';

// Store instances for use across steps
let leaderboardPage: LeaderboardPage;
let gamePage: GamePage;

// Track seeded player IDs for cleanup context
let seededPlayerIds: string[] = [];

// Current user's nickname (set during login)
let currentUserNickname: string = '';

// --- Helper Functions ---

/**
 * Ensure user is logged in and capture nickname.
 */
async function ensureLoggedIn(page: import('@playwright/test').Page): Promise<string> {
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
    return uniqueUsername;
  }

  // Already logged in - try to get username from UI
  const usernameElement = page.locator('.user-name');
  const nickname = await usernameElement.textContent().catch(() => null);
  return nickname || 'unknown_user';
}

// --- Leaderboard-Specific Given Steps ---

Given('the leaderboard has seeded scores', async ({ page }) => {
  gamePage = new GamePage(page);
  leaderboardPage = new LeaderboardPage(page);

  // Navigate to app and login if needed
  await page.goto('/');
  currentUserNickname = await ensureLoggedIn(page);

  // Wait for menu to be ready
  await expect.poll(async () => {
    return await gamePage.getGameState();
  }, {
    message: 'wait for game menu',
    timeout: 10000
  }).toBe('MENU');

  // Seed test scores with unique IDs
  const timestamp = Date.now();
  seededPlayerIds = [];

  const testScores = [
    { playerId: `test_player_${timestamp}_1`, nickname: 'SpaceMaster', score: 500, level: 15 },
    { playerId: `test_player_${timestamp}_2`, nickname: 'MathWhiz', score: 350, level: 12 },
    { playerId: `test_player_${timestamp}_3`, nickname: 'GalaxyHero', score: 200, level: 8 },
    { playerId: `test_player_${timestamp}_4`, nickname: 'StarPilot', score: 150, level: 6 },
    { playerId: `test_player_${timestamp}_5`, nickname: 'Rookie', score: 50, level: 2 },
  ];

  for (const scoreData of testScores) {
    await seedLeaderboardScore(scoreData);
    seededPlayerIds.push(scoreData.playerId);
  }
});

Given('the leaderboard has no seeded scores', async ({ page }) => {
  gamePage = new GamePage(page);
  leaderboardPage = new LeaderboardPage(page);

  // Navigate to app and login if needed
  await page.goto('/');
  currentUserNickname = await ensureLoggedIn(page);

  // Wait for menu to be ready
  await expect.poll(async () => {
    return await gamePage.getGameState();
  }, {
    message: 'wait for game menu',
    timeout: 10000
  }).toBe('MENU');

  // Don't seed any scores - rely on test isolation
  seededPlayerIds = [];
});

Given('the leaderboard is open from menu', async ({ page }) => {
  gamePage = new GamePage(page);
  leaderboardPage = new LeaderboardPage(page);

  // Navigate to app and login if needed
  await page.goto('/');
  currentUserNickname = await ensureLoggedIn(page);

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
      await page.waitForTimeout(500);
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

Then('I should see my score in the leaderboard', async ({ page }) => {
  // Get current user nickname from UI if not already captured
  if (!currentUserNickname || currentUserNickname === 'unknown_user') {
    const usernameElement = page.locator('.user-name');
    currentUserNickname = await usernameElement.textContent() || 'unknown_user';
  }

  // Wait for leaderboard to load fresh data
  await expect.poll(async () => {
    const entries = await leaderboardPage.getEntries();
    // Look for entry matching current user
    const userEntry = entries.find(e => e.nickname === currentUserNickname);
    return userEntry !== undefined;
  }, {
    message: `wait for user's score to appear in leaderboard (nickname: ${currentUserNickname})`,
    timeout: 10000
  }).toBe(true);

  // Verify user's entry
  const userEntry = await leaderboardPage.findEntryForPlayer(currentUserNickname);
  expect(userEntry).not.toBeNull();
  expect(userEntry!.score).toBeGreaterThanOrEqual(0);
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
