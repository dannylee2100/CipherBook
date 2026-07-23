import assert from "node:assert/strict";
import test from "node:test";
import sodium from "libsodium-wrappers-sumo";
import {
  CANDIDATE_SEALED,
  CANDIDATE_STATIC,
  disposeIdentity,
  generateDisposableIdentity,
  getPublicContact,
  sealSyntheticText,
} from "../src/construction.js";

const expected = [
  {
    candidate: CANDIDATE_SEALED,
    payloadBytes: 32,
    ciphertextBytes: 359,
    nonceBytes: 0,
    armorBytes: 557,
  },
  {
    candidate: CANDIDATE_STATIC,
    payloadBytes: 32,
    ciphertextBytes: 327,
    nonceBytes: 24,
    armorBytes: 557,
  },
  {
    candidate: CANDIDATE_SEALED,
    payloadBytes: 256,
    ciphertextBytes: 583,
    nonceBytes: 0,
    armorBytes: 856,
  },
  {
    candidate: CANDIDATE_STATIC,
    payloadBytes: 256,
    ciphertextBytes: 551,
    nonceBytes: 24,
    armorBytes: 856,
  },
  {
    candidate: CANDIDATE_SEALED,
    payloadBytes: 2_048,
    ciphertextBytes: 2_375,
    nonceBytes: 0,
    armorBytes: 3_245,
  },
  {
    candidate: CANDIDATE_STATIC,
    payloadBytes: 2_048,
    ciphertextBytes: 2_343,
    nonceBytes: 24,
    armorBytes: 3_245,
  },
];

function testArmorBytes(envelope) {
  const wrapper = {
    warning: "UNSTABLE",
    candidate: envelope.candidate,
    ciphertext: sodium.to_base64(
      envelope.ciphertext,
      sodium.base64_variants.URLSAFE_NO_PADDING,
    ),
    ...(envelope.nonce
      ? {
          nonce: sodium.to_base64(
            envelope.nonce,
            sodium.base64_variants.URLSAFE_NO_PADDING,
          ),
        }
      : undefined),
  };
  return new TextEncoder().encode(JSON.stringify(wrapper)).length;
}

test("recorded construction sizes are reproducible", async () => {
  await sodium.ready;
  const alice = await generateDisposableIdentity();
  const bob = await generateDisposableIdentity();
  try {
    const observed = [];
    for (const payloadBytes of [32, 256, 2_048]) {
      for (const candidate of [CANDIDATE_SEALED, CANDIDATE_STATIC]) {
        const envelope = await sealSyntheticText(
          candidate,
          alice,
          getPublicContact(bob),
          "x".repeat(payloadBytes),
        );
        observed.push({
          candidate,
          payloadBytes,
          ciphertextBytes: envelope.ciphertext.length,
          nonceBytes: envelope.nonce?.length ?? 0,
          armorBytes: testArmorBytes(envelope),
        });
      }
    }
    assert.deepEqual(observed, expected);
  } finally {
    disposeIdentity(alice);
    disposeIdentity(bob);
  }
});
