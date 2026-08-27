import { expect, type APIRequestContext, type Page, type TestInfo } from "@playwright/test";

export interface Credentials {
  username: string;
  password: string;
}

export function createCredentials(testInfo: TestInfo): Credentials {
  return {
    username: `e2e-${Date.now().toString(36)}-${testInfo.workerIndex}-${testInfo.retry}`,
    password: "e2e-password",
  };
}

export async function registerUser(
  request: APIRequestContext,
  credentials: Credentials,
): Promise<void> {
  const response = await request.post("/api/auth/register", { data: credentials });

  await expect(response).toBeOK();
}

export async function logIn(page: Page, credentials: Credentials): Promise<void> {
  await page.goto("/login");
  await page.getByRole("textbox", { name: "Username" }).fill(credentials.username);
  await page.getByLabel("Password").fill(credentials.password);
  await page.getByRole("button", { name: "Log in" }).click();
}
