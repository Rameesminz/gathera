import { test, expect } from '@playwright/test';

test('landing page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Gathera/i);
});

test('login page renders', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /continue with google/i })).toBeVisible();
});
