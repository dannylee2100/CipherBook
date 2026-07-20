import assert from "node:assert/strict";
import { test } from "node:test";

import { base64urlEncode, decodeUtf8, utf8 } from "../src/bytes.js";
import {
  exportSodiumContact,
  forgeSodiumAsExpectedSender,
  generateSodiumIdentity,
  importSodiumContact,
  openSodiumAfterSenderKeyDisclosure,
  openSodiumBytes,
  openSodiumText,
  parseSodiumEnvelope,
  sealSodiumBytes,
  sealSodiumText,
  sodiumExperiment,
} from "../src/sodium.js";

function mutateCiphertext(serialized) {
  const value = JSON.parse(serialized);
  const bytes = Buffer.from(value.ciphertext, "base64url");
  bytes[Math.floor(bytes.length / 2)] ^= 1;
  value.ciphertext = bytes.toString("base64url");
  return JSON.stringify(value);
}

function truncateCiphertext(serialized) {
  const value = JSON.parse(serialized);
  const bytes = Buffer.from(value.ciphertext, "base64url");
  value.ciphertext = bytes.subarray(0, bytes.length - 1).toString("base64url");
  return JSON.stringify(value);
}

function truncateCiphertextToHalf(serialized) {
  const value = JSON.parse(serialized);
  const bytes = Buffer.from(value.ciphertext, "base64url");
  value.ciphertext = bytes
    .subarray(0, Math.floor(bytes.length / 2))
    .toString("base64url");
  return JSON.stringify(value);
}

test("disposable sodium identity exports and imports only its public contact", () => {
  const identity = generateSodiumIdentity();
  const exported = exportSodiumContact(identity.publicKey);
  const imported = importSodiumContact(exported);

  assert.deepEqual(imported, identity.publicKey);
  assert.doesNotMatch(
    exported,
    new RegExp(base64urlEncode(identity.privateKey)),
  );
  assert.throws(() => importSodiumContact(""));
  assert.throws(() => importSodiumContact("not-a-lab-contact"));
});

test("sodium round trips ASCII, multilingual UTF-8, and empty text", () => {
  const alice = generateSodiumIdentity();
  const bob = generateSodiumIdentity();

  for (const plaintext of [
    "synthetic ASCII payload",
    "synthetic line one\nsynthetic line two",
    "합성 메시지 · مرحبا · こんにちは · 🧪",
    "",
  ]) {
    const envelope = sealSodiumText(plaintext, alice, bob.publicKey);
    assert.equal(openSodiumText(envelope, bob, alice.publicKey), plaintext);
  }
});

test("sodium rejects invalid and oversized plaintext", () => {
  const alice = generateSodiumIdentity();
  const bob = generateSodiumIdentity();

  assert.throws(() => sealSodiumBytes("not bytes", alice, bob.publicKey));
  assert.throws(() =>
    sealSodiumBytes(new Uint8Array(64 * 1024 + 1), alice, bob.publicKey),
  );
});

test("sodium detects a one-byte mutation and truncation", () => {
  const alice = generateSodiumIdentity();
  const bob = generateSodiumIdentity();
  const envelope = sealSodiumText(
    "synthetic tamper target",
    alice,
    bob.publicKey,
  );

  assert.throws(() =>
    openSodiumText(mutateCiphertext(envelope), bob, alice.publicKey),
  );
  assert.throws(() =>
    openSodiumText(truncateCiphertext(envelope), bob, alice.publicKey),
  );
  assert.throws(() =>
    openSodiumText(truncateCiphertextToHalf(envelope), bob, alice.publicKey),
  );
  assert.throws(() => openSodiumText("not JSON", bob, alice.publicKey));

  const wrongLabel = JSON.parse(envelope);
  wrongLabel.lab = "another-experiment";
  assert.throws(() =>
    openSodiumText(JSON.stringify(wrongLabel), bob, alice.publicKey),
  );
});

test("sodium rejects a wrong recipient, wrong sender, and outsider forgery", () => {
  const alice = generateSodiumIdentity();
  const bob = generateSodiumIdentity();
  const mallory = generateSodiumIdentity();
  const envelope = sealSodiumText(
    "synthetic expected-sender test",
    alice,
    bob.publicKey,
  );

  assert.throws(() => openSodiumText(envelope, mallory, alice.publicKey));
  assert.throws(() => openSodiumText(envelope, bob, mallory.publicKey));

  const outsiderEnvelope = sealSodiumText(
    "synthetic outsider payload",
    mallory,
    bob.publicKey,
  );
  const relabeled = JSON.parse(outsiderEnvelope);
  relabeled.sender = exportSodiumContact(alice.publicKey);
  assert.throws(() =>
    openSodiumText(JSON.stringify(relabeled), bob, alice.publicKey),
  );
});

test("recipient can forge a transcript accepted under the expected sender contact", () => {
  const alice = generateSodiumIdentity();
  const bob = generateSodiumIdentity();
  const forged = forgeSodiumAsExpectedSender(
    utf8("synthetic recipient-forged transcript"),
    bob,
    alice.publicKey,
  );

  assert.equal(
    openSodiumText(forged, bob, alice.publicKey),
    "synthetic recipient-forged transcript",
  );
});

test("captured transcript opens after later sender private-key disclosure", () => {
  const alice = generateSodiumIdentity();
  const bob = generateSodiumIdentity();
  const envelope = sealSodiumText(
    "synthetic captured transcript",
    alice,
    bob.publicKey,
  );

  assert.equal(
    decodeUtf8(
      openSodiumAfterSenderKeyDisclosure(envelope, alice, bob.publicKey),
    ),
    "synthetic captured transcript",
  );
});

test("captured transcript opens after later recipient private-key disclosure", () => {
  const alice = generateSodiumIdentity();
  const bob = generateSodiumIdentity();
  const envelope = sealSodiumText(
    "synthetic captured transcript",
    alice,
    bob.publicKey,
  );

  assert.equal(
    decodeUtf8(openSodiumBytes(envelope, bob, alice.publicKey)),
    "synthetic captured transcript",
  );
});

test("raw sodium overhead is separate from copied wrapper overhead", () => {
  const alice = generateSodiumIdentity();
  const bob = generateSodiumIdentity();
  const plaintext = utf8("x".repeat(256));
  const result = sealSodiumBytes(plaintext, alice, bob.publicKey);

  assert.equal(
    result.ciphertext.length - plaintext.length,
    sodiumExperiment.rawOverheadBytes,
  );
  assert.ok(Buffer.byteLength(result.serialized) > result.ciphertext.length);
  assert.deepEqual(
    parseSodiumEnvelope(result.serialized).ciphertext,
    result.ciphertext,
  );
});
