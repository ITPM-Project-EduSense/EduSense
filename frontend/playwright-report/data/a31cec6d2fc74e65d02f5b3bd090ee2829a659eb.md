# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: task-and-schedule.spec.ts >> Tasks page loads and displays tasks
- Location: tests\task-and-schedule.spec.ts:3:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: /manage your tasks/i })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('heading', { name: /manage your tasks/i })

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e5]:
    - generic [ref=e7]:
      - generic [ref=e8]:
        - img "EduSense logo" [ref=e9]
        - heading "EduSense" [level=1] [ref=e10]
      - generic [ref=e11]:
        - heading "Study with calm precision" [level=2] [ref=e12]:
          - text: Study with
          - generic [ref=e13]: calm precision
        - paragraph [ref=e14]: Plan your priorities, protect deep work hours, and stay ahead of deadlines with AI support built for academic flow.
      - generic [ref=e39]:
        - img "EduSense logo" [ref=e40]
        - generic [ref=e41]:
          - paragraph [ref=e42]: EduSense
          - paragraph [ref=e43]: Focus OS
    - generic [ref=e46]:
      - generic [ref=e47]:
        - paragraph [ref=e48]: Welcome back
        - heading "Continue your momentum" [level=2] [ref=e49]
      - generic [ref=e50]:
        - generic [ref=e51]:
          - text: Email
          - generic [ref=e52]:
            - img [ref=e53]
            - textbox "student@example.com" [ref=e56]
        - generic [ref=e57]:
          - text: Password
          - generic [ref=e58]:
            - img [ref=e59]
            - textbox "********" [ref=e62]
            - button "Show password" [ref=e63]:
              - img [ref=e64]
        - button "Forgot password?" [ref=e68]
        - button "Enter Workspace" [ref=e69]:
          - text: Enter Workspace
          - img [ref=e70]
      - generic [ref=e74]: or continue
      - button "Continue with Google" [ref=e76]:
        - img [ref=e77]
        - text: Continue with Google
      - paragraph [ref=e82]:
        - text: New here?
        - link "Create account" [ref=e83] [cursor=pointer]:
          - /url: /register
  - button "Open Next.js Dev Tools" [ref=e89] [cursor=pointer]:
    - img [ref=e90]
  - alert [ref=e93]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('Tasks page loads and displays tasks', async ({ page }) => {
  4  |   await page.goto('/dashboard/tasks');
  5  |   // Check for the main header text that is always present
> 6  |   await expect(page.getByRole('heading', { name: /manage your tasks/i })).toBeVisible();
     |                                                                           ^ Error: expect(locator).toBeVisible() failed
  7  | });
  8  | 
  9  | test('Planner page loads and displays smart schedule', async ({ page }) => {
  10 |   await page.goto('/dashboard/planner');
  11 |   await expect(page.getByText(/plan|schedule|study session|task/i)).toBeVisible();
  12 | });
  13 | 
```