import type { Page } from "@playwright/test";

export async function createCollection(page: Page, name: string): Promise<void> {
  await page.getByRole("button", { name: "Create collection" }).click();

  const dialog = page.getByRole("dialog", { name: "Create new collection" });
  await dialog.getByRole("textbox", { name: "Name" }).fill(name);
  await dialog.getByRole("button", { name: "Create", exact: true }).click();

  await page.getByRole("link", { name }).waitFor();
}
