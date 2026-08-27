import { expect, test, type Page } from "@playwright/test";
import { createCredentials, logIn, registerUser } from "../support/auth";

async function stubFileRequests(page: Page, status: number) {
  let count = 0;

  await page.route("**/api/files*", (route) => {
    count += 1;
    return route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify({ message: "Request failed" }),
    });
  });

  return () => count;
}

test("stays logged in when the backend is unreachable", async ({ page, request }, testInfo) => {
  const credentials = createCredentials(testInfo);
  await registerUser(request, credentials);

  const fileRequestCount = await stubFileRequests(page, 500);

  await logIn(page, credentials);

  await expect(page).toHaveURL("/home");
  await expect(page.getByRole("button", { name: /Logged in as/ })).toBeVisible();
  expect(fileRequestCount()).toBeGreaterThan(0);
});

test("logs out when the session is no longer accepted", async ({ page, request }, testInfo) => {
  const credentials = createCredentials(testInfo);
  await registerUser(request, credentials);

  const fileRequestCount = await stubFileRequests(page, 401);

  await logIn(page, credentials);

  await expect(page.getByText("Your session has expired")).toBeVisible();
  await expect(page).toHaveURL("/login");
  expect(fileRequestCount()).toBeGreaterThan(0);
});

test("does not claim the session expired on a plain visit to the login page", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
  await expect(page.getByText("Your session has expired")).toBeHidden();
});
