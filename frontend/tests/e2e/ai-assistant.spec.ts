import { expect, test } from "@playwright/test";

test.describe("AI assistant area", () => {
  test.beforeEach(async ({ context, page }) => {
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });

    // Middleware checks only for cookie presence, so this unlocks /ai in tests.
    await context.addCookies([
      {
        name: "edusense_token",
        value: "playwright-test-token",
        domain: "localhost",
        path: "/",
        httpOnly: false,
        secure: false,
        sameSite: "Lax",
      },
    ]);

    await page.goto("/ai");
    await expect(page.getByTestId("ai-page-shell")).toBeVisible();
    await expect(page.getByTestId("ai-tab-chat")).toBeVisible();
    await expect(page.getByTestId("ai-active-tab-panel")).toBeVisible();
  });

  test("shows chat tab by default", async ({ page }) => {
    await expect(page.getByTestId("ai-tab-chat")).toBeVisible();
    await expect(
      page.getByPlaceholder(
        "Ask anything about your material, revision plan, or difficult topic...",
      ),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Send" })).toBeVisible();
  });

  test("switches to summarizer tab", async ({ page }) => {
    await page.goto("/ai?tab=summary");
    await expect(page.getByTestId("ai-tab-summary")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "AI PDF Summarizer" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Generate Summary" }),
    ).toBeVisible();
    await expect(page.locator("select").first()).toContainText(
      "-- Select an uploaded PDF --",
    );
  });

  test("switches to quiz tab", async ({ page }) => {
    await page.goto("/ai?tab=quiz");
    await expect(page.getByTestId("ai-tab-quiz")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "AI Quiz Generator" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Generate Quiz" }),
    ).toBeVisible();
    await expect(page.locator("select").first()).toContainText(
      "-- Select an uploaded PDF --",
    );
  });

  test("switches to library tab", async ({ page }) => {
    await page.goto("/ai?tab=pdf");
    await expect(page.getByTestId("ai-tab-pdf")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "PDF Viewer (Debug)" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Reload Content" }),
    ).toBeVisible();
    await expect(page.locator("select").first()).toContainText(
      "-- Select an uploaded PDF --",
    );
  });

  test("opens upload modal", async ({ page }) => {
    await page.getByTestId("ai-upload-material-button").click();
    await expect(
      page.getByRole("heading", { name: "Upload Study Material" }),
    ).toBeVisible();
    await expect(
      page.getByText("Click to select PDF, DOCX or PPTX"),
    ).toBeVisible();
  });
});
