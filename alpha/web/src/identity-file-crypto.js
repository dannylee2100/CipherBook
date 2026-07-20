import sodium from "libsodium-wrappers-sumo";

await sodium.ready;

export const ALPHA1_KDF_PROFILE = Object.freeze({
  id: 1,
  name: "argon2id13-interactive-alpha1",
  algorithm: 2,
  operationsLimit: 2,
  memoryLimit: 67_108_864,
  keyBytes: 32,
  saltBytes: 16,
});

export function assertAlpha1KdfCompatibility(sodiumApi) {
  const expectedConstants = [
    ["crypto_pwhash_ALG_ARGON2ID13", ALPHA1_KDF_PROFILE.algorithm],
    ["crypto_pwhash_OPSLIMIT_INTERACTIVE", ALPHA1_KDF_PROFILE.operationsLimit],
    ["crypto_pwhash_MEMLIMIT_INTERACTIVE", ALPHA1_KDF_PROFILE.memoryLimit],
    [
      "crypto_aead_xchacha20poly1305_ietf_KEYBYTES",
      ALPHA1_KDF_PROFILE.keyBytes,
    ],
    ["crypto_pwhash_SALTBYTES", ALPHA1_KDF_PROFILE.saltBytes],
  ];

  for (const [name, expected] of expectedConstants) {
    if (sodiumApi?.[name] !== expected) {
      throw new Error(
        `Loaded libsodium ${name} does not match the reviewed Alpha 1 KDF profile.`,
      );
    }
  }
}

assertAlpha1KdfCompatibility(sodium);

function copyBytes(value, expectedLength, name) {
  if (!(value instanceof Uint8Array) || value.length !== expectedLength) {
    throw new Error(`${name} must be exactly ${expectedLength} bytes`);
  }
  return new Uint8Array(value);
}

export const identityFileCrypto = Object.freeze({
  saltBytes: ALPHA1_KDF_PROFILE.saltBytes,
  nonceBytes: sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES,
  keyBytes: ALPHA1_KDF_PROFILE.keyBytes,
  authenticationBytes: sodium.crypto_aead_xchacha20poly1305_ietf_ABYTES,
  privateKeyBytes: sodium.crypto_box_SECRETKEYBYTES,
  publicKeyBytes: sodium.crypto_box_PUBLICKEYBYTES,

  randomBytes(length) {
    return new Uint8Array(sodium.randombytes_buf(length));
  },

  deriveKey(passphraseBytes, salt) {
    return new Uint8Array(
      sodium.crypto_pwhash(
        ALPHA1_KDF_PROFILE.keyBytes,
        passphraseBytes,
        salt,
        ALPHA1_KDF_PROFILE.operationsLimit,
        ALPHA1_KDF_PROFILE.memoryLimit,
        ALPHA1_KDF_PROFILE.algorithm,
      ),
    );
  },

  encrypt(plaintext, additionalData, nonce, key) {
    return new Uint8Array(
      sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
        plaintext,
        additionalData,
        null,
        nonce,
        key,
      ),
    );
  },

  decrypt(ciphertext, additionalData, nonce, key) {
    const plaintext = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
      null,
      ciphertext,
      additionalData,
      nonce,
      key,
    );
    if (!plaintext) {
      throw new Error("identity-file authentication failed");
    }
    return new Uint8Array(plaintext);
  },

  derivePublicKey(privateKey) {
    return copyBytes(
      sodium.crypto_scalarmult_base(privateKey),
      sodium.crypto_box_PUBLICKEYBYTES,
      "reconstructed public key",
    );
  },

  zero(value) {
    if (value instanceof Uint8Array) {
      sodium.memzero(value);
    }
  },
});
