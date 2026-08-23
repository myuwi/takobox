import { expect, test } from "@playwright/test";
import { createCredentials, logIn, registerUser } from "../support/auth";

test("redirects unauthenticated users to the login page", async ({ page }) => {
  await page.goto("/home");

  await expect(page).toHaveURL("/login");
  await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
});

test("allows a user to sign up", async ({ page }, testInfo) => {
  const credentials = createCredentials(testInfo);
  await page.goto("/signup");

  await page.getByRole("textbox", { name: "Username" }).fill(credentials.username);
  await page.getByLabel("Password").fill(credentials.password);
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL("/home");
  await expect(page.getByRole("heading", { name: "All files" })).toBeVisible();
});

test("allows a registered user to log in", async ({ page, request }, testInfo) => {
  const credentials = createCredentials(testInfo);
  await registerUser(request, credentials);

  await logIn(page, credentials);

  await expect(page).toHaveURL("/home");
  await expect(page.getByRole("heading", { name: "All files" })).toBeVisible();
});
