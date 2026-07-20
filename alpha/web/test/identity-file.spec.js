import { expect, test } from "@playwright/test";

import {
  IDENTITY_FILE_LAYOUT,
  IDENTITY_FILE_MAGIC_TEXT,
  IDENTITY_FILE_MAX_BYTES,
  IDENTITY_FILE_NAME,
  IDENTITY_FILE_MIME,
} from "../src/identity-file.js";
import {
  confirmFullComparison,
  connectPair,
  exportIdentityFile,
  generateIdentity,
  importIdentityFile,
  openEnvelope,
  runtimeBrowserPassphrase,
  sealText,
} from "./helpers.js";

function changed(bytes, offset) {
  const copy = Buffer.from(bytes);
  copy[offset] ^= 1;
  return copy;
}

async function attemptImport(page, bytes, passphrase) {
  await page.locator("#identity-file-input").setInputFiles({
    name: IDENTITY_FILE_NAME,
    mimeType: "text/plain",
    buffer: Buffer.from(bytes),
  });
  await page.locator("#identity-import-passphrase").fill(passphrase);
  await page.locator("#restore-identity-file").click();
  await expect(page.locator("#identity-import-passphrase")).toHaveValue("");
  await expect(page.locator("#identity-file-input")).toHaveValue("");
}

test("identity controls expose the experimental and offline-guessing boundaries", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByTestId("alpha-warning")).toContainText(
    "CipherBook Alpha 1",
  );
  await expect(page.getByTestId("alpha-warning")).toContainText(
    "Do not use real secrets",
  );
  await expect(page.locator("body")).toContainText(
    "A weak passphrase may be guessed offline",
  );
  await expect(page.locator("body")).toContainText(
    "There is no password reset",
  );
  await expect(page.locator("body")).toContainText(
    "does not automatically save",
  );
  for (const selector of [
    "#identity-import-passphrase",
    "#identity-export-passphrase",
    "#identity-export-confirmation",
  ]) {
    await expect(page.locator(selector)).toHaveAttribute("type", "password");
    await expect(page.locator(selector)).toHaveAttribute("autocomplete", "off");
    await expect(page.locator(selector)).toHaveAttribute(
      "autocapitalize",
      "none",
    );
    await expect(page.locator(selector)).not.toHaveAttribute(
      "autocomplete",
      /^(?:new-password|current-password)$/u,
    );
  }
  await expect(page.locator("body")).toContainText(
    "password managers, operating systems, and crash data may still retain or offer to fill it",
  );
  await expect(
    page.getByText(/remember passphrase/iu, { exact: false }),
  ).toHaveCount(0);
  await expect(page.locator("body")).not.toContainText(
    /Sign in|Log in|Username|Backup complete|Secure vault|Zero knowledge|Unbreakable/iu,
  );
  await expect(
    page.getByRole("button", { name: /reset|recover|sync|backup/iu }),
  ).toHaveCount(0);
});

test("explicit download creates the fixed encrypted file without network, clipboard, or share use", async ({
  context,
}) => {
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        async writeText() {
          globalThis.__alphaIdentityClipboardWrites =
            (globalThis.__alphaIdentityClipboardWrites ?? 0) + 1;
        },
      },
    });
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: async () => {
        globalThis.__alphaIdentityShareCalls =
          (globalThis.__alphaIdentityShareCalls ?? 0) + 1;
      },
    });
  });
  const page = await context.newPage();
  const requests = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.goto("/");
  await generateIdentity(page);
  const initialRequests = [...requests];
  let downloadEvents = 0;
  page.on("download", () => {
    downloadEvents += 1;
  });

  const passphrase = runtimeBrowserPassphrase();
  await page.locator("#identity-export-passphrase").fill(passphrase);
  await page.locator("#identity-export-confirmation").fill(passphrase);
  await page.locator("#identity-export-acknowledgment").check();
  await expect(page.locator("#download-identity-file")).toBeEnabled();
  expect(downloadEvents).toBe(0);

  const file = await exportIdentityFile(page, passphrase);
  expect(file.length).toBe(IDENTITY_FILE_LAYOUT.totalBytes);
  expect(
    file.subarray(0, IDENTITY_FILE_LAYOUT.magicBytes).toString("ascii"),
  ).toBe(IDENTITY_FILE_MAGIC_TEXT);
  expect(downloadEvents).toBe(1);
  expect(requests).toEqual(initialRequests);
  expect(
    await page.evaluate(() => globalThis.__alphaIdentityClipboardWrites ?? 0),
  ).toBe(0);
  expect(
    await page.evaluate(() => globalThis.__alphaIdentityShareCalls ?? 0),
  ).toBe(0);
});

test("wrong passphrase and modified file preserve the entire active workflow", async ({
  context,
}) => {
  const alice = await context.newPage();
  const bob = await context.newPage();
  await connectPair(alice, bob);
  await confirmFullComparison(alice);
  await confirmFullComparison(bob);
  const generated = await sealText(alice, "synthetic unsent state");
  const received = await sealText(bob, "synthetic opened state");
  await openEnvelope(alice, received);
  await expect(alice.locator("#opened-plaintext")).toHaveText(
    "synthetic opened state",
  );
  const passphrase = runtimeBrowserPassphrase();
  const identityFile = await exportIdentityFile(alice, passphrase);

  const snapshot = async () => ({
    ownContact: await alice.locator("#own-contact").inputValue(),
    activeContact: await alice.locator("#active-contact").textContent(),
    relationshipHex: await alice.locator("#relationship-hex").inputValue(),
    comparisonConfirmed: await alice
      .locator("#comparison-confirmed")
      .isChecked(),
    sealPlaintext: await alice.locator("#seal-plaintext").inputValue(),
    generatedEnvelope: await alice.locator("#sealed-envelope").inputValue(),
    openEnvelope: await alice.locator("#open-envelope").inputValue(),
    openedPlaintext: await alice.locator("#opened-plaintext").textContent(),
  });
  const before = await snapshot();
  expect(before.generatedEnvelope).toBe(generated);

  const wrongPassphrase = runtimeBrowserPassphrase();
  await attemptImport(alice, identityFile, wrongPassphrase);
  await expect(alice.locator("#identity-import-error")).toHaveText(
    "The identity file could not be opened. The passphrase may be incorrect, or the file may be damaged or modified.",
  );
  expect(await snapshot()).toEqual(before);
  await expect(alice.locator("body")).not.toContainText(wrongPassphrase);

  await attemptImport(
    alice,
    changed(identityFile, IDENTITY_FILE_LAYOUT.ciphertextOffset),
    passphrase,
  );
  await expect(alice.locator("#identity-import-error")).toHaveText(
    "The identity file could not be opened. The passphrase may be incorrect, or the file may be damaged or modified.",
  );
  expect(await snapshot()).toEqual(before);
});

test("unsupported and bounded malformed files fail and clear import controls", async ({
  page,
}) => {
  await page.goto("/");
  const originalContact = await generateIdentity(page);
  const passphrase = runtimeBrowserPassphrase();
  const file = await exportIdentityFile(page, passphrase);

  await attemptImport(
    page,
    changed(file, IDENTITY_FILE_LAYOUT.profileOffset),
    passphrase,
  );
  await expect(page.locator("#identity-import-error")).toHaveText(
    "This identity file uses an unsupported KDF profile.",
  );
  await expect(page.locator("#own-contact")).toHaveValue(originalContact);

  const oversized = Buffer.alloc(IDENTITY_FILE_MAX_BYTES + 1);
  await attemptImport(page, oversized, passphrase);
  await expect(page.locator("#identity-import-error")).toHaveText(
    "The selected identity file is oversized and was not read.",
  );
  await expect(page.locator("#own-contact")).toHaveValue(originalContact);
});

test("restoring the same identity still clears relationship and message state", async ({
  context,
}) => {
  const alice = await context.newPage();
  const bob = await context.newPage();
  const { aliceContact } = await connectPair(alice, bob);
  await confirmFullComparison(alice);
  await confirmFullComparison(bob);
  await sealText(alice, "synthetic generated before restore");
  const received = await sealText(bob, "synthetic opened before restore");
  await openEnvelope(alice, received);
  const passphrase = runtimeBrowserPassphrase();
  const file = await exportIdentityFile(alice, passphrase);

  await importIdentityFile(alice, file, passphrase);

  await expect(alice.locator("#own-contact")).toHaveValue(aliceContact);
  await expect(alice.locator("#active-contact")).toHaveText(
    "No counterparty contact imported.",
  );
  await expect(alice.locator("#relationship-hex")).toHaveValue("");
  await expect(alice.locator("#relationship-emoji .emoji-item")).toHaveCount(0);
  await expect(alice.locator("#comparison-confirmed")).not.toBeChecked();
  await expect(alice.locator("#seal-plaintext")).toHaveValue("");
  await expect(alice.locator("#sealed-envelope")).toHaveValue("");
  await expect(alice.locator("#open-envelope")).toHaveValue("");
  await expect(alice.locator("#opened-plaintext")).toHaveText("");
});

test("passphrase errors are bounded and clear fields while Clear removes file controls", async ({
  page,
}) => {
  await page.goto("/");
  await generateIdentity(page);
  const shortPassphrase = runtimeBrowserPassphrase().slice(0, 11);
  await page.locator("#identity-export-passphrase").fill(shortPassphrase);
  await page.locator("#identity-export-confirmation").fill(shortPassphrase);
  await page.locator("#identity-export-acknowledgment").check();
  await expect(page.locator("#download-identity-file")).toBeDisabled();

  const overlong = String.fromCodePoint(0x61).repeat(1025);
  await page.locator("#identity-export-passphrase").fill(overlong);
  await page.locator("#identity-export-confirmation").fill(overlong);
  await expect(page.locator("#download-identity-file")).toBeEnabled();
  await page.locator("#download-identity-file").click();
  await expect(page.locator("#identity-export-error")).toHaveText(
    "The passphrase exceeds the 1024-byte UTF-8 limit.",
  );
  await expect(page.locator("#identity-export-passphrase")).toHaveValue("");
  await expect(page.locator("#identity-export-confirmation")).toHaveValue("");

  const selected = Buffer.alloc(IDENTITY_FILE_LAYOUT.totalBytes);
  await page.locator("#identity-file-input").setInputFiles({
    name: IDENTITY_FILE_NAME,
    mimeType: "application/octet-stream",
    buffer: selected,
  });
  await page
    .locator("#identity-import-passphrase")
    .fill(runtimeBrowserPassphrase());
  await page.locator("#clear-all").click();
  await expect(page.locator("#identity-file-input")).toHaveValue("");
  await expect(page.locator("#identity-import-passphrase")).toHaveValue("");
  await expect(page.locator("#identity-export-passphrase")).toHaveValue("");
  await expect(page.locator("#identity-export-confirmation")).toHaveValue("");
  await expect(page.locator("#own-contact")).toHaveValue("");
  await expect(page.locator("#global-status")).toContainText(
    "cannot delete exported files or guarantee memory erasure",
  );
});

test("pagehide and persisted pageshow render a populated workflow as empty", async ({
  context,
}) => {
  const alice = await context.newPage();
  const bob = await context.newPage();
  await connectPair(alice, bob);
  await confirmFullComparison(alice);
  await confirmFullComparison(bob);
  await sealText(alice, "synthetic lifecycle seal draft");
  const received = await sealText(bob, "synthetic lifecycle opened text");
  await openEnvelope(alice, received);
  await expect(alice.locator("#opened-plaintext")).toHaveText(
    "synthetic lifecycle opened text",
  );

  const filePassphrase = runtimeBrowserPassphrase("-file");
  const identityFile = await exportIdentityFile(alice, filePassphrase);
  const pendingPassphrase = runtimeBrowserPassphrase("-pending");
  await alice.locator("#identity-file-input").setInputFiles({
    name: IDENTITY_FILE_NAME,
    mimeType: IDENTITY_FILE_MIME,
    buffer: Buffer.from(identityFile),
  });
  await alice
    .locator("#identity-import-passphrase")
    .fill(runtimeBrowserPassphrase("-import"));
  await alice.locator("#identity-export-passphrase").fill(pendingPassphrase);
  await alice.locator("#identity-export-confirmation").fill(pendingPassphrase);
  await alice.locator("#identity-export-acknowledgment").check();

  await expect(alice.locator("#own-contact")).not.toHaveValue("");
  await expect(alice.locator("#active-contact")).not.toHaveText(
    "No counterparty contact imported.",
  );
  await expect(alice.locator("#relationship-hex")).not.toHaveValue("");
  await expect(alice.locator("#relationship-emoji .emoji-item")).toHaveCount(
    16,
  );
  await expect(alice.locator("#comparison-confirmed")).toBeChecked();
  await expect(alice.locator("#sealed-envelope")).not.toHaveValue("");
  await expect(alice.locator("#open-envelope")).not.toHaveValue("");
  await expect(alice.locator("#identity-file-input")).not.toHaveValue("");

  const expectEmptyLifecycleState = async () => {
    for (const selector of [
      "#own-contact",
      "#contact-input",
      "#relationship-hex",
      "#seal-plaintext",
      "#sealed-envelope",
      "#open-envelope",
      "#identity-import-passphrase",
      "#identity-export-passphrase",
      "#identity-export-confirmation",
      "#identity-file-input",
    ]) {
      await expect(alice.locator(selector)).toHaveValue("");
    }
    await expect(alice.locator("#active-contact")).toHaveText(
      "No counterparty contact imported.",
    );
    await expect(alice.locator("#relationship-emoji .emoji-item")).toHaveCount(
      0,
    );
    await expect(alice.locator("#comparison-confirmed")).not.toBeChecked();
    await expect(alice.locator("#opened-plaintext")).toHaveText("");
    await expect(alice.locator("#copy-own-contact")).toBeDisabled();
    await expect(alice.locator("#seal-button")).toBeDisabled();
    await expect(alice.locator("#open-button")).toBeDisabled();
    await expect(alice.locator("#restore-identity-file")).toBeDisabled();
    await expect(alice.locator("#identity-export-passphrase")).toBeDisabled();
    await expect(alice.locator("#identity-export-confirmation")).toBeDisabled();
    await expect(
      alice.locator("#identity-export-acknowledgment"),
    ).toBeDisabled();
    await expect(alice.locator("#download-identity-file")).toBeDisabled();
    await expect(alice.locator("#global-status")).toHaveText(
      "No temporary identity exists.",
    );
  };

  await alice.evaluate(() => {
    globalThis.dispatchEvent(
      new PageTransitionEvent("pagehide", { persisted: true }),
    );
  });
  await expectEmptyLifecycleState();

  await alice.evaluate(() => {
    globalThis.dispatchEvent(
      new PageTransitionEvent("pageshow", { persisted: true }),
    );
  });
  await expectEmptyLifecycleState();
});
