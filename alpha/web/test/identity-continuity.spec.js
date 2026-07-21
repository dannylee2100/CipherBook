import { expect, test } from "@playwright/test";

import {
  confirmFullComparison,
  connectPair,
  exportIdentityFile,
  importContact,
  importIdentityFile,
  runtimeBrowserPassphrase,
  sealText,
} from "./helpers.js";

test("manual identity-file restore opens a previously addressed synthetic envelope", async ({
  context,
}) => {
  const alice = await context.newPage();
  const bob = await context.newPage();
  const { aliceContact, bobContact } = await connectPair(alice, bob);
  const relationshipHex = await alice.locator("#relationship-hex").inputValue();
  await confirmFullComparison(alice);
  await confirmFullComparison(bob);

  const plaintext = "synthetic identity-continuity envelope";
  const envelope = await sealText(bob, plaintext);
  const passphrase = runtimeBrowserPassphrase();
  const identityFile = await exportIdentityFile(alice, passphrase);

  await alice.reload();
  await expect(alice.locator("#own-contact")).toHaveValue("");
  await expect(alice.locator("#global-status")).toHaveText(
    "No temporary identity exists.",
  );

  await importIdentityFile(alice, identityFile, passphrase);
  await expect(alice.locator("#own-contact")).toHaveValue(aliceContact);
  await expect(alice.locator("#active-contact")).toHaveText(
    "No counterparty contact imported.",
  );
  await importContact(alice, bobContact);
  await expect(alice.locator("#relationship-hex")).toHaveValue(relationshipHex);
  await alice.locator("#open-envelope").fill(envelope);
  await expect(alice.locator("#seal-button")).toBeDisabled();
  await expect(alice.locator("#open-button")).toBeDisabled();
  await confirmFullComparison(alice);
  await expect(alice.locator("#seal-button")).toBeEnabled();
  await expect(alice.locator("#open-button")).toBeEnabled();
  await alice.locator("#open-button").click();
  await expect(alice.locator("#opened-plaintext")).toHaveText(plaintext);
});
