import { expect, test } from "@playwright/test";
import { createCredentials, logIn, registerUser } from "../support/auth";

test.beforeEach(async ({ page, request }, testInfo) => {
  const credentials = createCredentials(testInfo);
  await registerUser(request, credentials);
  await logIn(page, credentials);
});

const ABOVE_BACKEND_FORM_PARSE_LIMIT = 128 * 1024;

test("uploads a file and displays it in the grid", async ({ page }) => {
  const fileChooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Browse files" }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles({
    name: "e2e-upload.txt",
    mimeType: "text/plain",
    buffer: Buffer.alloc(ABOVE_BACKEND_FORM_PARSE_LIMIT, "takobox"),
  });

  await expect(page.getByRole("gridcell", { name: "e2e-upload.txt" })).toBeVisible();
});
