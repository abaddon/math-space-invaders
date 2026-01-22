import { test } from 'playwright-bdd';
import { createBdd } from 'playwright-bdd';

/**
 * Custom World for playwright-bdd
 *
 * Provides access to Playwright fixtures in step definitions:
 * - page: Playwright Page object for browser interaction
 * - context: Browser context for managing cookies, storage, etc.
 * - browser: Browser instance for multi-context scenarios
 * - $testInfo: Test metadata including title, status, outputPath
 * - $tags: Array of Cucumber tags on the scenario
 *
 * Usage in step definitions:
 *   Given('I navigate to {string}', async ({ page }) => { ... })
 */
export const { Given, When, Then, Before, After, BeforeAll, AfterAll } = createBdd(test);
