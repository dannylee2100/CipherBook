import { expect, test } from "@playwright/test";

import {
  confirmFullComparison,
  connectPair,
  generateIdentity,
  importContact,
  openEnvelope,
  sealText,
} from "./helpers.js";

test("first screen states the preview and memory boundaries without messenger UI", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByTestId("alpha-warning")).toContainText(
    "experimental, unreviewed preview",
  );
  await expect(page.getByTestId("alpha-warning")).toContainText(
    "not been independently reviewed or tested with representative users",
  );
  await expect(page.getByTestId("alpha-warning")).toContainText(
    "Do not use real secrets",
  );
  await expect(page.locator("body")).toContainText(
    "browsers, operating systems, extensions, memory, crash data, downloads, backups, and clipboards may retain copies",
  );
  await expect(page.locator("body")).toContainText(
    "envelope utility, not a messenger",
  );
  await expect(page.locator("body")).not.toContainText(
    /conversation list|read receipt|online presence/iu,
  );
  await expect(page.locator("#mode-select")).toHaveCount(0);
});

test("two parties derive the same full hex and 16-emoji views", async ({
  context,
}) => {
  const alice = await context.newPage();
  const bob = await context.newPage();
  await connectPair(alice, bob);

  const aliceHex = await alice.locator("#relationship-hex").inputValue();
  const bobHex = await bob.locator("#relationship-hex").inputValue();
  expect(aliceHex).toBe(bobHex);
  expect(aliceHex.replaceAll(" ", "")).toMatch(/^[0-9a-f]{64}$/u);

  const aliceItems = alice.locator("#relationship-emoji .emoji-item");
  const bobItems = bob.locator("#relationship-emoji .emoji-item");
  await expect(aliceItems).toHaveCount(16);
  await expect(bobItems).toHaveCount(16);
  expect(await aliceItems.allTextContents()).toEqual(
    await bobItems.allTextContents(),
  );
  await expect(alice.locator("body")).toContainText("First 96 bits only");
  await expect(alice.locator("body")).toContainText(
    "not sufficient when the full hexadecimal values differ",
  );
  await expect(alice.locator("#seal-button")).toBeDisabled();
  await expect(
    alice.locator("#comparison-confirmed").locator("xpath=.."),
  ).toContainText("full hexadecimal value");
});

test("contact import alone cannot authorize opening and direct invocation fails safely", async ({
  context,
}) => {
  const alice = await context.newPage();
  const bob = await context.newPage();
  await connectPair(alice, bob);

  await expect(alice.locator("#seal-button")).toBeDisabled();
  await expect(bob.locator("#open-button")).toBeDisabled();
  await expect(bob.locator("body")).toContainText(
    "Opening is disabled until you confirm that the full hexadecimal relationship value matches through a separate trusted interaction.",
  );

  await confirmFullComparison(alice);
  const envelope = await sealText(
    alice,
    "synthetic independently confirmed recipient workflow",
  );
  await bob.locator("#open-envelope").fill(envelope);
  await expect(bob.locator("#open-button")).toBeDisabled();

  await bob.locator("#open-button").dispatchEvent("click");
  await expect(bob.locator("#open-error")).toHaveText(
    "Confirm the full hexadecimal relationship comparison before opening this envelope.",
  );
  await expect(bob.locator("#opened-plaintext")).toHaveText("");

  await confirmFullComparison(bob);
  await expect(bob.locator("#open-button")).toBeEnabled();
  await bob.locator("#open-button").click();
  await expect(bob.locator("#open-error")).toHaveText("");
  await expect(bob.locator("#opened-plaintext")).toHaveText(
    "synthetic independently confirmed recipient workflow",
  );
});

test("contact import rejects malformed, oversized, and own contacts while replacements reset dependent state", async ({
  context,
}) => {
  const alice = await context.newPage();
  const bob = await context.newPage();
  const carol = await context.newPage();
  await Promise.all([alice.goto("/"), bob.goto("/"), carol.goto("/")]);
  const aliceContact = await generateIdentity(alice);
  const bobContact = await generateIdentity(bob);
  const carolContact = await generateIdentity(carol);

  await alice.locator("#contact-input").fill("not a contact");
  await alice.locator("#import-contact").click();
  await expect(alice.locator("#contact-error")).toContainText("malformed");

  await alice.locator("#contact-input").fill("x".repeat(4097));
  await alice.locator("#import-contact").click();
  await expect(alice.locator("#contact-error")).toContainText("oversized");

  await alice.locator("#contact-input").fill(aliceContact);
  await alice.locator("#import-contact").click();
  await expect(alice.locator("#contact-error")).toContainText(
    "cannot be its own counterparty",
  );

  await importContact(alice, bobContact);
  await confirmFullComparison(alice);
  await sealText(alice, "synthetic output cleared on contact change");
  await importContact(bob, aliceContact);
  await confirmFullComparison(bob);
  const reply = await sealText(bob, "synthetic opened text cleared on change");
  await openEnvelope(alice, reply);
  await expect(alice.locator("#opened-plaintext")).toHaveText(
    "synthetic opened text cleared on change",
  );

  await alice.locator("#comparison-confirmed").uncheck();
  await expect(alice.locator("#seal-button")).toBeDisabled();
  await expect(alice.locator("#open-button")).toBeDisabled();
  await expect(alice.locator("#sealed-envelope")).toHaveValue("");
  await expect(alice.locator("#open-envelope")).toHaveValue("");
  await expect(alice.locator("#opened-plaintext")).toHaveText("");
  await expect(alice.locator("#open-status")).toHaveText("");
  await expect(alice.locator("#seal-error")).toHaveText("");
  await expect(alice.locator("#open-error")).toHaveText("");
  await expect(alice.locator("#seal-plaintext")).toHaveValue(
    "synthetic output cleared on contact change",
  );

  await confirmFullComparison(alice);
  await sealText(alice, "synthetic output cleared on contact edit");
  await openEnvelope(alice, reply);
  await expect(alice.locator("#opened-plaintext")).toHaveText(
    "synthetic opened text cleared on change",
  );

  await alice.locator("#contact-input").fill(carolContact);
  await expect(alice.locator("#relationship-hex")).toHaveValue("");
  await expect(alice.locator("#relationship-emoji .emoji-item")).toHaveCount(0);
  await expect(alice.locator("#comparison-confirmed")).not.toBeChecked();
  await expect(alice.locator("#sealed-envelope")).toHaveValue("");
  await expect(alice.locator("#open-envelope")).toHaveValue("");
  await expect(alice.locator("#opened-plaintext")).toHaveText("");
  await expect(alice.locator("#open-status")).toHaveText("");
  await expect(alice.locator("#seal-button")).toBeDisabled();
  await expect(alice.locator("#open-button")).toBeDisabled();
  await expect(alice.locator("#import-contact")).toHaveText(
    "Replace counterparty contact",
  );
  await alice.locator("#import-contact").click();
  await expect(alice.locator("#active-contact")).toHaveText(carolContact);

  await confirmFullComparison(alice);
  await alice.locator("#seal-plaintext").fill("synthetic identity reset");
  await alice.locator("#open-envelope").fill("synthetic unstable input");
  await alice.locator("#generate-identity").click();
  await expect(alice.locator("#own-contact")).not.toHaveValue(aliceContact);
  await expect(alice.locator("#active-contact")).toHaveText(
    "No counterparty contact imported.",
  );
  await expect(alice.locator("#relationship-hex")).toHaveValue("");
  await expect(alice.locator("#seal-plaintext")).toHaveValue("");
  await expect(alice.locator("#open-envelope")).toHaveValue("");
});

test("confirmed pair seals and opens multilingual and empty text", async ({
  context,
}) => {
  const alice = await context.newPage();
  const bob = await context.newPage();
  await connectPair(alice, bob);
  await confirmFullComparison(alice);
  await confirmFullComparison(bob);

  await alice.locator("#fill-synthetic").click();
  await expect(alice.locator("#seal-plaintext")).toHaveValue(
    /Synthetic CipherBook preview note/u,
  );
  await expect(alice.locator("#seal-byte-count")).toHaveText(
    /^[1-9][0-9]* \/ 65536 UTF-8 bytes$/u,
  );

  for (const plaintext of ["합성 메시지 · مرحبا · こんにちは · 🧪", ""]) {
    const envelope = await sealText(alice, plaintext);
    await openEnvelope(bob, envelope);
    await expect(bob.locator("#open-error")).toHaveText("");
    await expect(bob.locator("#open-status")).toHaveText(
      "Opened after confirming the expected relationship's full hexadecimal comparison.",
    );
    await expect(bob.locator("#opened-plaintext")).toHaveText(plaintext);
  }
  await expect(bob.locator("body")).toContainText(
    "not third-party proof of authorship",
  );
});

test("copy and native share actions expose only the explicitly selected value", async ({
  context,
}) => {
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        async writeText(text) {
          globalThis.__alphaCopiedText = text;
        },
      },
    });
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: async (payload) => {
        globalThis.__alphaSharedPayload = payload;
      },
    });
  });
  const alice = await context.newPage();
  const bob = await context.newPage();
  const { aliceContact } = await connectPair(alice, bob);

  await alice.locator("#copy-own-contact").click();
  expect(await alice.evaluate(() => globalThis.__alphaCopiedText)).toBe(
    aliceContact,
  );

  await confirmFullComparison(alice);
  await confirmFullComparison(bob);
  const plaintext =
    '<img src="x" onerror="globalThis.__alphaXss=true"> synthetic';
  const envelope = await sealText(alice, plaintext);

  await alice.locator("#copy-envelope").click();
  expect(await alice.evaluate(() => globalThis.__alphaCopiedText)).toBe(
    envelope,
  );
  await expect(alice.locator("#share-envelope")).toBeVisible();
  await alice.locator("#share-envelope").click();
  expect(await alice.evaluate(() => globalThis.__alphaSharedPayload)).toEqual({
    text: envelope,
  });

  await alice.evaluate(() => {
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: async () => {
        throw new DOMException("synthetic cancellation", "AbortError");
      },
    });
  });
  await alice.locator("#share-envelope").click();
  await expect(alice.locator("#global-status")).toContainText(
    "sharing was canceled",
  );
  await expect(alice.locator("#copy-envelope")).toBeEnabled();

  await openEnvelope(bob, envelope);
  await expect(bob.locator("#opened-plaintext")).toHaveText(plaintext);
  await expect(bob.locator("#opened-plaintext img")).toHaveCount(0);
  expect(await bob.evaluate(() => globalThis.__alphaXss)).toBeUndefined();
  expect(
    await bob.evaluate(() => globalThis.__alphaCopiedText),
  ).toBeUndefined();
  await bob.locator("#copy-plaintext").click();
  expect(await bob.evaluate(() => globalThis.__alphaCopiedText)).toBe(
    plaintext,
  );
});

test("Clear and reload return the complete workflow to empty state", async ({
  context,
}) => {
  const alice = await context.newPage();
  const bob = await context.newPage();
  await connectPair(alice, bob);
  await confirmFullComparison(alice);
  const envelope = await sealText(alice, "synthetic reset target");
  await alice.locator("#open-envelope").fill(envelope);
  await alice.locator("#clear-all").click();

  for (const selector of [
    "#own-contact",
    "#contact-input",
    "#relationship-hex",
    "#seal-plaintext",
    "#sealed-envelope",
    "#open-envelope",
  ]) {
    await expect(alice.locator(selector)).toHaveValue("");
  }
  await expect(alice.locator("#relationship-emoji .emoji-item")).toHaveCount(0);
  await expect(alice.locator("#opened-plaintext")).toHaveText("");
  await expect(alice.locator("#comparison-confirmed")).not.toBeChecked();

  await bob.reload();
  await expect(bob.locator("#own-contact")).toHaveValue("");
  await expect(bob.locator("#active-contact")).toHaveText(
    "No counterparty contact imported.",
  );
  await expect(bob.locator("#global-status")).toHaveText(
    "No temporary identity exists.",
  );
});

test("controls and emoji labels expose keyboard and assistive-text affordances", async ({
  page,
  context,
}) => {
  const bob = await context.newPage();
  await Promise.all([page.goto("/"), bob.goto("/")]);
  await generateIdentity(page);
  const bobContact = await generateIdentity(bob);
  await importContact(page, bobContact);

  await expect(page.locator("#relationship-emoji .emoji-item")).toHaveCount(16);
  const labels = await page
    .locator("#relationship-emoji .emoji-item")
    .evaluateAll((items) =>
      items.map((item) => item.getAttribute("aria-label")),
    );
  expect(
    labels.every((label) => /^Position [0-9]+: .+; U\+/u.test(label)),
  ).toBe(true);

  await page.locator("#comparison-confirmed").focus();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Shift+Tab");
  await expect(page.locator("#comparison-confirmed")).toBeFocused();
  const outlineStyle = await page
    .locator("#comparison-confirmed")
    .evaluate((element) => getComputedStyle(element).outlineStyle);
  expect(outlineStyle).not.toBe("none");
  await page.keyboard.press("Space");
  await expect(page.locator("#comparison-confirmed")).toBeChecked();
});
