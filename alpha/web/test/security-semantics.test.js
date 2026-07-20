import assert from "node:assert/strict";
import { test } from "node:test";

import { utf8 } from "../../../experiments/milestone-1/src/bytes.js";
import {
  exportSodiumContact,
  forgeSodiumAsExpectedSender,
  openSodiumAfterSenderKeyDisclosure,
  openSodiumText,
  sealSodiumText,
} from "../../../experiments/milestone-1/src/sodium.js";
import { sodiumAlpha } from "../src/sodium-adapter.js";
import { clearTrustDependentOutput, createAlphaState } from "../src/state.js";

function mutateCiphertext(serialized) {
  const value = JSON.parse(serialized);
  const bytes = Buffer.from(value.ciphertext, "base64url");
  bytes[Math.floor(bytes.length / 2)] ^= 1;
  value.ciphertext = bytes.toString("base64url");
  return JSON.stringify(value);
}

test("Alpha 0 adapter preserves the existing unstable encodings", async () => {
  const alice = await sodiumAlpha.generateIdentity();
  const bob = await sodiumAlpha.generateIdentity();
  const bobContact = sodiumAlpha.importContact(sodiumAlpha.exportContact(bob));
  const envelope = await sodiumAlpha.seal("synthetic", alice, bobContact);
  const parsed = JSON.parse(envelope);

  assert.match(sodiumAlpha.exportContact(alice), /^CBLAB-SODIUM-CONTACT-A:/u);
  assert.equal(parsed.lab, "CBLAB-SODIUM-A");
  assert.equal(parsed.warning, "UNSTABLE EXPERIMENT; NOT FOR REAL SECRETS");
  assert.deepEqual(Object.keys(parsed).sort(), [
    "ciphertext",
    "lab",
    "nonce",
    "recipient",
    "sender",
    "warning",
  ]);
});

test("Alpha 0 round trips multilingual and empty text", async () => {
  const alice = await sodiumAlpha.generateIdentity();
  const bob = await sodiumAlpha.generateIdentity();
  const aliceContact = sodiumAlpha.importContact(
    sodiumAlpha.exportContact(alice),
  );
  const bobContact = sodiumAlpha.importContact(sodiumAlpha.exportContact(bob));

  for (const plaintext of ["합성 메시지 · مرحبا · こんにちは · 🧪", ""]) {
    const envelope = await sodiumAlpha.seal(plaintext, alice, bobContact);
    assert.equal(
      await sodiumAlpha.open(envelope, bob, aliceContact),
      plaintext,
    );
  }
});

test("Alpha 0 rejects tampering, truncation, wrong recipient, and wrong sender", async () => {
  const alice = await sodiumAlpha.generateIdentity();
  const bob = await sodiumAlpha.generateIdentity();
  const mallory = await sodiumAlpha.generateIdentity();
  const aliceContact = sodiumAlpha.importContact(
    sodiumAlpha.exportContact(alice),
  );
  const bobContact = sodiumAlpha.importContact(sodiumAlpha.exportContact(bob));
  const malloryContact = sodiumAlpha.importContact(
    sodiumAlpha.exportContact(mallory),
  );
  const envelope = await sodiumAlpha.seal(
    "synthetic hostile-input target",
    alice,
    bobContact,
  );

  await assert.rejects(() =>
    sodiumAlpha.open(mutateCiphertext(envelope), bob, aliceContact),
  );
  await assert.rejects(() =>
    sodiumAlpha.open(
      envelope.slice(0, Math.floor(envelope.length / 2)),
      bob,
      aliceContact,
    ),
  );
  await assert.rejects(() => sodiumAlpha.open(envelope, mallory, aliceContact));
  await assert.rejects(() => sodiumAlpha.open(envelope, bob, malloryContact));
});

test("outsider relabeling fails but the intended recipient can forge locally accepted attribution", async () => {
  const alice = await sodiumAlpha.generateIdentity();
  const bob = await sodiumAlpha.generateIdentity();
  const outsider = await sodiumAlpha.generateIdentity();
  const outsiderEnvelope = JSON.parse(
    sealSodiumText("synthetic outsider transcript", outsider, bob.publicKey),
  );
  outsiderEnvelope.sender = exportSodiumContact(alice.publicKey);
  assert.throws(() =>
    openSodiumText(JSON.stringify(outsiderEnvelope), bob, alice.publicKey),
  );

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

test("captured envelopes open after either static private key is disclosed", async () => {
  const alice = await sodiumAlpha.generateIdentity();
  const bob = await sodiumAlpha.generateIdentity();
  const captured = sealSodiumText(
    "synthetic retained relationship envelope",
    alice,
    bob.publicKey,
  );

  assert.equal(
    new TextDecoder().decode(
      openSodiumAfterSenderKeyDisclosure(captured, alice, bob.publicKey),
    ),
    "synthetic retained relationship envelope",
  );
  assert.equal(
    openSodiumText(captured, bob, alice.publicKey),
    "synthetic retained relationship envelope",
  );
});

test("private identity byte arrays receive best-effort overwrite on disposal", async () => {
  const identity = await sodiumAlpha.generateIdentity();
  const privateBytes = identity.privateKey;
  assert.ok(privateBytes.some((byte) => byte !== 0));

  sodiumAlpha.disposeIdentity(identity);

  assert.ok(privateBytes.every((byte) => byte === 0));
  assert.equal(identity.privateKey, null);
  assert.equal(identity.publicKey, null);
});

test("trust-output clearing removes prior artifacts and errors without erasing the comparison", () => {
  const state = createAlphaState();
  state.relationshipHex = "00000000 ".repeat(7) + "00000000";
  state.emojiItems = [{ symbol: "🧪" }];
  state.comparisonConfirmed = false;
  state.sealPlaintext = "synthetic unsent draft";
  state.generatedEnvelope = "synthetic generated ciphertext";
  state.openEnvelope = "synthetic pasted ciphertext";
  state.openedPlaintext = "synthetic opened plaintext";
  state.openStatus = "synthetic prior success";
  state.errors.seal = "synthetic prior seal error";
  state.errors.open = "synthetic prior open error";

  clearTrustDependentOutput(state);

  assert.notEqual(state.relationshipHex, "");
  assert.equal(state.emojiItems.length, 1);
  assert.equal(state.comparisonConfirmed, false);
  assert.equal(state.sealPlaintext, "synthetic unsent draft");
  assert.equal(state.generatedEnvelope, "");
  assert.equal(state.openEnvelope, "");
  assert.equal(state.openedPlaintext, "");
  assert.equal(state.openStatus, "");
  assert.equal(state.errors.seal, "");
  assert.equal(state.errors.open, "");
});
