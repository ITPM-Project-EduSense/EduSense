# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: frontend\tests\ai-page.spec.ts >> AI page loads and displays main elements
- Location: frontend\tests\ai-page.spec.ts:3:5

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/ai", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('AI page loads and displays main elements', async ({ page }) => {
> 4  |   await page.goto('/ai');
     |              ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  5  |   await expect(page.getByText('AI Study Studio')).toBeVisible();
  6  |   await expect(page.getByText('AI Chat')).toBeVisible();
  7  |   await expect(page.getByText('Summary')).toBeVisible();
  8  |   await expect(page.getByText('Quiz')).toBeVisible();
  9  |   await expect(page.getByText('Library')).toBeVisible();
  10 | });
  11 | 
```