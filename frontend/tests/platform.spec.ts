import { test, expect } from "@playwright/test";
import path from "node:path";
test.beforeEach(async ({ page }) => {
  for (const extension of ["wav", "srt"])
    await page.route("https://media.example.test/clue." + extension, (route) =>
      route.fulfill({
        path: path.resolve("public/demo/clue." + extension),
        contentType: extension === "wav" ? "audio/wav" : "text/plain",
        headers: { "access-control-allow-origin": "*" },
      }),
    );
});
const password = process.env.DEMO_PASSWORD || "Demo-only-password-2026!";
test("team journey: login, locked challenge, solve, scoreboard, logout", async ({
  page,
}, info) => {
  const team = info.project.name === "mobile" ? 2 : 1;
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Welcome to TechHunt" }),
  ).toBeVisible();
  await page.getByLabel("Email address").fill("team" + team + "@example.test");
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(
    page.getByRole("heading", { name: "The plot thickens" }),
  ).toBeVisible();
  await expect(
    page.getByText("Solve previous questions to unlock").first(),
  ).toBeVisible();
  await page.screenshot({
    path: "../docs/screenshots/questions-" + info.project.name + ".png",
    fullPage: true,
  });
  await page
    .getByRole("link", { name: "Attempt", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "Toggle", exact: true }).click();
  await expect(page.getByText("A signal in the silence.")).toBeVisible();
  await page.getByRole("button", { name: "Play audio", exact: true }).click();
  await expect(
    page.getByText("Three short tones. The trail begins here."),
  ).toBeVisible();
  await page.getByRole("textbox", { name: "Flag", exact: true }).fill("wrong");
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Wrong flag" }),
  ).toContainText("Wrong flag");
  await page
    .getByRole("textbox", { name: "Flag", exact: true })
    .fill("flag{first_clue}");
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "The plot thickens" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Solved Â· revisit" }),
  ).toBeVisible();
  await page.goto("/scoreboard");
  await expect(page.getByRole("heading", { name: "Scorecard" })).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "Practice Team " + team, exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "../docs/screenshots/scoreboard-" + info.project.name + ".png",
    fullPage: true,
  });
  await page.goto("/logout");
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Welcome to TechHunt" }),
  ).toBeVisible();
  await page.goto("/questions");
  await expect(
    page.getByRole("heading", { name: "Welcome to TechHunt" }),
  ).toBeVisible();
});
test("CSV with a quoted team name validates; organizer sees generated credentials", async ({
  page,
}, info) => {
  await page.goto("/");
  await page.getByLabel("Email address").fill("organizer@example.test");
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(
    page.getByRole("heading", { name: "The plot thickens" }),
  ).toBeVisible();
  await page.goto("/admin/users");
  await expect(page.getByLabel("Team CSV")).toBeEnabled();
  await page
    .getByLabel("Team CSV")
    .setInputFiles({
      name: "teams.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(
        'username,email\n"Quoted, Team",quoted-' +
          info.project.name +
          "@example.test\n",
      ),
    });
  await page.getByRole("button", { name: "Validate import" }).click();
  await expect(
    page.getByRole("heading", { name: "Validation preview" }),
  ).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "Quoted, Team", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Create / update teams" }).click();
  await expect(
    page.getByRole("button", { name: "Download credentials once" }),
  ).toBeVisible();
});
test("proxy rejects foreign origins and unknown routes; certificates reject tampering", async ({
  request,
  page,
}) => {
  const rejected = await request.post("/api/v1/auth/login/", {
    headers: { Origin: "https://attacker.example" },
    data: { email: "x@example.test", password: "x" },
  });
  expect(rejected.status()).toBe(403);
  expect((await request.get("/api/v1/admin/secrets/")).status()).toBe(404);
  await page.goto("/certificate/invalid");
  await expect(page.getByText("Invalid or revoked certificate.")).toBeVisible();
});

test("synthetic certificate verifies in the frontend", async ({ page }) => {
  await page.goto(
    "/certificate/00000000-0000-4000-8000-000000000001:gJhi3SnllGryH7CIV9EBzIlnAEhPsEW2V9PYpXg5Wdg",
  );
  await expect(
    page.getByText("Verified certificate", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Practice Team 3", { exact: true }),
  ).toBeVisible();
});
