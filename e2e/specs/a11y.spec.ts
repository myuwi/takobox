import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { createCredentials, logIn, registerUser } from "../support/auth";
import { createCollection } from "../support/collections";
import { uploadFile } from "../support/files";

test.beforeEach(async ({ page, request }, testInfo) => {
  const credentials = createCredentials(testInfo);
  await registerUser(request, credentials);
  await logIn(page, credentials);
  await createCollection(page, "Accessible collection");
  await uploadFile(page, "accessible-file.txt", "File used for the accessibility scan.");
});

test("has no automatically detectable accessibility violations on the populated files page", async ({
  page,
}) => {
  const generalResults = await new AxeBuilder({ page }).disableRules(["color-contrast"]).analyze();
  const contrastResults = await new AxeBuilder({ page })
    .withRules(["color-contrast"])
    .exclude("[data-a11y-contrast-exempt]")
    .analyze();

  expect([...generalResults.violations, ...contrastResults.violations]).toEqual([]);
});
