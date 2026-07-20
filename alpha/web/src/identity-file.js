import {
  concatBytes,
  requireBytes,
} from "../../../experiments/milestone-1/src/bytes.js";
import { exportSodiumContact } from "../../../experiments/milestone-1/src/sodium.js";
import {
  ALPHA1_KDF_PROFILE,
  identityFileCrypto,
} from "./identity-file-crypto.js";

const encoder = new TextEncoder();
const MAGIC_TEXT = "CBALPHA-IDENTITY-A";
const MAGIC = encoder.encode(MAGIC_TEXT);
const PROFILE_BYTES = 1;

export const IDENTITY_FILE_MAX_BYTES = 4 * 1024;
export const IDENTITY_FILE_NAME = "cipherbook-alpha1-identity.cbidentity";
export const IDENTITY_FILE_MIME = "application/octet-stream";
export const IDENTITY_FILE_MIN_PASSPHRASE_CODE_POINTS = 12;
export const IDENTITY_FILE_MAX_PASSPHRASE_BYTES = 1024;

const layout = {
  magicOffset: 0,
  magicBytes: MAGIC.length,
  profileOffset: MAGIC.length,
  profileBytes: PROFILE_BYTES,
  saltOffset: MAGIC.length + PROFILE_BYTES,
  saltBytes: identityFileCrypto.saltBytes,
};
layout.nonceOffset = layout.saltOffset + layout.saltBytes;
layout.nonceBytes = identityFileCrypto.nonceBytes;
layout.ciphertextOffset = layout.nonceOffset + layout.nonceBytes;
layout.ciphertextBytes =
  identityFileCrypto.privateKeyBytes + identityFileCrypto.authenticationBytes;
layout.totalBytes = layout.ciphertextOffset + layout.ciphertextBytes;

export const IDENTITY_FILE_LAYOUT = Object.freeze({ ...layout });
export const IDENTITY_FILE_MAGIC_TEXT = MAGIC_TEXT;
export const IDENTITY_FILE_KDF_PROFILE = ALPHA1_KDF_PROFILE;

export class IdentityFileError extends Error {
  constructor(code, message, options) {
    super(message, options);
    this.name = "IdentityFileError";
    this.code = code;
  }
}

function fail(code, message, cause) {
  return new IdentityFileError(
    code,
    message,
    cause === undefined ? undefined : { cause },
  );
}

function equalBytes(left, right) {
  if (left.length !== right.length) {
    return false;
  }
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left[index] ^ right[index];
  }
  return difference === 0;
}

function requireExactBytes(value, length, code, name) {
  if (!(value instanceof Uint8Array) || value.length !== length) {
    throw fail(code, `${name} must be exactly ${length} bytes.`);
  }
  return value;
}

function encodePassphrase(passphrase, { requireMinimum }) {
  if (typeof passphrase !== "string") {
    throw fail("passphrase-type", "Passphrase must be text.");
  }
  if (passphrase.length === 0) {
    throw fail("passphrase-empty", "Enter a passphrase.");
  }
  if (
    requireMinimum &&
    Array.from(passphrase).length < IDENTITY_FILE_MIN_PASSPHRASE_CODE_POINTS
  ) {
    throw fail(
      "passphrase-short",
      `Use at least ${IDENTITY_FILE_MIN_PASSPHRASE_CODE_POINTS} Unicode code points.`,
    );
  }
  const bytes = encoder.encode(passphrase);
  if (bytes.length > IDENTITY_FILE_MAX_PASSPHRASE_BYTES) {
    bytes.fill(0);
    throw fail(
      "passphrase-long",
      `Passphrase exceeds ${IDENTITY_FILE_MAX_PASSPHRASE_BYTES} UTF-8 bytes.`,
    );
  }
  return bytes;
}

function requireMatchingPassphrases(passphrase, confirmation) {
  if (passphrase !== confirmation) {
    throw fail(
      "passphrase-mismatch",
      "Passphrase and confirmation must match exactly.",
    );
  }
}

export function validateExportPassphrase(passphrase, confirmation) {
  requireMatchingPassphrases(passphrase, confirmation);
  const bytes = encodePassphrase(passphrase, { requireMinimum: true });
  bytes.fill(0);
}

function parseIdentityFile(value) {
  const bytes = requireBytes(value, "identity file");
  if (bytes.length !== IDENTITY_FILE_LAYOUT.totalBytes) {
    throw fail(
      "file-length",
      `Identity file must be exactly ${IDENTITY_FILE_LAYOUT.totalBytes} bytes.`,
    );
  }

  const magic = bytes.subarray(0, IDENTITY_FILE_LAYOUT.magicBytes);
  if (!equalBytes(magic, MAGIC)) {
    throw fail("file-format", "Unsupported identity-file format.");
  }

  const profile = bytes[IDENTITY_FILE_LAYOUT.profileOffset];
  if (profile !== ALPHA1_KDF_PROFILE.id) {
    throw fail("kdf-profile", "Unsupported identity-file KDF profile.");
  }

  return {
    additionalData: bytes.subarray(0, IDENTITY_FILE_LAYOUT.ciphertextOffset),
    salt: bytes.subarray(
      IDENTITY_FILE_LAYOUT.saltOffset,
      IDENTITY_FILE_LAYOUT.nonceOffset,
    ),
    nonce: bytes.subarray(
      IDENTITY_FILE_LAYOUT.nonceOffset,
      IDENTITY_FILE_LAYOUT.ciphertextOffset,
    ),
    ciphertext: bytes.subarray(IDENTITY_FILE_LAYOUT.ciphertextOffset),
  };
}

function validateActiveIdentity(identity, crypto) {
  if (
    identity === null ||
    typeof identity !== "object" ||
    !(identity.privateKey instanceof Uint8Array) ||
    identity.privateKey.length !== crypto.privateKeyBytes
  ) {
    throw fail("identity", "An active Alpha identity is required.");
  }
}

export async function exportEncryptedIdentityFile(
  identity,
  passphrase,
  confirmation,
  crypto = identityFileCrypto,
) {
  validateActiveIdentity(identity, crypto);
  requireMatchingPassphrases(passphrase, confirmation);

  let passphraseBytes;
  let derivedKey;
  let plaintextPrivateKey;
  try {
    passphraseBytes = encodePassphrase(passphrase, { requireMinimum: true });
    const salt = requireExactBytes(
      crypto.randomBytes(crypto.saltBytes),
      crypto.saltBytes,
      "salt-length",
      "Generated salt",
    );
    const nonce = requireExactBytes(
      crypto.randomBytes(crypto.nonceBytes),
      crypto.nonceBytes,
      "nonce-length",
      "Generated nonce",
    );
    const profile = Uint8Array.of(ALPHA1_KDF_PROFILE.id);
    const additionalData = concatBytes(MAGIC, profile, salt, nonce);

    try {
      derivedKey = crypto.deriveKey(passphraseBytes, salt);
      requireExactBytes(
        derivedKey,
        crypto.keyBytes,
        "derived-key-length",
        "Derived encryption key",
      );
    } catch (error) {
      throw fail(
        "kdf-failed",
        "The identity-file key could not be derived in this browser.",
        error,
      );
    }

    plaintextPrivateKey = new Uint8Array(identity.privateKey);
    const ciphertext = requireExactBytes(
      crypto.encrypt(plaintextPrivateKey, additionalData, nonce, derivedKey),
      IDENTITY_FILE_LAYOUT.ciphertextBytes,
      "ciphertext-length",
      "Encrypted identity",
    );
    return concatBytes(additionalData, ciphertext);
  } finally {
    crypto.zero(passphraseBytes);
    crypto.zero(derivedKey);
    crypto.zero(plaintextPrivateKey);
  }
}

export async function importEncryptedIdentityFile(
  fileBytes,
  passphrase,
  crypto = identityFileCrypto,
) {
  const parsed = parseIdentityFile(fileBytes);
  let passphraseBytes;
  let derivedKey;
  let decryptedPrivateKey;
  let candidatePrivateKey;
  let accepted = false;

  try {
    passphraseBytes = encodePassphrase(passphrase, { requireMinimum: false });
    try {
      derivedKey = crypto.deriveKey(passphraseBytes, parsed.salt);
      requireExactBytes(
        derivedKey,
        crypto.keyBytes,
        "derived-key-length",
        "Derived encryption key",
      );
    } catch (error) {
      throw fail(
        "kdf-failed",
        "The identity file could not be opened in this browser.",
        error,
      );
    }

    try {
      decryptedPrivateKey = crypto.decrypt(
        parsed.ciphertext,
        parsed.additionalData,
        parsed.nonce,
        derivedKey,
      );
    } catch (error) {
      throw fail(
        "authentication",
        "The identity file could not be opened. The passphrase may be incorrect, or the file may be damaged or modified.",
        error,
      );
    }

    requireExactBytes(
      decryptedPrivateKey,
      crypto.privateKeyBytes,
      "private-key-length",
      "Decrypted private key",
    );

    candidatePrivateKey = new Uint8Array(decryptedPrivateKey);
    const publicKey = crypto.derivePublicKey(candidatePrivateKey);
    if (
      !(publicKey instanceof Uint8Array) ||
      publicKey.length !== crypto.publicKeyBytes
    ) {
      throw fail(
        "public-key-length",
        "The identity file could not reconstruct a valid public key.",
      );
    }

    const identity = {
      publicKey: new Uint8Array(publicKey),
      privateKey: candidatePrivateKey,
    };
    const contact = exportSodiumContact(identity.publicKey);
    accepted = true;
    return { identity, contact };
  } finally {
    crypto.zero(passphraseBytes);
    crypto.zero(derivedKey);
    crypto.zero(decryptedPrivateKey);
    if (!accepted) {
      crypto.zero(candidatePrivateKey);
    }
  }
}
