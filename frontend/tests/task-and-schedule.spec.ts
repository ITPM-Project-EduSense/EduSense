import { test, expect } from '@playwright/test';

test('Tasks page loads and displays tasks', async ({ page }) => {
  await page.goto('/dashboard/tasks');
  // Check for the main header text that is always present
  await expect(page.getByRole('heading', { name: /manage your tasks/i })).toBeVisible();
});

test('Planner page loads and displays smart schedule', async ({ page }) => {
  await page.goto('/dashboard/planner');
  await expect(page.getByText(/plan|schedule|study session|task/i)).toBeVisible();
});
