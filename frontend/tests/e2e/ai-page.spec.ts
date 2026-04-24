import { expect, test } from "@playwright/test";

test.describe("AI page", () => {
  test("loads the AI workspace and switches tabs", async ({ page, context }) => {
    await context.addCookies([
      {
        name: "session",
        value: "playwright-session",
        domain: "127.0.0.1",
        path: "/",
        httpOnly: false,
        secure: false,
        sameSite: "Lax",
      },
    ]);

    await page.route("**/api/pdf/materials", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          materials: [
            {
              id: "pdf-1",
              filename: "biology-notes.pdf",
              subject: "Biology",
              created_at: "2026-04-24T10:00:00.000Z",
            },
          ],
        }),
      });
    });

    await page.goto("/ai");

    await expect(
      page.getByRole("heading", {
        name: "Focused AI assistance for your study workflow",
      }),
    ).toBeVisible();

    await expect(
      page.getByRole("button", {
        name: "Upload Study Material",
        exact: true,
      }),
    ).toBeVisible();

    await page.getByRole("button", { name: /summary/i }).click();
    await expect(page.getByText("AI PDF Summarizer")).toBeVisible();

    await page.getByRole("button", { name: /quiz/i }).click();
    await expect(page.getByText("AI Quiz Generator")).toBeVisible();

    await page.getByRole("button", { name: /library/i }).click();
    await expect(
      page.getByPlaceholder("Search text in this PDF..."),
    ).toBeVisible();

    await page.getByRole("button", { name: /ai chat/i }).click();
    await expect(
      page.getByPlaceholder(
        "Ask anything about your material, revision plan, or difficult topic...",
      ),
    ).toBeVisible();
  });
});
