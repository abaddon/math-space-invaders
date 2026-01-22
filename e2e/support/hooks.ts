import { BeforeAll, AfterAll, Before, After } from './fixtures';

BeforeAll(async function () {
  console.log('[E2E] Test suite starting...');
});

Before(async function ({ $testInfo }) {
  console.log(`[E2E] Starting scenario: ${$testInfo.title}`);
});

// Tag-based hook for unauthenticated scenarios
Before({ tags: '@unauthenticated' }, async function ({ page }) {
  // Navigate to page first to ensure localStorage is accessible
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  console.log('[E2E] Cleared localStorage for unauthenticated scenario');
});

// Tag-based hook for authenticated scenarios
Before({ tags: '@authenticated' }, async function () {
  console.log('[E2E] Authenticated scenario - expecting storageState');
});

// Viewport tag hooks for responsive testing
Before({ tags: '@viewport:1920x1080' }, async function ({ page }) {
  await page.setViewportSize({ width: 1920, height: 1080 });
  console.log('[E2E] Set viewport to 1920x1080 (Full HD)');
});

Before({ tags: '@viewport:375x667' }, async function ({ page }) {
  await page.setViewportSize({ width: 375, height: 667 });
  console.log('[E2E] Set viewport to 375x667 (iPhone SE)');
});

After(async function ({ $testInfo }) {
  // Screenshot-on-failure is handled by Playwright config (screenshot: 'only-on-failure')
  // This hook provides lifecycle logging for debugging
  const status = $testInfo.status ?? 'unknown';
  console.log(`[E2E] Finished scenario: ${$testInfo.title} - ${status}`);

  if (status === 'failed') {
    console.log(`[E2E] Screenshot saved to: ${$testInfo.outputDir}`);
  }
});

AfterAll(async function () {
  console.log('[E2E] Test suite completed.');
});
