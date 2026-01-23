import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

const testDir = defineBddConfig({
  paths: ['e2e/features/**/*.feature'],
  require: ['e2e/features/**/*.ts', 'e2e/support/**/*.ts'],
});

export default defineConfig({
  testDir,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [['blob', { outputDir: 'blob-report' }]]
    : [
        ['line'],
        ['html', { open: 'always', outputFolder: 'playwright-report' }],
      ],
  outputDir: 'test-results',

  use: {
    baseURL: 'http://localhost:5173/math-space-invaders/',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    viewport: { width: 1920, height: 1080 },
    actionTimeout: 10000,
    headless: true,
    // Disable touch to ensure canvas clicks work (game disables canvas click on touch devices)
    hasTouch: false,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
