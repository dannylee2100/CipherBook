import assert from "node:assert/strict";
import { test } from "node:test";

import { utf8 } from "../../../experiments/milestone-1/src/bytes.js";
import { exportSodiumContact } from "../../../experiments/milestone-1/src/sodium.js";
import {
  assertAlpha1KdfCompatibility,
  identityFileCrypto,
} from "../src/identity-file-crypto.js";
import {
  IDENTITY_FILE_KDF_PROFILE,
  IDENTITY_FILE_LAYOUT,
  exportEncryptedIdentityFile,
  importEncryptedIdentityFile,
  validateExportPassphrase,
} from "../src/identity-file.js";
import {
  containsExactBytes,
  makeFastCrypto,
  runtimeIdentity,
  runtimePassphrase,
} from "./identity-file-test-helpers.js";
import { createAlphaState } from "../src/state.js";

function changed(bytes, offset) {
  const copy = new Uint8Array(bytes);
  copy[offset] ^= 1;
  return copy;
}

test("real Alpha 1 export/import restores the exact public contact from the secret key", async () => {
  const identity = runtimeIdentity();
  const passphrase = runtimePassphrase();
  const expectedContact = exportSodiumContact(identity.publicKey);

  const file = await exportEncryptedIdentityFile(
    identity,
    passphrase,
    passphrase,
  );
  const restored = await importEncryptedIdentityFile(file, passphrase);

  assert.equal(file.length, IDENTITY_FILE_LAYOUT.totalBytes);
  assert.equal(restored.contact, expectedContact);
  assert.deepEqual(restored.identity.publicKey, identity.publicKey);
  assert.deepEqual(restored.identity.privateKey, identity.privateKey);
});

test("literal profile semantics import a file produced with the prior dependency-derived values", async () => {
  const identity = runtimeIdentity();
  const passphrase = runtimePassphrase();
  const expectedContact = exportSodiumContact(identity.publicKey);
  const priorProfileAdapter = {
    ...identityFileCrypto,
    saltBytes: 16,
    keyBytes: 32,
  };

  const priorFile = await exportEncryptedIdentityFile(
    identity,
    passphrase,
    passphrase,
    priorProfileAdapter,
  );
  const restored = await importEncryptedIdentityFile(priorFile, passphrase);

  assert.equal(priorFile.length, 107);
  assert.equal(priorFile[IDENTITY_FILE_LAYOUT.profileOffset], 1);
  assert.equal(restored.contact, expectedContact);
  assert.deepEqual(restored.identity.privateKey, identity.privateKey);
});

test("fresh salt and nonce make repeated exports differ", async () => {
  const identity = runtimeIdentity();
  const passphrase = runtimePassphrase();
  const { crypto } = makeFastCrypto();

  const first = await exportEncryptedIdentityFile(
    identity,
    passphrase,
    passphrase,
    crypto,
  );
  const second = await exportEncryptedIdentityFile(
    identity,
    passphrase,
    passphrase,
    crypto,
  );

  assert.notDeepEqual(
    first.subarray(
      IDENTITY_FILE_LAYOUT.saltOffset,
      IDENTITY_FILE_LAYOUT.nonceOffset,
    ),
    second.subarray(
      IDENTITY_FILE_LAYOUT.saltOffset,
      IDENTITY_FILE_LAYOUT.nonceOffset,
    ),
  );
  assert.notDeepEqual(
    first.subarray(
      IDENTITY_FILE_LAYOUT.nonceOffset,
      IDENTITY_FILE_LAYOUT.ciphertextOffset,
    ),
    second.subarray(
      IDENTITY_FILE_LAYOUT.nonceOffset,
      IDENTITY_FILE_LAYOUT.ciphertextOffset,
    ),
  );
  assert.notDeepEqual(first, second);
});

test("wrong passphrase and modified authenticated bytes share one bounded failure", async () => {
  const identity = runtimeIdentity();
  const passphrase = runtimePassphrase();
  const wrongPassphrase = runtimePassphrase();
  const realFile = await exportEncryptedIdentityFile(
    identity,
    passphrase,
    passphrase,
  );

  await assert.rejects(
    () => importEncryptedIdentityFile(realFile, wrongPassphrase),
    (error) =>
      error.code === "authentication" &&
      error.message ===
        "The identity file could not be opened. The passphrase may be incorrect, or the file may be damaged or modified.",
  );

  const { crypto } = makeFastCrypto();
  const fastFile = await exportEncryptedIdentityFile(
    identity,
    passphrase,
    passphrase,
    crypto,
  );
  for (const offset of [
    IDENTITY_FILE_LAYOUT.saltOffset,
    IDENTITY_FILE_LAYOUT.nonceOffset,
    IDENTITY_FILE_LAYOUT.ciphertextOffset,
    IDENTITY_FILE_LAYOUT.totalBytes - 1,
  ]) {
    await assert.rejects(
      () =>
        importEncryptedIdentityFile(
          changed(fastFile, offset),
          passphrase,
          crypto,
        ),
      (error) => error.code === "authentication",
    );
  }
});

test("magic, profile, truncation, and trailing bytes fail before KDF", async () => {
  const identity = runtimeIdentity();
  const passphrase = runtimePassphrase();
  const { crypto, observations } = makeFastCrypto();
  const file = await exportEncryptedIdentityFile(
    identity,
    passphrase,
    passphrase,
    crypto,
  );
  const baselineCalls = observations.deriveCalls;

  const cases = [
    {
      bytes: changed(file, IDENTITY_FILE_LAYOUT.magicOffset),
      code: "file-format",
    },
    {
      bytes: changed(file, IDENTITY_FILE_LAYOUT.profileOffset),
      code: "kdf-profile",
    },
    { bytes: file.subarray(0, file.length - 1), code: "file-length" },
    { bytes: new Uint8Array([...file, 0]), code: "file-length" },
  ];
  for (const item of cases) {
    await assert.rejects(
      () => importEncryptedIdentityFile(item.bytes, passphrase, crypto),
      (error) => error.code === item.code,
    );
    assert.equal(observations.deriveCalls, baselineCalls);
  }
});

test("invalid decrypted private-key length and public reconstruction failures clear rejected buffers", async () => {
  const identity = runtimeIdentity();
  const passphrase = runtimePassphrase();
  const fast = makeFastCrypto();
  const file = await exportEncryptedIdentityFile(
    identity,
    passphrase,
    passphrase,
    fast.crypto,
  );

  const shortBuffer = new Uint8Array(identityFileCrypto.privateKeyBytes - 1);
  const shortCrypto = {
    ...fast.crypto,
    decrypt() {
      return shortBuffer;
    },
  };
  await assert.rejects(
    () => importEncryptedIdentityFile(file, passphrase, shortCrypto),
    (error) => error.code === "private-key-length",
  );
  assert.ok(shortBuffer.every((byte) => byte === 0));

  let rejectedCandidate;
  const reconstructionCrypto = {
    ...fast.crypto,
    derivePublicKey(candidate) {
      rejectedCandidate = candidate;
      throw new Error("synthetic reconstruction failure");
    },
  };
  await assert.rejects(() =>
    importEncryptedIdentityFile(file, passphrase, reconstructionCrypto),
  );
  assert.ok(rejectedCandidate.every((byte) => byte === 0));
});

test("exported bytes omit exact private key, public contact, and passphrase byte sequences", async () => {
  const identity = runtimeIdentity();
  const passphrase = runtimePassphrase();
  const file = await exportEncryptedIdentityFile(
    identity,
    passphrase,
    passphrase,
  );

  assert.equal(containsExactBytes(file, identity.privateKey), false);
  assert.equal(
    containsExactBytes(file, utf8(exportSodiumContact(identity.publicKey))),
    false,
  );
  assert.equal(containsExactBytes(file, utf8(passphrase)), false);
});

test("relationship and message state never enters the identity-file plaintext", async () => {
  const identity = runtimeIdentity();
  const passphrase = runtimePassphrase();
  const { crypto } = makeFastCrypto();
  const encryptedPlaintexts = [];
  const observingCrypto = {
    ...crypto,
    encrypt(plaintext, ...arguments_) {
      encryptedPlaintexts.push(new Uint8Array(plaintext));
      return crypto.encrypt(plaintext, ...arguments_);
    },
  };
  const relationshipVariants = [
    {
      contactDraft: "synthetic-counterparty-a",
      counterparty: { text: "synthetic-counterparty-a" },
      relationshipHex: "ab".repeat(32),
      emojiItems: [{ symbol: "🧪" }],
      comparisonConfirmed: true,
      sealPlaintext: "synthetic draft a",
      generatedEnvelope: "synthetic ciphertext a",
      openEnvelope: "synthetic pasted ciphertext a",
      openedPlaintext: "synthetic opened plaintext a",
    },
    {
      contactDraft: "synthetic-counterparty-b",
      counterparty: { text: "synthetic-counterparty-b" },
      relationshipHex: "cd".repeat(32),
      emojiItems: [{ symbol: "📨" }],
      comparisonConfirmed: false,
      sealPlaintext: "synthetic draft b",
      generatedEnvelope: "synthetic ciphertext b",
      openEnvelope: "synthetic pasted ciphertext b",
      openedPlaintext: "synthetic opened plaintext b",
    },
  ];

  for (const relationshipState of relationshipVariants) {
    const state = Object.assign(createAlphaState(), relationshipState, {
      identity,
    });
    const file = await exportEncryptedIdentityFile(
      state.identity,
      passphrase,
      passphrase,
      observingCrypto,
    );
    assert.equal(file.length, 107);
  }

  assert.equal(encryptedPlaintexts.length, relationshipVariants.length);
  for (const plaintext of encryptedPlaintexts) {
    assert.equal(plaintext.length, 32);
    assert.deepEqual(plaintext, identity.privateKey);
  }
});

test("passphrase validation preserves spaces, case, and Unicode form without normalization", async () => {
  const identity = runtimeIdentity();
  const core = runtimePassphrase();
  const composed = `${core}${String.fromCodePoint(0x00e9)}`;
  const decomposed = `${core}e${String.fromCodePoint(0x0301)}`;
  const variants = [
    ` ${core}`,
    `${core} `,
    core.toUpperCase(),
    core.toLowerCase(),
    composed,
    decomposed,
  ];
  const { crypto, observations } = makeFastCrypto();

  for (const value of variants) {
    await exportEncryptedIdentityFile(identity, value, value, crypto);
  }

  assert.deepEqual(
    observations.passphraseInputs.map((bytes) => Array.from(bytes)),
    variants.map((value) => Array.from(utf8(value))),
  );
  assert.notDeepEqual(
    observations.passphraseInputs.at(-2),
    observations.passphraseInputs.at(-1),
  );
});

test("empty, short, mismatched, and overlong export passphrases are rejected", () => {
  const first = runtimePassphrase();
  const second = runtimePassphrase();
  const short = randomShortPassphrase();
  const overlong = String.fromCodePoint(0x61).repeat(1025);

  assert.throws(() => validateExportPassphrase("", ""), {
    code: "passphrase-empty",
  });
  assert.throws(() => validateExportPassphrase(short, short), {
    code: "passphrase-short",
  });
  assert.throws(() => validateExportPassphrase(first, second), {
    code: "passphrase-mismatch",
  });
  assert.throws(() => validateExportPassphrase(overlong, overlong), {
    code: "passphrase-long",
  });
});

function randomShortPassphrase() {
  return runtimePassphrase().slice(0, 11);
}

test("temporary passphrase, KDF-key, plaintext, decrypted, and rejected candidate buffers are zeroed", async () => {
  const identity = runtimeIdentity();
  const passphrase = runtimePassphrase();
  const { crypto, observations } = makeFastCrypto();
  const file = await exportEncryptedIdentityFile(
    identity,
    passphrase,
    passphrase,
    crypto,
  );
  await importEncryptedIdentityFile(file, passphrase, crypto);

  assert.ok(observations.zeroedInputs.length >= 6);
  assert.ok(
    observations.zeroedInputs.every((bytes) =>
      bytes.every((byte) => byte === 0),
    ),
  );
});

test("KDF allocation failure is attempted once with no weaker fallback", async () => {
  const identity = runtimeIdentity();
  const passphrase = runtimePassphrase();
  let deriveCalls = 0;
  const failingCrypto = {
    ...identityFileCrypto,
    deriveKey() {
      deriveCalls += 1;
      throw new Error("synthetic allocation failure");
    },
  };

  await assert.rejects(
    () =>
      exportEncryptedIdentityFile(
        identity,
        passphrase,
        passphrase,
        failingCrypto,
      ),
    (error) => error.code === "kdf-failed",
  );
  assert.equal(deriveCalls, 1);
});

test("an unexpected derived-key buffer is rejected and zeroed without fallback", async () => {
  const identity = runtimeIdentity();
  const passphrase = runtimePassphrase();
  const unexpectedKey = new Uint8Array(identityFileCrypto.keyBytes - 1).fill(
    0x5a,
  );
  let deriveCalls = 0;
  const invalidCrypto = {
    ...identityFileCrypto,
    deriveKey() {
      deriveCalls += 1;
      return unexpectedKey;
    },
  };

  await assert.rejects(
    () =>
      exportEncryptedIdentityFile(
        identity,
        passphrase,
        passphrase,
        invalidCrypto,
      ),
    (error) => error.code === "kdf-failed",
  );
  assert.equal(deriveCalls, 1);
  assert.ok(unexpectedKey.every((byte) => byte === 0));
});

test("the fixed profile records explicit Argon2id13 interactive constants", () => {
  assert.deepEqual(IDENTITY_FILE_KDF_PROFILE, {
    id: 1,
    name: "argon2id13-interactive-alpha1",
    algorithm: 2,
    operationsLimit: 2,
    memoryLimit: 67_108_864,
    keyBytes: 32,
    saltBytes: 16,
  });
  assert.deepEqual(IDENTITY_FILE_LAYOUT, {
    magicOffset: 0,
    magicBytes: 18,
    profileOffset: 18,
    profileBytes: 1,
    saltOffset: 19,
    saltBytes: 16,
    nonceOffset: 35,
    nonceBytes: 24,
    ciphertextOffset: 59,
    ciphertextBytes: 48,
    totalBytes: 107,
  });
});

test("the Alpha 1 profile accepts only the reviewed sodium constant mapping before KDF work", () => {
  let deriveCalls = 0;
  const compatible = {
    crypto_pwhash_ALG_ARGON2ID13: 2,
    crypto_pwhash_OPSLIMIT_INTERACTIVE: 2,
    crypto_pwhash_MEMLIMIT_INTERACTIVE: 67_108_864,
    crypto_aead_xchacha20poly1305_ietf_KEYBYTES: 32,
    crypto_pwhash_SALTBYTES: 16,
    crypto_pwhash() {
      deriveCalls += 1;
    },
  };

  assert.doesNotThrow(() => assertAlpha1KdfCompatibility(compatible));
  assert.equal(deriveCalls, 0);

  for (const name of [
    "crypto_pwhash_ALG_ARGON2ID13",
    "crypto_pwhash_OPSLIMIT_INTERACTIVE",
    "crypto_pwhash_MEMLIMIT_INTERACTIVE",
    "crypto_aead_xchacha20poly1305_ietf_KEYBYTES",
    "crypto_pwhash_SALTBYTES",
  ]) {
    assert.throws(
      () =>
        assertAlpha1KdfCompatibility({
          ...compatible,
          [name]: compatible[name] + 1,
        }),
      /does not match the reviewed Alpha 1 KDF profile/u,
    );
    assert.equal(deriveCalls, 0);
  }
});
