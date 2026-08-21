import { expect, test } from "@playwright/test";

test("redirects unauthenticated users to the login page", async ({ page }) => {
  await page.goto("/home");

  await expect(page).toHaveURL("/login");
  await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
});
