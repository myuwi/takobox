import type { Page } from "@playwright/test";

export async function uploadFile(page: Page, name: string, contents: string): Promise<void> {
  const fileChooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Browse files" }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles({
    name,
    mimeType: "text/plain",
    buffer: Buffer.from(contents),
  });

  await page.getByRole("gridcell", { name }).waitFor();
}
