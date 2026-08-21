import { expect, test } from "@playwright/test";

test("exposes application settings", async ({ request }) => {
  const response = await request.get("/api/settings");

  expect(response.ok()).toBe(true);
  expect(await response.json()).toEqual({
    enableAccountCreation: true,
    maxFileSize: 32_000_000,
  });
});

test("renders the login page", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
});
