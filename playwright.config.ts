import { defineConfig, devices } from '@playwright/test';

/**
 * Critical-flow browser tests. They expect the AtlasGuard API (with the development
 * fixture provider enabled) and this dashboard to be running:
 *
 *   API:       pnpm dev:api           (in atlasguard-backend)
 *   Dashboard: pnpm build && pnpm start
 *   Tests:     pnpm test:e2e
 *
 * Evaluations in these tests use SIMULATED fixtures, so they exercise the product flow,
 * not N-ATLaS itself.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    acceptDownloads: true,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } }],
});
