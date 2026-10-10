import { expect, test, type Page } from '@playwright/test';

const SHOTS = process.env.E2E_SCREENSHOTS; // optional directory for review screenshots
const unique = Date.now().toString(36);
const user = { name: 'E2E Tester', email: `e2e-${unique}@example.com`, password: 'e2e-password-123' };

async function shot(page: Page, name: string) {
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true });
}

test.describe.configure({ mode: 'serial' });

test('sign up, create a project, run an evaluation and inspect results', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(err.message));

  // Landing → sign up
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Engineering Trust in Nigerian AI.' })).toBeVisible();
  await shot(page, '01-landing');
  await page.getByRole('link', { name: 'Get started' }).click();

  await page.getByLabel('Name').fill(user.name);
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password', { exact: true }).fill(user.password);
  await page.getByLabel('Confirm password').fill(user.password);
  await page.getByRole('button', { name: 'Create account' }).click();

  // Overview with onboarding
  await expect(page).toHaveURL(/\/overview/);
  await expect(page.getByText(`Welcome to AtlasGuard, E2E`)).toBeVisible();
  await shot(page, '02-overview-onboarding');

  // Create a project
  await page.goto('/projects');
  await page.getByRole('button', { name: 'New project' }).click();
  await page.getByLabel('Project name').fill('E2E agro-advisory bot');
  await page.getByLabel('Description').fill('Created by the Playwright critical-flow test.');
  await page.getByRole('button', { name: 'Create project' }).click();
  await expect(page.getByRole('heading', { name: 'E2E agro-advisory bot' })).toBeVisible();
  await shot(page, '03-project');

  // Benchmarks: the official suite with its cases
  await page.goto('/benchmarks');
  await expect(page.getByRole('link', { name: 'Nigerian Context Benchmark' })).toBeVisible();
  await shot(page, '04-benchmarks');
  await page.getByRole('link', { name: 'Nigerian Context Benchmark' }).click();
  await expect(page.getByText('Bank transfer total with fee (Yoruba)')).toBeVisible();
  await page.getByText('Bank transfer total with fee (Yoruba)').click();
  await expect(page.getByText('AI-generated translation').first()).toBeVisible();
  await shot(page, '05-benchmark-case');

  // New evaluation with SIMULATED fixtures (N-ATLaS is not configured in this test environment)
  await page.goto('/evaluations/new');
  await page.getByRole('combobox', { name: 'Project' }).click();
  await page.getByRole('option', { name: 'E2E agro-advisory bot' }).click();
  await page.getByRole('button', { name: /Nigerian Context Benchmark/ }).click();
  await page.getByRole('button', { name: /Development fixtures/ }).click();
  await page.getByText('I understand this run is simulated').click();
  await shot(page, '06-new-evaluation');
  await page.getByRole('button', { name: 'Start evaluation' }).click();

  // Run details: wait for completion, then inspect results and the cross-language view
  await expect(page).toHaveURL(/\/evaluations\/[0-9a-f-]{36}/);
  await expect(page.getByText('Simulated run.')).toBeVisible();
  await expect(page.getByText('Completed', { exact: true }).first()).toBeVisible({ timeout: 90_000 });
  await shot(page, '07-run-completed');

  await page.getByRole('button', { name: /Bank transfer total with fee \(Hausa\)/ }).click();
  await expect(page.getByText('Prompt sent to the model (Hausa)')).toBeVisible();
  await expect(page.getByText('fact:total-deducted')).toBeVisible();
  await shot(page, '08-result-expanded');

  await page.getByRole('tab', { name: /Cross-language/ }).click();
  await expect(page.getByText('Bank transfer total with fee').first()).toBeVisible();
  await expect(page.getByText(/numeric_conflict/).first()).toBeVisible();
  await shot(page, '09-consistency');

  // Reports: download CSV
  await page.goto('/reports');
  await expect(page.getByRole('button', { name: /CSV/ })).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: /CSV/ }).click();
  expect((await download).suggestedFilename()).toMatch(/SIMULATED\.csv$/);
  await shot(page, '10-reports');

  // Language insights and developer pages render
  await page.goto('/insights');
  await expect(page.getByText('Not yet evaluated').first()).toBeVisible();
  await page.getByText('Include simulated runs').click();
  await expect(page.getByText('Verified pass rate by language')).toBeVisible();
  await shot(page, '11-insights');
  await page.goto('/developer');
  await expect(page.getByRole('heading', { name: 'Developer API' })).toBeVisible();
  await shot(page, '12-developer');

  expect(consoleErrors.filter((e) => !e.includes('favicon'))).toEqual([]);
});

test('protected routes redirect to login when signed out', async ({ page }) => {
  await page.context().clearCookies();
  await page.goto('/evaluations');
  await expect(page).toHaveURL(/\/login\?next=%2Fevaluations/);
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password').fill('wrong-password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText('Incorrect email or password.')).toBeVisible();
  await page.getByLabel('Password').fill(user.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/evaluations/);
});
