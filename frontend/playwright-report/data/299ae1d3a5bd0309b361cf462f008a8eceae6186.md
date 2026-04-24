# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: peerconnect.spec.ts >> PeerConnect >> creates a new study group from the modal
- Location: tests\e2e\peerconnect.spec.ts:169:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Create Study Group')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByText('Create Study Group')

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - complementary [ref=e3]:
    - generic [ref=e4]:
      - link "EduSense logo EduSense Student Productivity OS" [ref=e5] [cursor=pointer]:
        - /url: /landing
        - img "EduSense logo" [ref=e6]
        - generic [ref=e7]:
          - paragraph [ref=e8]: EduSense
          - paragraph [ref=e9]: Student Productivity OS
      - button "Collapse sidebar" [ref=e11]:
        - img [ref=e12]
    - navigation [ref=e15]:
      - generic [ref=e16]:
        - link "Overview" [ref=e17] [cursor=pointer]:
          - /url: /dashboard
          - img [ref=e18]
          - generic [ref=e23]: Overview
        - link "Tasks" [ref=e24] [cursor=pointer]:
          - /url: /tasks
          - img [ref=e25]
          - generic [ref=e28]: Tasks
        - link "Planner" [ref=e29] [cursor=pointer]:
          - /url: /planner
          - img [ref=e30]
          - generic [ref=e32]: Planner
        - link "Materials" [ref=e33] [cursor=pointer]:
          - /url: /materials
          - img [ref=e34]
          - generic [ref=e36]: Materials
        - link "AI Assistant" [ref=e37] [cursor=pointer]:
          - /url: /ai
          - img [ref=e38]
          - generic [ref=e46]: AI Assistant
        - link "Analytics" [ref=e47] [cursor=pointer]:
          - /url: /analytics
          - img [ref=e48]
          - generic [ref=e50]: Analytics
      - generic [ref=e51]:
        - link "Home" [ref=e52] [cursor=pointer]:
          - /url: /landing
          - img [ref=e53]
          - generic [ref=e56]: Home
        - link "User Management" [ref=e57] [cursor=pointer]:
          - /url: /users
          - img [ref=e58]
          - generic [ref=e63]: User Management
        - link "Notifications" [ref=e64] [cursor=pointer]:
          - /url: /notifications
          - img [ref=e65]
          - generic [ref=e68]: Notifications
        - link "Settings" [ref=e69] [cursor=pointer]:
          - /url: /settings
          - img [ref=e70]
          - generic [ref=e73]: Settings
        - generic [ref=e74]:
          - paragraph [ref=e75]: Student
          - paragraph [ref=e76]: No email
  - main [ref=e77]:
    - generic [ref=e78]:
      - generic [ref=e79]:
        - button "Collapse sidebar" [ref=e80]:
          - img [ref=e81]
        - generic [ref=e84]:
          - paragraph [ref=e85]: Workspace
          - heading "Materials" [level=1] [ref=e86]
      - generic [ref=e87]:
        - button "Settings" [ref=e88]:
          - img [ref=e89]
        - button "Profile" [ref=e92]:
          - generic [ref=e93]: U
          - generic [ref=e94]: Profile
        - button "Logout" [ref=e95]:
          - img [ref=e96]
    - generic [ref=e100]:
      - generic [ref=e102]:
        - generic [ref=e103]:
          - img [ref=e105]
          - generic [ref=e110]:
            - paragraph [ref=e111]: Collaboration Space
            - heading "PeerConnect Materials Hub" [level=1] [ref=e112]
        - generic [ref=e113]:
          - generic [ref=e114]:
            - img [ref=e115]
            - text: Smart Group Discovery
          - generic [ref=e118]: Live Collaboration
          - button "Create New Group" [active] [ref=e120]:
            - img [ref=e121]
            - text: Create New Group
      - generic [ref=e128]:
        - generic [ref=e129]:
          - generic [ref=e130]:
            - img [ref=e131]
            - text: Live Peer Activity
          - generic [ref=e133]: 0 Groups Active Now
        - generic [ref=e135]:
          - img [ref=e136]
          - generic [ref=e139]:
            - generic [ref=e140]: 08:00
            - generic [ref=e141]: 12:00
            - generic [ref=e142]: 16:00
            - generic [ref=e143]: 20:00
            - generic [ref=e144]: Now
      - generic [ref=e146]:
        - generic [ref=e147]:
          - text: Targeted Modules
          - generic [ref=e148]: "6"
        - generic [ref=e149]:
          - generic [ref=e150] [cursor=pointer]:
            - generic [ref=e152]: CS2040
            - generic [ref=e153]: Data Structures
            - generic [ref=e154]: 24 students
          - generic [ref=e155] [cursor=pointer]:
            - generic [ref=e157]: MA1101
            - generic [ref=e158]: Linear Algebra
            - generic [ref=e159]: 18 students
          - generic [ref=e160] [cursor=pointer]:
            - generic [ref=e162]: CS3230
            - generic [ref=e163]: Algorithms
            - generic [ref=e164]: 31 students
          - generic [ref=e165] [cursor=pointer]:
            - generic [ref=e167]: ST2334
            - generic [ref=e168]: Probability
            - generic [ref=e169]: 15 students
          - generic [ref=e170] [cursor=pointer]:
            - generic [ref=e172]: CS2103
            - generic [ref=e173]: Software Eng.
            - generic [ref=e174]: 42 students
          - generic [ref=e175] [cursor=pointer]:
            - generic [ref=e177]: IS3103
            - generic [ref=e178]: Info Systems
            - generic [ref=e179]: 11 students
      - generic [ref=e181]:
        - generic [ref=e182]:
          - text: Discover Peer Groups
          - generic [ref=e183]: "0"
        - generic [ref=e184]:
          - generic [ref=e185]:
            - button "All" [ref=e186] [cursor=pointer]
            - button "CS2040" [ref=e187] [cursor=pointer]
            - button "MA1101" [ref=e188] [cursor=pointer]
            - button "CS3230" [ref=e189] [cursor=pointer]
            - button "ST2334" [ref=e190] [cursor=pointer]
            - button "CS2103" [ref=e191] [cursor=pointer]
            - button "IS3103" [ref=e192] [cursor=pointer]
          - generic [ref=e193]:
            - textbox "Search by group name, module, or tags..." [ref=e194]
            - img [ref=e195]
```

# Test source

```ts
  72  |         const payload = JSON.parse(route.request().postData() || "{}");
  73  |         const created = {
  74  |           id: `group-${groups.length + 1}`,
  75  |           name: payload.name,
  76  |           module: payload.module,
  77  |           schedule: payload.schedule,
  78  |           max_members: payload.max_members,
  79  |           members: 1,
  80  |           tags: payload.tags ?? [],
  81  |           is_joined: true,
  82  |           leader_name: payload.leader_name,
  83  |           leader_email: payload.leader_email,
  84  |         };
  85  |         groups = [created, ...groups];
  86  |         await route.fulfill({
  87  |           status: 200,
  88  |           contentType: "application/json",
  89  |           body: JSON.stringify(created),
  90  |         });
  91  |         return;
  92  |       }
  93  | 
  94  |       await route.fallback();
  95  |     });
  96  | 
  97  |     await page.route("**/api/groups/invites/me", async (route) => {
  98  |       await route.fulfill({
  99  |         status: 200,
  100 |         contentType: "application/json",
  101 |         body: JSON.stringify(invites),
  102 |       });
  103 |     });
  104 | 
  105 |     await page.route("**/api/groups/*/join", async (route) => {
  106 |       const match = route.request().url().match(/\/groups\/([^/]+)\/join/);
  107 |       const groupId = match?.[1];
  108 |       const current = groups.find((group) => group.id === groupId);
  109 |       if (!current) {
  110 |         await route.fulfill({ status: 404, body: JSON.stringify({ detail: "Not found" }) });
  111 |         return;
  112 |       }
  113 | 
  114 |       const updated = {
  115 |         ...current,
  116 |         is_joined: true,
  117 |         members: current.members + 1,
  118 |       };
  119 |       groups = groups.map((group) => (group.id === groupId ? updated : group));
  120 | 
  121 |       await route.fulfill({
  122 |         status: 200,
  123 |         contentType: "application/json",
  124 |         body: JSON.stringify(updated),
  125 |       });
  126 |     });
  127 | 
  128 |     await page.route("**/api/groups/invites/*/accept", async (route) => {
  129 |       invites = [];
  130 |       const joined = {
  131 |         ...groups[0],
  132 |         is_joined: true,
  133 |         members: groups[0].members + 1,
  134 |       };
  135 |       groups = groups.map((group) => (group.id === joined.id ? joined : group));
  136 | 
  137 |       await route.fulfill({
  138 |         status: 200,
  139 |         contentType: "application/json",
  140 |         body: JSON.stringify(joined),
  141 |       });
  142 |     });
  143 | 
  144 |     await page.goto("/materials");
  145 |   });
  146 | 
  147 |   test("shows groups, filters them, and joins a group", async ({ page }) => {
  148 |     await expect(
  149 |       page.getByRole("heading", { name: "PeerConnect Materials Hub" }),
  150 |     ).toBeVisible();
  151 | 
  152 |     await expect(page.getByText("CS2040 Midterm Sprint")).toBeVisible();
  153 |     await expect(page.getByText("CS2103 Revision Circle")).toBeVisible();
  154 | 
  155 |     await page.getByRole("button", { name: "CS2040" }).click();
  156 |     await expect(page.getByText("CS2040 Midterm Sprint")).toBeVisible();
  157 |     await expect(page.getByText("CS2103 Revision Circle")).toHaveCount(0);
  158 | 
  159 |     await page.getByPlaceholder("Search by group name, module, or tags...").fill("CS2103");
  160 |     await page.getByRole("button", { name: "All" }).click();
  161 |     await expect(page.getByText("CS2103 Revision Circle")).toBeVisible();
  162 |     await expect(page.getByText("CS2040 Midterm Sprint")).toHaveCount(0);
  163 | 
  164 |     await page.getByPlaceholder("Search by group name, module, or tags...").fill("");
  165 |     await page.getByRole("button", { name: /^Join$/ }).first().click();
  166 |     await expect(page.getByRole("button", { name: /joined/i }).first()).toBeVisible();
  167 |   });
  168 | 
  169 |   test("creates a new study group from the modal", async ({ page }) => {
  170 |     await page.getByRole("button", { name: /create new group/i }).click();
  171 | 
> 172 |     await expect(page.getByText("Create Study Group")).toBeVisible();
      |                                                        ^ Error: expect(locator).toBeVisible() failed
  173 | 
  174 |     const inputs = page.locator("input");
  175 |     await inputs.nth(0).fill("AI Systems Guild");
  176 |     await inputs.nth(1).fill("Nina Patel");
  177 |     await inputs.nth(2).fill("nina@example.com");
  178 | 
  179 |     await page.locator("select").first().selectOption("CS2040");
  180 |     await inputs.nth(3).fill("Tue, 7pm");
  181 |     await inputs.nth(4).fill("5");
  182 |     await inputs.nth(5).fill("AI, Research");
  183 | 
  184 |     await page.getByRole("button", { name: /^Create Group$/ }).click();
  185 | 
  186 |     await expect(page.getByText("AI Systems Guild")).toBeVisible();
  187 |   });
  188 | });
  189 | 
```