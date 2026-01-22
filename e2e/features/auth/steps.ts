import { Given, When, Then } from '../../support/fixtures';
import { expect } from '@playwright/test';
import { AuthPage } from '../../support/page-objects/AuthPage';

// Store generated credentials for cross-step access
let generatedUsername: string;
let generatedPassword: string;

// Session key constant
const SESSION_KEY = 'mathInvaders_session';

// --- Given Steps ---

Given('I am on the authentication page', async ({ page }) => {
  const authPage = new AuthPage(page);
  await authPage.goto();
  await authPage.waitForAuthScreen();
});

// --- When Steps ---

When('I switch to the sign up tab', async ({ page }) => {
  const authPage = new AuthPage(page);
  await authPage.switchToSignUp();
});

When('I enter a new username and password', async ({ page }) => {
  const authPage = new AuthPage(page);
  // Generate unique username using timestamp to avoid collisions
  generatedUsername = `e2e_${Date.now().toString(36)}`;
  generatedPassword = 'testpass123';
  await authPage.fillCredentials(generatedUsername, generatedPassword);
  await authPage.confirmPasswordInput.fill(generatedPassword);
});

When('I enter username {string} and password {string}', async ({ page }, username: string, password: string) => {
  const authPage = new AuthPage(page);
  await authPage.fillCredentials(username, password);
});

When('I confirm the password {string}', async ({ page }, password: string) => {
  const authPage = new AuthPage(page);
  await authPage.confirmPasswordInput.fill(password);
});

When('I click the submit button', async ({ page }) => {
  const authPage = new AuthPage(page);
  await authPage.submit();
});

// --- Then Steps ---

Then('I should be redirected to the game', async ({ page }) => {
  // Wait for game canvas to appear (indicates successful auth)
  await page.waitForSelector('[data-testid="game-canvas"]', { timeout: 10000 });
});

Then('I should see the game canvas', async ({ page }) => {
  await expect(page.locator('[data-testid="game-canvas"]')).toBeVisible();
});

Then('I should see an error containing {string}', async ({ page }, errorPhrase: string) => {
  const authPage = new AuthPage(page);
  await expect(authPage.errorMessage).toContainText(errorPhrase);
});

// --- Session/Logout Given Steps ---

Given('I am logged in', async ({ page }) => {
  // Navigate to app
  await page.goto('/');

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
  }

  // Wait for game content to appear (either canvas or start button, depending on game state)
  // The game canvas exists in PLAYING state, start button in MENU state
  await page.waitForSelector('[data-testid="game-canvas"], button.start-button', { timeout: 15000 });
});

Given('I have no active session', async ({ page }) => {
  // Clear localStorage before navigating
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
});

// --- Session/Logout When Steps ---

When('I reload the page', async ({ page }) => {
  await page.reload();
  await page.waitForLoadState('networkidle');
});

When('I navigate away and return', async ({ page }) => {
  await page.goto('about:blank');
  await page.goto('/');
  await page.waitForLoadState('networkidle');
});

When('I click the logout button', async ({ page }) => {
  await page.locator('[data-testid="logout-button"]').click();
});

When('I navigate to the app', async ({ page }) => {
  await page.goto('/');
});

// --- Session/Logout Then Steps ---

Then('I should still be on the game screen', async ({ page }) => {
  await expect(page.locator('[data-testid="game-canvas"]')).toBeVisible({ timeout: 10000 });
});

Then('I should not see the login form', async ({ page }) => {
  const authPage = new AuthPage(page);
  await expect(authPage.usernameInput).not.toBeVisible();
});

Then('I should be redirected to the login page', async ({ page }) => {
  const authPage = new AuthPage(page);
  await authPage.waitForAuthScreen();
});

Then('the auth token should be cleared from localStorage', async ({ page }) => {
  const session = await page.evaluate((key) => localStorage.getItem(key), SESSION_KEY);
  expect(session).toBeNull();
});

Then('I should see the authentication page', async ({ page }) => {
  const authPage = new AuthPage(page);
  await authPage.waitForAuthScreen();
});
