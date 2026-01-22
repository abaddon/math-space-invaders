import { BeforeAll, AfterAll, Before, After } from './fixtures';

BeforeAll(async function () {
  console.log('[E2E] Test suite starting...');
});

Before(async function ({ $testInfo }) {
  console.log(`[E2E] Starting scenario: ${$testInfo.title}`);
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
