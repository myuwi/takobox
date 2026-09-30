import { expect, test } from "@playwright/test";
import { createCredentials, logIn, registerUser } from "../support/auth";
import { uploadFile } from "../support/files";

for (const [name, contents] of [
  ["page.html", "<h1>Uploaded</h1>"],
  ["image.svg", '<svg xmlns="http://www.w3.org/2000/svg"><text>Uploaded</text></svg>'],
  ["page", "<h1>Uploaded</h1>"],
] as const) {
  test(`an uploaded ${name} is shown as source`, async ({ page, request }, testInfo) => {
    const credentials = createCredentials(testInfo);
    await registerUser(request, credentials);
    await logIn(page, credentials);
    await uploadFile(page, name, contents);

    const filePagePromise = page.waitForEvent("popup");
    await page.getByRole("gridcell", { name }).dblclick();
    const filePage = await filePagePromise;

    await expect(filePage.getByText(contents)).toBeVisible();
  });
}
