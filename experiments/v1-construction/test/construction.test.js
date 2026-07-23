import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import test from "node:test";
import sodium from "libsodium-wrappers-sumo";
import {
  CANDIDATE_SEALED,
  CANDIDATE_STATIC,
  MAX_PAYLOAD_BYTES,
  MAX_SPIKE_CIPHERTEXT_BYTES,
  createSignedPacket,
  decryptPacketForProbe,
  disposeIdentity,
  generateDisposableIdentity,
  getPublicContact,
  openSyntheticText,
  resealPacketForProbe,
  sealSyntheticText,
} from "../src/construction.js";

const candidates = [CANDIDATE_SEALED, CANDIDATE_STATIC];
const SIGNED_FIELD_COUNT = 7;
const FIXED_SIGNATURE_HEX =
  "9f70a9b766279fdf23879aca760ce9aaa4351285f0ea63f05a6dbf4f55f93fd81eeca63084e0aeba1cafa796da9f466cf3c32bf9c1785dcfbeb2ecf7e2ec1f0e";

async function identities() {
  return {
    alice: await generateDisposableIdentity(),
    bob: await generateDisposableIdentity(),
    charlie: await generateDisposableIdentity(),
  };
}

function disposeAll(values) {
  Object.values(values).forEach(disposeIdentity);
}

async function fixedIdentity(encryptionByte, signingByte) {
  await sodium.ready;
  const encryption = sodium.crypto_box_seed_keypair(
    new Uint8Array(sodium.crypto_box_SEEDBYTES).fill(encryptionByte),
  );
  const signing = sodium.crypto_sign_seed_keypair(
    new Uint8Array(sodium.crypto_sign_SEEDBYTES).fill(signingByte),
  );
  return {
    encryptionPublicKey: new Uint8Array(encryption.publicKey),
    encryptionPrivateKey: new Uint8Array(encryption.privateKey),
    signingPublicKey: new Uint8Array(signing.publicKey),
    signingPrivateKey: new Uint8Array(signing.privateKey),
  };
}

function mutateSignedField(packet, fieldIndex) {
  const output = new Uint8Array(packet);
  const contextLength = new DataView(
    output.buffer,
    output.byteOffset,
    output.byteLength,
  ).getUint32(0, false);
  let offset = 4;
  const contextEnd = 4 + contextLength;
  for (let index = 0; index < SIGNED_FIELD_COUNT; index += 1) {
    const length = new DataView(
      output.buffer,
      output.byteOffset,
      output.byteLength,
    ).getUint32(offset, false);
    offset += 4;
    assert.ok(offset + length <= contextEnd);
    if (index === fieldIndex) {
      assert.ok(length > 0);
      output[offset + Math.floor(length / 2)] ^= 1;
      return output;
    }
    offset += length;
  }
  throw new Error("missing synthetic signed field");
}

for (const candidate of candidates) {
  test(`${candidate} round trips empty, ASCII, multiline, and Unicode payloads`, async () => {
    const values = await identities();
    try {
      for (const plaintext of [
        "",
        "synthetic ASCII",
        "synthetic\nmultiline\npayload",
        "synthetic 안녕하세요 مرحبا 🔐",
      ]) {
        const envelope = await sealSyntheticText(
          candidate,
          values.alice,
          getPublicContact(values.bob),
          plaintext,
        );
        assert.equal(
          await openSyntheticText(
            envelope,
            values.bob,
            getPublicContact(values.alice),
          ),
          plaintext,
        );
      }
    } finally {
      disposeAll(values);
    }
  });

  test(`${candidate} rejects ciphertext mutation and wrong recipient`, async () => {
    const values = await identities();
    try {
      const envelope = await sealSyntheticText(
        candidate,
        values.alice,
        getPublicContact(values.bob),
        "synthetic payload",
      );
      const mutated = {
        ...envelope,
        ciphertext: new Uint8Array(envelope.ciphertext),
      };
      mutated.ciphertext[Math.floor(mutated.ciphertext.length / 2)] ^= 1;
      await assert.rejects(() =>
        openSyntheticText(mutated, values.bob, getPublicContact(values.alice)),
      );
      await assert.rejects(() =>
        openSyntheticText(
          envelope,
          values.charlie,
          getPublicContact(values.alice),
        ),
      );
    } finally {
      disposeAll(values);
    }
  });

  test(`${candidate} rejects the wrong expected signing contact`, async () => {
    const values = await identities();
    try {
      const envelope = await sealSyntheticText(
        candidate,
        values.alice,
        getPublicContact(values.bob),
        "synthetic payload",
      );
      await assert.rejects(() =>
        openSyntheticText(
          envelope,
          values.bob,
          getPublicContact(values.charlie),
        ),
      );
    } finally {
      disposeAll(values);
    }
  });

  test(`${candidate} rejects truncation, trailing ciphertext, and invalid outer fields`, async () => {
    const values = await identities();
    try {
      const envelope = await sealSyntheticText(
        candidate,
        values.alice,
        getPublicContact(values.bob),
        "synthetic strict outer input",
      );
      await assert.rejects(() =>
        openSyntheticText(
          { ...envelope, ciphertext: envelope.ciphertext.slice(0, -1) },
          values.bob,
          getPublicContact(values.alice),
        ),
      );
      const trailing = new Uint8Array(envelope.ciphertext.length + 1);
      trailing.set(envelope.ciphertext);
      await assert.rejects(() =>
        openSyntheticText(
          { ...envelope, ciphertext: trailing },
          values.bob,
          getPublicContact(values.alice),
        ),
      );
      await assert.rejects(() =>
        openSyntheticText(
          { ...envelope, candidate: "unknown-candidate" },
          values.bob,
          getPublicContact(values.alice),
        ),
      );
      await assert.rejects(() =>
        openSyntheticText(
          {
            ...envelope,
            ciphertext: new Uint8Array(MAX_SPIKE_CIPHERTEXT_BYTES + 1),
          },
          values.bob,
          getPublicContact(values.alice),
        ),
      );

      if (candidate === CANDIDATE_STATIC) {
        const changedNonce = new Uint8Array(envelope.nonce);
        changedNonce[0] ^= 1;
        await assert.rejects(() =>
          openSyntheticText(
            { ...envelope, nonce: changedNonce },
            values.bob,
            getPublicContact(values.alice),
          ),
        );
      } else {
        await assert.rejects(() =>
          openSyntheticText(
            { ...envelope, nonce: new Uint8Array(24) },
            values.bob,
            getPublicContact(values.alice),
          ),
        );
      }
    } finally {
      disposeAll(values);
    }
  });
}

test("fixed synthetic signing seeds reproduce a known detached signature", async () => {
  await sodium.ready;
  const alice = await fixedIdentity(0x11, 0x22);
  const bob = await fixedIdentity(0x33, 0x44);
  try {
    const packet = await createSignedPacket(
      alice,
      getPublicContact(bob),
      "fixed synthetic signature fixture",
    );
    const signature = packet.slice(-sodium.crypto_sign_BYTES);
    assert.equal(sodium.to_hex(signature), FIXED_SIGNATURE_HEX);
    const envelope = await resealPacketForProbe(
      CANDIDATE_SEALED,
      packet,
      alice,
      getPublicContact(bob),
    );
    assert.equal(
      await openSyntheticText(envelope, bob, getPublicContact(alice)),
      "fixed synthetic signature fixture",
    );
  } finally {
    disposeIdentity(alice);
    disposeIdentity(bob);
  }
});

test("every signed context field and the detached signature are authenticated", async () => {
  await sodium.ready;
  const values = await identities();
  try {
    const packet = await createSignedPacket(
      values.alice,
      getPublicContact(values.bob),
      "synthetic field matrix",
    );
    const probes = Array.from({ length: SIGNED_FIELD_COUNT }, (_, index) =>
      mutateSignedField(packet, index),
    );
    const changedSignature = new Uint8Array(packet);
    changedSignature[changedSignature.length - 1] ^= 1;
    probes.push(changedSignature);

    for (const probe of probes) {
      const envelope = await resealPacketForProbe(
        CANDIDATE_SEALED,
        probe,
        values.alice,
        getPublicContact(values.bob),
      );
      await assert.rejects(() =>
        openSyntheticText(envelope, values.bob, getPublicContact(values.alice)),
      );
    }
  } finally {
    disposeAll(values);
  }
});

test("an authenticated packet rejects trailing inner data", async () => {
  const values = await identities();
  try {
    const packet = await createSignedPacket(
      values.alice,
      getPublicContact(values.bob),
      "synthetic inner length",
    );
    const trailing = new Uint8Array(packet.length + 1);
    trailing.set(packet);
    const envelope = await resealPacketForProbe(
      CANDIDATE_SEALED,
      trailing,
      values.alice,
      getPublicContact(values.bob),
    );
    await assert.rejects(() =>
      openSyntheticText(envelope, values.bob, getPublicContact(values.alice)),
    );
  } finally {
    disposeAll(values);
  }
});

test("valid signatures cannot hide sender or recipient contact disagreement", async () => {
  const values = await identities();
  const hybridSender = {
    encryptionPublicKey: new Uint8Array(values.charlie.encryptionPublicKey),
    encryptionPrivateKey: new Uint8Array(values.charlie.encryptionPrivateKey),
    signingPublicKey: new Uint8Array(values.alice.signingPublicKey),
    signingPrivateKey: new Uint8Array(values.alice.signingPrivateKey),
  };
  try {
    const senderMismatch = await sealSyntheticText(
      CANDIDATE_SEALED,
      hybridSender,
      getPublicContact(values.bob),
      "synthetic sender mismatch",
    );
    await assert.rejects(() =>
      openSyntheticText(
        senderMismatch,
        values.bob,
        getPublicContact(values.alice),
      ),
    );

    const recipientMismatchContact = {
      encryptionPublicKey: new Uint8Array(values.bob.encryptionPublicKey),
      signingPublicKey: new Uint8Array(values.charlie.signingPublicKey),
    };
    const packet = await createSignedPacket(
      values.alice,
      recipientMismatchContact,
      "synthetic recipient mismatch",
    );
    const recipientMismatch = await resealPacketForProbe(
      CANDIDATE_SEALED,
      packet,
      values.alice,
      getPublicContact(values.bob),
    );
    await assert.rejects(() =>
      openSyntheticText(
        recipientMismatch,
        values.bob,
        getPublicContact(values.alice),
      ),
    );
  } finally {
    disposeIdentity(hybridSender);
    disposeAll(values);
  }
});

test("randomized synthetic text round trips under both candidates", async () => {
  const values = await identities();
  try {
    for (let index = 0; index < 20; index += 1) {
      const plaintext = `${randomBytes(index + 1).toString("base64url")} · ${index % 2 ? "🧪" : "합성"}`;
      for (const candidate of candidates) {
        const envelope = await sealSyntheticText(
          candidate,
          values.alice,
          getPublicContact(values.bob),
          plaintext,
        );
        assert.equal(
          await openSyntheticText(
            envelope,
            values.bob,
            getPublicContact(values.alice),
          ),
          plaintext,
        );
      }
    }
  } finally {
    disposeAll(values);
  }
});

test("payload limit accepts the boundary and rejects one byte beyond it", async () => {
  const values = await identities();
  try {
    const boundary = "a".repeat(MAX_PAYLOAD_BYTES);
    for (const candidate of candidates) {
      const envelope = await sealSyntheticText(
        candidate,
        values.alice,
        getPublicContact(values.bob),
        boundary,
      );
      assert.equal(
        await openSyntheticText(
          envelope,
          values.bob,
          getPublicContact(values.alice),
        ),
        boundary,
      );
      await assert.rejects(() =>
        sealSyntheticText(
          candidate,
          values.alice,
          getPublicContact(values.bob),
          `${boundary}a`,
        ),
      );
    }
  } finally {
    disposeAll(values);
  }
});

test("recipient replay is accepted but recipient re-encryption to another recipient is rejected", async () => {
  const values = await identities();
  try {
    const bobContact = getPublicContact(values.bob);
    const aliceContact = getPublicContact(values.alice);
    const packet = await createSignedPacket(
      values.alice,
      bobContact,
      "synthetic replay",
    );
    const first = await resealPacketForProbe(
      CANDIDATE_SEALED,
      packet,
      values.alice,
      bobContact,
    );
    assert.equal(
      await openSyntheticText(first, values.bob, aliceContact),
      "synthetic replay",
    );
    assert.equal(
      await openSyntheticText(first, values.bob, aliceContact),
      "synthetic replay",
    );

    const rewrapped = await resealPacketForProbe(
      CANDIDATE_SEALED,
      packet,
      values.alice,
      getPublicContact(values.charlie),
    );
    await assert.rejects(() =>
      openSyntheticText(rewrapped, values.charlie, aliceContact),
    );
  } finally {
    disposeAll(values);
  }
});

test("recipient and outsider cannot replace the payload and sender signature", async () => {
  await sodium.ready;
  const values = await identities();
  try {
    const packet = await createSignedPacket(
      values.alice,
      getPublicContact(values.bob),
      "synthetic authorship",
    );
    for (const forger of [values.bob, values.charlie]) {
      const forged = mutateSignedField(packet, 6);
      const signatureOffset = forged.length - sodium.crypto_sign_BYTES;
      const context = forged.slice(4, signatureOffset);
      forged.set(
        sodium.crypto_sign_detached(context, forger.signingPrivateKey),
        signatureOffset,
      );
      const envelope = await resealPacketForProbe(
        CANDIDATE_SEALED,
        forged,
        values.alice,
        getPublicContact(values.bob),
      );
      await assert.rejects(() =>
        openSyntheticText(envelope, values.bob, getPublicContact(values.alice)),
      );
    }
  } finally {
    disposeAll(values);
  }
});

test("later sender encryption-key disclosure opens static but not sealed outgoing captures", async () => {
  await sodium.ready;
  const values = await identities();
  try {
    const staticEnvelope = await sealSyntheticText(
      CANDIDATE_STATIC,
      values.alice,
      getPublicContact(values.bob),
      "synthetic capture",
    );
    const packet = sodium.crypto_box_open_easy(
      staticEnvelope.ciphertext,
      staticEnvelope.nonce,
      values.bob.encryptionPublicKey,
      values.alice.encryptionPrivateKey,
    );
    assert.deepEqual(
      packet,
      await decryptPacketForProbe(
        staticEnvelope,
        values.bob,
        getPublicContact(values.alice),
      ),
    );

    const sealedEnvelope = await sealSyntheticText(
      CANDIDATE_SEALED,
      values.alice,
      getPublicContact(values.bob),
      "synthetic sealed capture",
    );
    await assert.rejects(async () =>
      sodium.crypto_box_seal_open(
        sealedEnvelope.ciphertext,
        values.alice.encryptionPublicKey,
        values.alice.encryptionPrivateKey,
      ),
    );
  } finally {
    disposeAll(values);
  }
});

test("later recipient encryption-key disclosure opens retained captures from both candidates", async () => {
  const values = await identities();
  try {
    for (const candidate of candidates) {
      const envelope = await sealSyntheticText(
        candidate,
        values.alice,
        getPublicContact(values.bob),
        "synthetic retained capture",
      );
      assert.equal(
        await openSyntheticText(
          envelope,
          values.bob,
          getPublicContact(values.alice),
        ),
        "synthetic retained capture",
      );
    }
  } finally {
    disposeAll(values);
  }
});

test("later sender signing-key disclosure permits new accepted forgeries", async () => {
  const values = await identities();
  let attackerWithLeakedSigningKey;
  try {
    attackerWithLeakedSigningKey = {
      encryptionPublicKey: new Uint8Array(values.alice.encryptionPublicKey),
      encryptionPrivateKey: new Uint8Array(values.charlie.encryptionPrivateKey),
      signingPublicKey: new Uint8Array(values.alice.signingPublicKey),
      signingPrivateKey: new Uint8Array(values.alice.signingPrivateKey),
    };
    const envelope = await sealSyntheticText(
      CANDIDATE_SEALED,
      attackerWithLeakedSigningKey,
      getPublicContact(values.bob),
      "synthetic post-compromise forgery",
    );
    assert.equal(
      await openSyntheticText(
        envelope,
        values.bob,
        getPublicContact(values.alice),
      ),
      "synthetic post-compromise forgery",
    );
  } finally {
    disposeIdentity(attackerWithLeakedSigningKey);
    disposeAll(values);
  }
});
