# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: frontend\tests\task-and-schedule.spec.ts >> Tasks page loads and displays tasks
- Location: frontend\tests\task-and-schedule.spec.ts:3:5

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/dashboard/tasks", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('Tasks page loads and displays tasks', async ({ page }) => {
> 4  |   await page.goto('/dashboard/tasks');
     |              ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  5  |   await expect(page.getByText(/tasks|add task|no tasks/i)).toBeVisible();
  6  | });
  7  | 
  8  | test('Planner page loads and displays smart schedule', async ({ page }) => {
  9  |   await page.goto('/dashboard/planner');
  10 |   await expect(page.getByText(/plan|schedule|study session|task/i)).toBeVisible();
  11 | });
  12 | 
```