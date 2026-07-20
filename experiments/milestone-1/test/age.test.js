import assert from "node:assert/strict";
import { test } from "node:test";

import { utf8 } from "../src/bytes.js";
import {
  AGE_SENDER_NOTICE,
  armorAgeEnvelope,
  exportAgeContact,
  generateAgeIdentity,
  importAgeContact,
  openAgeBytes,
  openAgeText,
  sealAgeBytes,
  sealAgeText,
} from "../src/age.js";

test("disposable age identity exports and imports only a native public contact", async () => {
  const identity = await generateAgeIdentity();
  const exported = exportAgeContact(identity);

  assert.equal(importAgeContact(exported), identity.recipient);
  assert.match(exported, /^age1/);
  assert.doesNotMatch(exported, /AGE-SECRET-KEY/);
  assert.throws(() => importAgeContact(""));
  assert.throws(() => importAgeContact("not-an-age-recipient"));
});

test("Typage round trips ASCII, multilingual UTF-8, and empty text", async () => {
  const bob = await generateAgeIdentity();

  for (const plaintext of [
    "synthetic ASCII payload",
    "synthetic line one\nsynthetic line two",
    "합성 메시지 · مرحبا · こんにちは · 🧪",
    "",
  ]) {
    const envelope = await sealAgeText(plaintext, bob.recipient);
    assert.equal(await openAgeText(envelope, bob), plaintext);
  }
});

test("Typage rejects invalid and oversized plaintext", async () => {
  const bob = await generateAgeIdentity();

  await assert.rejects(() => sealAgeBytes("not bytes", bob.recipient));
  await assert.rejects(() =>
    sealAgeBytes(new Uint8Array(64 * 1024 + 1), bob.recipient),
  );
});

test("Typage detects one-byte mutations at the start, middle, and end", async () => {
  const bob = await generateAgeIdentity();
  const envelope = await sealAgeBytes(
    utf8("synthetic tamper target"),
    bob.recipient,
  );

  for (const index of [
    0,
    Math.floor(envelope.length / 2),
    envelope.length - 1,
  ]) {
    const mutated = envelope.slice();
    mutated[index] ^= 1;
    await assert.rejects(() => openAgeBytes(mutated, bob));
  }
});

test("Typage rejects ciphertext truncated at multiple offsets", async () => {
  const bob = await generateAgeIdentity();
  const envelope = await sealAgeBytes(
    utf8("synthetic truncation target"),
    bob.recipient,
  );

  for (const length of [
    0,
    Math.floor(envelope.length / 2),
    envelope.length - 1,
  ]) {
    await assert.rejects(() => openAgeBytes(envelope.subarray(0, length), bob));
  }
});

test("Typage rejects malformed native armor", async () => {
  const bob = await generateAgeIdentity();

  await assert.rejects(() => openAgeText("not age armor", bob));
});

test("Typage rejects the wrong recipient", async () => {
  const bob = await generateAgeIdentity();
  const mallory = await generateAgeIdentity();
  const envelope = await sealAgeText(
    "synthetic wrong-recipient target",
    bob.recipient,
  );

  await assert.rejects(() => openAgeText(envelope, mallory));
});

test("an outsider with only Bob's public recipient creates an envelope Bob opens", async () => {
  const bob = await generateAgeIdentity();
  const publicContactCopiedByOutsider = exportAgeContact(bob);
  const outsiderEnvelope = await sealAgeText(
    "synthetic outsider-created payload",
    publicContactCopiedByOutsider,
  );

  assert.equal(
    await openAgeText(outsiderEnvelope, bob),
    "synthetic outsider-created payload",
  );
  assert.equal(
    AGE_SENDER_NOTICE,
    "Encrypted for this recipient. The sender is not cryptographically verified by this envelope.",
  );
});

test("a captured age envelope opens after later recipient-key disclosure", async () => {
  const bob = await generateAgeIdentity();
  const captured = await sealAgeText(
    "synthetic captured age envelope",
    bob.recipient,
  );
  const laterDisclosedIdentity = {
    secret: bob.secret,
    recipient: bob.recipient,
  };

  assert.equal(
    await openAgeText(captured, laterDisclosedIdentity),
    "synthetic captured age envelope",
  );
});

test("age copied output remains unwrapped native armor", async () => {
  const bob = await generateAgeIdentity();
  const binary = await sealAgeBytes(
    utf8("synthetic native armor"),
    bob.recipient,
  );
  const armored = armorAgeEnvelope(binary);

  assert.match(armored, /^-----BEGIN AGE ENCRYPTED FILE-----\n/);
  assert.match(armored, /\n-----END AGE ENCRYPTED FILE-----\n$/);
  assert.doesNotMatch(armored, /CBLAB|CipherBook/);
});
