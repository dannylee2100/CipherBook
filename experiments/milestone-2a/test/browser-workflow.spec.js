import { expect, test } from "@playwright/test";

import {
  confirmComparison,
  connectPair,
  generateIdentity,
  importContact,
  mutateEnvelope,
  openEnvelope,
  openMode,
  sealText,
} from "./helpers.js";

test("the warning, study controls, and construction limits are visible", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByTestId("experimental-warning")).toContainText(
    "Experimental laboratory only. Do not use real secrets.",
  );
  await expect(page.getByTestId("experimental-warning")).toContainText(
    "State is not intentionally saved.",
  );
  await expect(page.getByTestId("experimental-warning")).toContainText(
    "may still retain copies",
  );
  await expect(page.locator("#mode-select option")).toHaveCount(2);
  await expect(page.locator("#sender-meaning")).toContainText(
    "recipient-local expected-sender key check",
  );
  await expect(page.locator("#sender-meaning")).toContainText(
    "recipient can forge",
  );
  await expect(page.locator("#sender-meaning")).toContainText(
    "not proof to a third party",
  );

  await page.locator("#mode-select").selectOption("age");
  await expect(page.locator("#sender-meaning")).toHaveText(
    "Encrypted for this recipient. The sender is not cryptographically verified by this envelope.",
  );
  await expect(page.locator("#compromise-meaning")).toContainText(
    "Anyone with this recipient’s public age contact",
  );
  await expect(page.locator("body")).not.toContainText(/Signed by Alice/iu);
  await expect(page.locator("body")).not.toContainText(/Verified author/iu);
  await expect(page.locator("body")).not.toContainText(/Proven sender/iu);
  await expect(page.locator("body")).not.toContainText(/From Alice/iu);
  await expect(page.locator("body")).not.toContainText(
    /Authenticated sender/iu,
  );
});

test("changing construction clears every visible workflow field", async ({
  page,
}) => {
  await page.goto("/");
  await generateIdentity(page);
  await page.locator("#contact-input").fill("synthetic draft contact");
  await page.locator("#seal-plaintext").fill("synthetic draft text");
  await page.locator("#open-envelope").fill("synthetic draft envelope");

  await page.locator("#mode-select").selectOption("age");
  await expect(page.locator("#own-contact")).toHaveValue("");
  await expect(page.locator("#contact-input")).toHaveValue("");
  await expect(page.locator("#relationship-diagnostic")).toHaveValue("");
  await expect(page.locator("#comparison-confirmed")).not.toBeChecked();
  await expect(page.locator("#seal-plaintext")).toHaveValue("");
  await expect(page.locator("#sealed-envelope")).toHaveValue("");
  await expect(page.locator("#open-envelope")).toHaveValue("");
  await expect(page.locator("#opened-plaintext")).toHaveText("");
});

for (const mode of ["sodium", "age"]) {
  test(`${mode} completes contact, diagnostic, seal, and open workflow`, async ({
    context,
  }) => {
    const alice = await context.newPage();
    const bob = await context.newPage();
    await openMode(alice, mode);
    await openMode(bob, mode);
    await connectPair(alice, bob);

    const aliceDiagnostic = await alice
      .locator("#relationship-diagnostic")
      .inputValue();
    const bobDiagnostic = await bob
      .locator("#relationship-diagnostic")
      .inputValue();
    expect(aliceDiagnostic).toBe(bobDiagnostic);
    expect(aliceDiagnostic.replaceAll(" ", "")).toMatch(/^[0-9a-f]{64}$/u);
    await expect(alice.locator("#seal-button")).toBeDisabled();

    await confirmComparison(alice);
    await confirmComparison(bob);
    const plaintext = `synthetic ${mode} line one\n합성 line two · 🧪`;
    const envelope = await sealText(alice, plaintext);
    await openEnvelope(bob, envelope);
    await expect(bob.locator("#open-error")).toHaveText("");
    await expect(bob.locator("#opened-plaintext")).toHaveText(plaintext);
    if (mode === "age") {
      expect(envelope).toMatch(/^-----BEGIN AGE ENCRYPTED FILE-----\n/u);
      expect(envelope).not.toMatch(/CBLAB|CipherBook/u);
    }
  });

  test(`${mode} rejects malformed contact, own contact, wrong recipient, tamper, and truncation`, async ({
    context,
  }) => {
    const alice = await context.newPage();
    const bob = await context.newPage();
    const wrongRecipient = await context.newPage();
    await openMode(alice, mode);
    await openMode(bob, mode);
    await openMode(wrongRecipient, mode);

    const aliceContact = await generateIdentity(alice);
    const bobContact = await generateIdentity(bob);
    const wrongRecipientContact = await generateIdentity(wrongRecipient);

    await alice.locator("#contact-input").fill("not a contact");
    await alice.locator("#import-contact").click();
    await expect(alice.locator("#contact-error")).toContainText("malformed");

    await alice.locator("#contact-input").fill("x".repeat(4097));
    await alice.locator("#import-contact").click();
    await expect(alice.locator("#contact-error")).toContainText("oversized");

    await alice.locator("#contact-input").fill(aliceContact);
    await alice.locator("#import-contact").click();
    await expect(alice.locator("#contact-error")).toContainText(
      "cannot be imported",
    );

    await importContact(alice, bobContact);
    await importContact(bob, aliceContact);
    await importContact(wrongRecipient, aliceContact);
    await confirmComparison(alice);
    const envelope = await sealText(alice, `synthetic ${mode} hostile input`);

    await openEnvelope(wrongRecipient, envelope);
    await expect(wrongRecipient.locator("#opened-plaintext")).toHaveText("");
    await expect(wrongRecipient.locator("#open-error")).not.toHaveText("");

    if (mode === "sodium") {
      await importContact(bob, wrongRecipientContact);
      await openEnvelope(bob, envelope);
      await expect(bob.locator("#opened-plaintext")).toHaveText("");
      await expect(bob.locator("#open-error")).toContainText(
        "expected sender contact",
      );
      await importContact(bob, aliceContact);
    }

    await openEnvelope(bob, mutateEnvelope(mode, envelope));
    await expect(bob.locator("#opened-plaintext")).toHaveText("");
    await expect(bob.locator("#open-error")).not.toHaveText("");

    await openEnvelope(bob, envelope.slice(0, Math.floor(envelope.length / 2)));
    await expect(bob.locator("#opened-plaintext")).toHaveText("");
    await expect(bob.locator("#open-error")).not.toHaveText("");
  });
}

test("oversized plaintext remains unsealable", async ({ context }) => {
  const alice = await context.newPage();
  const bob = await context.newPage();
  await Promise.all([alice.goto("/"), bob.goto("/")]);
  await connectPair(alice, bob);
  await confirmComparison(alice);
  await alice.locator("#seal-plaintext").fill("x".repeat(64 * 1024 + 1));
  await expect(alice.locator("#seal-error")).toContainText(
    "exceeds the 65536-byte experimental limit",
  );
  await expect(alice.locator("#seal-button")).toBeDisabled();
});

test("replacing or editing a contact clears comparison confirmation", async ({
  context,
}) => {
  const alice = await context.newPage();
  const bob = await context.newPage();
  const carol = await context.newPage();
  await Promise.all([alice.goto("/"), bob.goto("/"), carol.goto("/")]);
  await generateIdentity(alice);
  const bobContact = await generateIdentity(bob);
  const carolContact = await generateIdentity(carol);
  await importContact(alice, bobContact);
  await confirmComparison(alice);

  await alice.locator("#contact-input").fill(carolContact);
  await expect(alice.locator("#comparison-confirmed")).not.toBeChecked();
  await expect(alice.locator("#seal-button")).toBeDisabled();
  await alice.locator("#import-contact").click();
  await expect(alice.locator("#comparison-confirmed")).not.toBeChecked();
});

test("clipboard actions are explicit and opened plaintext is rendered as text", async ({
  context,
}) => {
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        async writeText(text) {
          globalThis.__cipherbookCopiedText = text;
        },
      },
    });
  });
  const alice = await context.newPage();
  const bob = await context.newPage();
  await Promise.all([alice.goto("/"), bob.goto("/")]);
  await connectPair(alice, bob);
  await confirmComparison(alice);
  const plaintext = '<img src="x" onerror="globalThis.__xss = true"> synthetic';
  const envelope = await sealText(alice, plaintext);

  await alice.locator("#copy-envelope").click();
  expect(await alice.evaluate(() => globalThis.__cipherbookCopiedText)).toBe(
    envelope,
  );
  expect(envelope).not.toContain(plaintext);

  await openEnvelope(bob, envelope);
  await expect(bob.locator("#opened-plaintext")).toHaveText(plaintext);
  await expect(bob.locator("#opened-plaintext img")).toHaveCount(0);
  expect(await bob.evaluate(() => globalThis.__xss)).toBeUndefined();
  expect(
    await bob.evaluate(() => globalThis.__cipherbookCopiedText),
  ).toBeUndefined();

  await bob.locator("#copy-plaintext").click();
  expect(await bob.evaluate(() => globalThis.__cipherbookCopiedText)).toBe(
    plaintext,
  );
  await expect(bob.locator("body")).toContainText(
    "Your operating system and other applications may retain clipboard contents.",
  );
});

test("controlled construction probes preserve sender semantics", async ({
  page,
}) => {
  await page.goto("/");
  const results = await page.evaluate(async () => {
    const harness = await import("/src/runtime-test-harness.js");
    const age = await harness.ageOutsiderProbe();
    return {
      recipientForged: harness.sodiumRecipientForgeProbe(),
      outsiderRelabelRejected: harness.sodiumOutsiderRelabelProbe(),
      ageOutsiderOpened: age.opened,
      ageEnvelope: age.envelope,
    };
  });

  expect(results.recipientForged).toBe(
    "synthetic browser recipient-forged transcript",
  );
  expect(results.outsiderRelabelRejected).toBe(true);
  expect(results.ageOutsiderOpened).toBe(
    "synthetic outsider-created browser envelope",
  );
  expect(results.ageEnvelope).toMatch(/^-----BEGIN AGE ENCRYPTED FILE-----\n/u);
  expect(results.ageEnvelope).not.toMatch(/CBLAB|CipherBook/u);
});
