import { expect } from "@playwright/test";
import { randomBytes } from "node:crypto";

import { IDENTITY_FILE_NAME } from "../src/identity-file.js";

export function runtimeBrowserPassphrase(suffix = "") {
  return `browser-${randomBytes(18).toString("base64url")}${suffix}`;
}

async function downloadBytes(download) {
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export async function exportIdentityFile(page, passphrase) {
  await page.locator("#identity-export-passphrase").fill(passphrase);
  await page.locator("#identity-export-confirmation").fill(passphrase);
  await page.locator("#identity-export-acknowledgment").check();
  await expect(page.locator("#download-identity-file")).toBeEnabled();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.locator("#download-identity-file").click(),
  ]);
  expect(download.suggestedFilename()).toBe(IDENTITY_FILE_NAME);
  await expect(page.locator("#identity-export-error")).toHaveText("");
  await expect(page.locator("#identity-export-passphrase")).toHaveValue("");
  await expect(page.locator("#identity-export-confirmation")).toHaveValue("");
  await expect(
    page.locator("#identity-export-acknowledgment"),
  ).not.toBeChecked();
  return downloadBytes(download);
}

export async function importIdentityFile(page, bytes, passphrase) {
  await page.locator("#identity-file-input").setInputFiles({
    name: IDENTITY_FILE_NAME,
    mimeType: "application/octet-stream",
    buffer: Buffer.from(bytes),
  });
  await page.locator("#identity-import-passphrase").fill(passphrase);
  await expect(page.locator("#restore-identity-file")).toBeEnabled();
  await page.locator("#restore-identity-file").click();
  await expect(page.locator("#identity-import-error")).toHaveText("");
  await expect(page.locator("#identity-import-passphrase")).toHaveValue("");
  await expect(page.locator("#identity-file-input")).toHaveValue("");
}

export async function generateIdentity(page) {
  await page.locator("#generate-identity").click();
  await expect(page.locator("#identity-error")).toHaveText("");
  await expect(page.locator("#own-contact")).not.toHaveValue("");
  return page.locator("#own-contact").inputValue();
}

export async function importContact(page, contact) {
  await page.locator("#contact-input").fill(contact);
  await page.locator("#import-contact").click();
  await expect(page.locator("#contact-error")).toHaveText("");
  await expect(page.locator("#relationship-hex")).not.toHaveValue("");
}

export async function connectPair(alice, bob) {
  await Promise.all([alice.goto("/"), bob.goto("/")]);
  const aliceContact = await generateIdentity(alice);
  const bobContact = await generateIdentity(bob);
  await importContact(alice, bobContact);
  await importContact(bob, aliceContact);
  return { aliceContact, bobContact };
}

export async function confirmFullComparison(page) {
  await page.locator("#comparison-confirmed").check();
  await expect(page.locator("#seal-button")).toBeEnabled();
}

export async function sealText(page, plaintext) {
  await page.locator("#seal-plaintext").fill(plaintext);
  await page.locator("#seal-button").click();
  await expect(page.locator("#seal-error")).toHaveText("");
  await expect(page.locator("#sealed-envelope")).not.toHaveValue("");
  return page.locator("#sealed-envelope").inputValue();
}

export async function openEnvelope(page, envelope) {
  await page.locator("#open-envelope").fill(envelope);
  await page.locator("#open-button").click();
}

export function mutateEnvelope(envelope) {
  const value = JSON.parse(envelope);
  const bytes = Buffer.from(value.ciphertext, "base64url");
  bytes[Math.floor(bytes.length / 2)] ^= 1;
  value.ciphertext = bytes.toString("base64url");
  return JSON.stringify(value);
}
