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
        domain: "127.0.0.1",
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

    await page.route("**/api/groups/", async (route) => {
      const method = route.request().method();

      if (method === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(groups),
        });
        return;
      }

      if (method === "POST") {
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

      await route.fallback();
    });

    await page.route("**/api/groups/invites/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(invites),
      });
    });

    await page.route("**/api/groups/*/join", async (route) => {
      const match = route.request().url().match(/\/groups\/([^/]+)\/join/);
      const groupId = match?.[1];
      const current = groups.find((group) => group.id === groupId);
      if (!current) {
        await route.fulfill({ status: 404, body: JSON.stringify({ detail: "Not found" }) });
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
    });

    await page.route("**/api/groups/invites/*/accept", async (route) => {
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
    });

    await page.goto("/materials");
  });

  test("shows groups, filters them, and joins a group", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "PeerConnect Materials Hub" }),
    ).toBeVisible();

    await expect(page.getByText("CS2040 Midterm Sprint")).toBeVisible();
    await expect(page.getByText("CS2103 Revision Circle")).toBeVisible();

    await page.getByRole("button", { name: "CS2040" }).click();
    await expect(page.getByText("CS2040 Midterm Sprint")).toBeVisible();
    await expect(page.getByText("CS2103 Revision Circle")).toHaveCount(0);

    await page.getByPlaceholder("Search by group name, module, or tags...").fill("CS2103");
    await page.getByRole("button", { name: "All" }).click();
    await expect(page.getByText("CS2103 Revision Circle")).toBeVisible();
    await expect(page.getByText("CS2040 Midterm Sprint")).toHaveCount(0);

    await page.getByPlaceholder("Search by group name, module, or tags...").fill("");
    await page.getByRole("button", { name: /^Join$/ }).first().click();
    await expect(page.getByRole("button", { name: /joined/i }).first()).toBeVisible();
  });

  test("creates a new study group from the modal", async ({ page }) => {
    await page.getByRole("button", { name: /create new group/i }).click();

    await expect(page.getByText("Create Study Group")).toBeVisible();

    const inputs = page.locator("input");
    await inputs.nth(0).fill("AI Systems Guild");
    await inputs.nth(1).fill("Nina Patel");
    await inputs.nth(2).fill("nina@example.com");

    await page.locator("select").first().selectOption("CS2040");
    await inputs.nth(3).fill("Tue, 7pm");
    await inputs.nth(4).fill("5");
    await inputs.nth(5).fill("AI, Research");

    await page.getByRole("button", { name: /^Create Group$/ }).click();

    await expect(page.getByText("AI Systems Guild")).toBeVisible();
  });
});
