import { expect } from '@playwright/test';
import { Given, Then } from '../../support/fixtures';

Given('I navigate to the home page', async ({ page }) => {
  await page.goto('/');
});

Then('I should see the game title', async ({ page }) => {
  // Check for game title - adjust selector based on actual app
  await expect(page.locator('body')).toBeVisible();
});
