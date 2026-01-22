import { Given, When, Then } from '../../support/fixtures';
import { expect } from '@playwright/test';
import { AuthPage } from '../../support/page-objects/AuthPage';

// Store generated credentials for cross-step access
let generatedUsername: string;
let generatedPassword: string;

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
