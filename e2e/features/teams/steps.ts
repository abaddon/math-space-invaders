import { expect } from '@playwright/test';
import { Given, When, Then } from '../../support/fixtures';
import { CreateTeamModal } from '../../support/page-objects/CreateTeamModal';
import { AuthPage } from '../../support/page-objects/AuthPage';
import { nanoid } from 'nanoid';

// Track teams created during tests for cleanup
export const createdTeamNames: string[] = [];

// Store CreateTeamModal instance for use across steps
let createTeamModal: CreateTeamModal;

// Store the current team name with suffix for assertions
let currentTeamNameWithSuffix: string;

// Helper to ensure user is logged in
async function ensureLoggedIn(page: import('@playwright/test').Page): Promise<void> {
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

// --- Given Steps ---

Given('I am on the game screen', async ({ page }) => {
  // Navigate to the app if not already there
  const currentUrl = page.url();
  const isOnGamePage = currentUrl.includes('localhost:5173') || currentUrl.includes('math-space-invaders');

  if (!isOnGamePage || currentUrl === 'about:blank') {
    await page.goto('/');
    await ensureLoggedIn(page);
  }

  // Wait for game menu to appear (indicates we're on the game screen)
  await page.waitForSelector('button.start-button, [data-testid="game-canvas"]', { timeout: 15000 });
});

Given('I am on the create team modal', async ({ page }) => {
  createTeamModal = new CreateTeamModal(page);

  // Navigate to the app if not already there
  const currentUrl = page.url();
  const isOnGamePage = currentUrl.includes('localhost:5173') || currentUrl.includes('math-space-invaders');

  if (!isOnGamePage || currentUrl === 'about:blank') {
    await page.goto('/');
    await ensureLoggedIn(page);
  }

  // Wait for game menu to appear
  await page.waitForSelector('button.create-team-btn', { timeout: 15000 });

  // Click the create team button
  await page.locator('button.create-team-btn').click();

  // Wait for the modal to open
  await createTeamModal.waitForModal();
});

// --- When Steps ---

When('I click the create team button', async ({ page }) => {
  // Initialize modal if not already done
  if (!createTeamModal) {
    createTeamModal = new CreateTeamModal(page);
  }

  // Ensure we're in MENU state (game canvas visible but not playing)
  await page.waitForSelector('button.create-team-btn', { timeout: 10000 });
  await page.locator('button.create-team-btn').click();

  // Wait for modal to appear
  await createTeamModal.waitForModal();
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
When('I enter team name {string}', async ({ page }, teamName: string) => {
  // Append random suffix for uniqueness
  const suffix = nanoid(6);
  currentTeamNameWithSuffix = `${teamName}-${suffix}`;

  // Track for cleanup
  createdTeamNames.push(currentTeamNameWithSuffix);

  // Fill the team name
  await createTeamModal.fillTeamName(currentTeamNameWithSuffix);
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
When('I select {string} team privacy', async ({ page }, privacy: string) => {
  if (privacy.toLowerCase() === 'public') {
    await createTeamModal.selectPublic();
  } else if (privacy.toLowerCase() === 'private') {
    await createTeamModal.selectPrivate();
  } else {
    throw new Error(`Unknown privacy option: ${privacy}. Expected "public" or "private".`);
  }
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
When('I enter team password {string}', async ({ page }, password: string) => {
  // Wait for password field to be visible (appears after selecting private)
  await expect(createTeamModal.passwordInput).toBeVisible({ timeout: 5000 });
  await createTeamModal.fillPassword(password);
});

When('I submit the team creation form', async () => {
  await createTeamModal.submit();
});

When('I click the cancel button', async () => {
  await createTeamModal.cancel();
});

// --- Then Steps ---

Then('I should see the team created success message', async ({ page }) => {
  // Wait for success message (ShareTeamLink component with "Team Created Successfully!")
  await createTeamModal.waitForSuccess();

  // Verify the success header is visible
  const successHeader = page.locator('dialog.create-team-modal h3');
  await expect(successHeader).toContainText('Team Created Successfully!', { timeout: 5000 });
});

Then('I should see a shareable team link', async ({ page }) => {
  // Verify shareable link input is visible
  const linkInput = page.locator('#shareable-link-input');
  await expect(linkInput).toBeVisible({ timeout: 5000 });

  // Verify it contains the team URL
  const linkValue = await linkInput.inputValue();
  expect(linkValue).toContain('/team/');
});

Then('the create team modal should be closed', async () => {
  await createTeamModal.waitForClose();
});

Then('I should see the game menu', async ({ page }) => {
  // Verify menu buttons are visible
  await expect(page.locator('button.start-button')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('.leaderboard-btn')).toBeVisible();
});
