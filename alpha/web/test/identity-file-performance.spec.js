import { expect, test } from "@playwright/test";

import {
  IDENTITY_FILE_KDF_PROFILE,
  IDENTITY_FILE_LAYOUT,
} from "../src/identity-file.js";
import {
  exportIdentityFile,
  generateIdentity,
  importIdentityFile,
  runtimeBrowserPassphrase,
} from "./helpers.js";

test("records one real fixed-profile export and import without a timing threshold", async ({
  browser,
  browserName,
  page,
}) => {
  await page.goto("/");
  const originalContact = await generateIdentity(page);
  const passphrase = runtimeBrowserPassphrase();

  const exportStart = performance.now();
  const file = await exportIdentityFile(page, passphrase);
  const exportMilliseconds = performance.now() - exportStart;
  expect(file.length).toBe(IDENTITY_FILE_LAYOUT.totalBytes);

  await page.reload();
  const importStart = performance.now();
  await importIdentityFile(page, file, passphrase);
  const importMilliseconds = performance.now() - importStart;
  await expect(page.locator("#own-contact")).toHaveValue(originalContact);

  console.log(
    `ALPHA1_KDF_MEASUREMENT ${JSON.stringify({
      browser: browserName,
      browserVersion: browser.version(),
      profileId: IDENTITY_FILE_KDF_PROFILE.id,
      profileName: IDENTITY_FILE_KDF_PROFILE.name,
      algorithm: IDENTITY_FILE_KDF_PROFILE.algorithm,
      operationsLimit: IDENTITY_FILE_KDF_PROFILE.operationsLimit,
      memoryLimit: IDENTITY_FILE_KDF_PROFILE.memoryLimit,
      exportMilliseconds: Math.round(exportMilliseconds * 100) / 100,
      importMilliseconds: Math.round(importMilliseconds * 100) / 100,
      allocationSucceeded: true,
    })}`,
  );
});
