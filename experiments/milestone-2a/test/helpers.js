import { expect } from "@playwright/test";

export async function openMode(page, mode) {
  await page.goto("/");
  if (mode !== "sodium") {
    await page.locator("#mode-select").selectOption(mode);
  }
}

export async function generateIdentity(page) {
  await page.locator("#generate-identity").click();
  await expect(page.locator("#own-contact")).not.toHaveValue("");
  return page.locator("#own-contact").inputValue();
}

export async function importContact(page, contact) {
  await page.locator("#contact-input").fill(contact);
  await page.locator("#import-contact").click();
  await expect(page.locator("#contact-error")).toHaveText("");
  await expect(page.locator("#relationship-diagnostic")).not.toHaveValue("");
}

export async function connectPair(alice, bob) {
  const aliceContact = await generateIdentity(alice);
  const bobContact = await generateIdentity(bob);
  await importContact(alice, bobContact);
  await importContact(bob, aliceContact);
  return { aliceContact, bobContact };
}

export async function confirmComparison(page) {
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

export function mutateEnvelope(mode, envelope) {
  if (mode === "sodium") {
    const value = JSON.parse(envelope);
    const bytes = Buffer.from(value.ciphertext, "base64url");
    bytes[Math.floor(bytes.length / 2)] ^= 1;
    value.ciphertext = bytes.toString("base64url");
    return JSON.stringify(value);
  }

  const lines = envelope.split("\n");
  const bodyIndex = lines.findIndex(
    (line) => line.length > 10 && !line.startsWith("-----"),
  );
  if (bodyIndex < 0) {
    throw new Error("native age armor has no mutable body line");
  }
  const line = lines[bodyIndex];
  const index = Math.floor(line.length / 2);
  lines[bodyIndex] =
    `${line.slice(0, index)}${line[index] === "A" ? "B" : "A"}${line.slice(index + 1)}`;
  return lines.join("\n");
}
