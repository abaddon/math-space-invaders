import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      exclude: [
        '**/*.test.ts',
        '**/types.ts',
        '**/__mocks__/**',
        '**/vite-env.d.ts',
        '**/main.tsx',
        '**/App.tsx',
        '**/components/**',
        '**/pages/**',
        '**/contexts/**',
        '**/firebase.ts',
        '**/analytics.ts',
        '**/leaderboardService.ts',
        '**/constants.ts',
        '**/mathGenerator.ts',
        '**/services/teamService.ts',
        '**/authService.ts',
      ],
      thresholds: {
        statements: 90,
        branches: 75,
        functions: 100,
        lines: 90,
      },
    },
  },
});
