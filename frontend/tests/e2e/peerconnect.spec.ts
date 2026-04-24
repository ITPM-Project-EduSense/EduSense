import { expect, test } from "@playwright/test";

const baseGroups = [
  {
    id: "group-1",
    name: "CS2040 Midterm Sprint",
    module: "CS2040",
    schedule: "Mon & Wed, 8pm",
    max_members: 6,
    members: 2,
    tags: ["Midterm", "SQL"],
    is_joined: false,
    leader_name: "Jane Doe",
    leader_email: "jane@example.com",
  },
  {
    id: "group-2",
    name: "CS2103 Revision Circle",
    module: "CS2103",
    schedule: "Fri, 6pm",
    max_members: 5,
    members: 1,
    tags: ["Java", "Revision"],
    is_joined: false,
    leader_name: "John Smith",
    leader_email: "john@example.com",
  },
];

test.describe("PeerConnect", () => {
  test.beforeEach(async ({ context, page }) => {
    await context.addCookies([
      {
        name: "session",
        value: "playwright-session",
        domain: "localhost",
        path: "/",
        httpOnly: false,
        secure: false,
        sameSite: "Lax",
      },
    ]);

    let groups = structuredClone(baseGroups);
    let invites = [
      {
        id: "invite-1",
        group_id: "group-1",
        group_name: "CS2040 Midterm Sprint",
        group_module: "CS2040",
        invited_email: "student@example.com",
        invited_by_name: "Jane Doe",
        status: "pending",
        email_sent: true,
        created_at: "2026-04-24T10:00:00.000Z",
      },
    ];

    await page.route("**/*", async (route) => {
      const url = new URL(route.request().url());
      const path = url.pathname;
      const method = route.request().method();

      if (!path.includes("/api/groups")) {
        await route.fallback();
        return;
      }

      if (path.endsWith("/api/groups/") && method === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(groups),
        });
        return;
      }

      if (path.endsWith("/api/groups/") && method === "POST") {
        const payload = JSON.parse(route.request().postData() || "{}");
        const created = {
          id: `group-${groups.length + 1}`,
          name: payload.name,
          module: payload.module,
          schedule: payload.schedule,
          max_members: payload.max_members,
          members: 1,
          tags: payload.tags ?? [],
          is_joined: true,
          leader_name: payload.leader_name,
          leader_email: payload.leader_email,
        };
        groups = [created, ...groups];
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(created),
        });
        return;
      }

      if (path.endsWith("/api/groups/invites/me") && method === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(invites),
        });
        return;
      }

      if (/\/api\/groups\/[^/]+\/join$/.test(path) && method === "POST") {
        const match = path.match(/\/groups\/([^/]+)\/join$/);
        const groupId = match?.[1];
        const current = groups.find((group) => group.id === groupId);
        if (!current) {
          await route.fulfill({
            status: 404,
            contentType: "application/json",
            body: JSON.stringify({ detail: "Not found" }),
          });
          return;
        }

        const updated = {
          ...current,
          is_joined: true,
          members: current.members + 1,
        };
        groups = groups.map((group) => (group.id === groupId ? updated : group));

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(updated),
        });
        return;
      }

      if (/\/api\/groups\/invites\/[^/]+\/accept$/.test(path) && method === "POST") {
        invites = [];
        const joined = {
          ...groups[0],
          is_joined: true,
          members: groups[0].members + 1,
        };
        groups = groups.map((group) => (group.id === joined.id ? joined : group));

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(joined),
        });
        return;
      }

      if (/\/api\/groups\/invites\/[^/]+\/decline$/.test(path) && method === "POST") {
        invites = [];
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true }),
        });
        return;
      }

      await route.fallback();
    });

    await page.goto("/materials");
  });

  test("shows groups, filters them, and joins a group", async ({ page }) => {
    const exactGroupName = (name: string) => page.getByText(name, { exact: true });

    await expect(
      page.getByRole("heading", { name: "PeerConnect Materials Hub" }),
    ).toBeVisible();

    await expect(exactGroupName("CS2040 Midterm Sprint")).toBeVisible();
    await expect(exactGroupName("CS2103 Revision Circle")).toBeVisible();

    await page.getByRole("button", { name: "CS2040" }).click();
    await expect(exactGroupName("CS2040 Midterm Sprint")).toBeVisible();
    await expect(exactGroupName("CS2103 Revision Circle")).toHaveCount(0);

    await page.getByPlaceholder("Search by group name, module, or tags...").fill("CS2103");
    await page.getByRole("button", { name: "All" }).click();
    await expect(exactGroupName("CS2103 Revision Circle")).toBeVisible();
    await expect(exactGroupName("CS2040 Midterm Sprint")).toHaveCount(0);

    await page.getByPlaceholder("Search by group name, module, or tags...").fill("");
    await page.getByRole("button", { name: /^Join$/ }).first().click();
    await expect(page.getByRole("button", { name: /joined/i }).first()).toBeVisible();
  });

  test("accepts an incoming invite and removes it from the invite list", async ({ page }) => {
    await expect(page.getByText("CS2040 Midterm Sprint", { exact: true })).toBeVisible();
    await expect(page.getByText("Jane Doe invited you to this study group.")).toBeVisible();

    const inviteCard = page.locator(".pc-incoming-item").filter({
      has: page.getByText("Jane Doe invited you to this study group."),
    });
    await inviteCard.getByRole("button", { name: /^Join$/ }).click();

    await expect(page.getByText("Jane Doe invited you to this study group.")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /joined/i }).first()).toBeVisible();
  });

  test("creates a new study group from the modal", async ({ page }) => {
    await page.getByRole("button", { name: /create new group/i }).click();

    const createHeading = page.getByRole("heading", { name: /create study group/i });
    await expect(createHeading).toBeVisible();

    const modal = createHeading.locator("xpath=ancestor::div[contains(@class,'shadow-2xl')][1]");
    await modal.getByPlaceholder("e.g. Midterm Grind Team").fill("AI Systems Guild");
    await modal.getByPlaceholder("e.g. Jane Doe").fill("Nina Patel");
    await modal.getByPlaceholder("e.g. leader@example.com").fill("nina@example.com");
    await modal.locator("select").selectOption("CS2040");
    await modal.locator('input[type="number"]').fill("5");
    await modal.getByPlaceholder("e.g. Mon & Wed, 8pm").fill("Tue, 7pm");
    await modal.getByPlaceholder("e.g. NoobsWelcome, FastPaced").fill("AI, Research");

    await modal.getByRole("button", { name: /^Create Group$/ }).click();

    await expect(page.getByText("AI Systems Guild")).toBeVisible();
  });
});
