import { expect, test } from "@playwright/test";

import {
  confirmFullComparison,
  connectPair,
  generateIdentity,
  importContact,
  mutateEnvelope,
  openEnvelope,
  sealText,
} from "./helpers.js";
import {
  outsiderRelabelProbe,
  recipientForgeProbe,
} from "./runtime-harness.js";

test("browser workflow rejects wrong recipient, wrong sender, tampering, and truncation", async ({
  context,
}) => {
  const alice = await context.newPage();
  const bob = await context.newPage();
  const mallory = await context.newPage();
  const { aliceContact, bobContact } = await connectPair(alice, bob);
  await mallory.goto("/");
  const malloryContact = await generateIdentity(mallory);
  await importContact(mallory, aliceContact);
  await confirmFullComparison(alice);
  await confirmFullComparison(mallory);
  const envelope = await sealText(
    alice,
    "synthetic Alpha 0 hostile-input target",
  );

  await openEnvelope(mallory, envelope);
  await expect(mallory.locator("#opened-plaintext")).toHaveText("");
  await expect(mallory.locator("#open-error")).toContainText(
    "different recipient",
  );

  await bob.locator("#contact-input").fill(malloryContact);
  await bob.locator("#import-contact").click();
  await confirmFullComparison(bob);
  await openEnvelope(bob, envelope);
  await expect(bob.locator("#opened-plaintext")).toHaveText("");
  await expect(bob.locator("#open-error")).toContainText(
    "expected counterparty contact",
  );
  await importContact(bob, aliceContact);
  await confirmFullComparison(bob);

  await openEnvelope(bob, mutateEnvelope(envelope));
  await expect(bob.locator("#opened-plaintext")).toHaveText("");
  await expect(bob.locator("#open-error")).not.toHaveText("");

  await openEnvelope(bob, envelope.slice(0, Math.floor(envelope.length / 2)));
  await expect(bob.locator("#opened-plaintext")).toHaveText("");
  await expect(bob.locator("#open-error")).toContainText(
    "malformed or truncated",
  );

  expect(bobContact).toMatch(/^CBLAB-SODIUM-CONTACT-A:/u);
});

test("outsider relabeling is rejected while recipient forgeability remains explicit", async ({
  page,
}) => {
  await page.goto("/");
  const result = {
    outsiderRelabelRejected: outsiderRelabelProbe(),
    recipientForged: recipientForgeProbe(),
  };

  expect(result.outsiderRelabelRejected).toBe(true);
  expect(result.recipientForged).toBe(
    "synthetic Alpha 0 recipient-forged transcript",
  );
  await expect(page.locator("body")).toContainText(
    "recipient-local expected-counterparty key check",
  );
  await expect(page.locator("body")).toContainText("recipient-forgeable");
  await expect(page.locator("body")).toContainText("not a signature");
  await expect(page.locator("body")).toContainText(
    "Either party’s later static-private-key disclosure",
  );
  await expect(page.locator("body")).not.toContainText(
    /Verified author|Signed by|Proven sender|Authenticated to third parties/iu,
  );
});

test("oversized plaintext and envelope input fail without partial plaintext", async ({
  context,
}) => {
  const alice = await context.newPage();
  const bob = await context.newPage();
  await connectPair(alice, bob);
  await confirmFullComparison(alice);
  await confirmFullComparison(bob);

  await alice.locator("#seal-plaintext").fill("x".repeat(64 * 1024 + 1));
  await expect(alice.locator("#seal-error")).toContainText(
    "exceeds the 65536-byte experimental limit",
  );
  await expect(alice.locator("#seal-button")).toBeDisabled();

  await bob.locator("#open-envelope").fill("x".repeat(128 * 1024 + 1));
  await bob.locator("#open-button").click();
  await expect(bob.locator("#opened-plaintext")).toHaveText("");
  await expect(bob.locator("#open-error")).not.toHaveText("");
});
