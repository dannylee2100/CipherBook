import sodium from "libsodium-wrappers-sumo";

import {
  base64urlDecode,
  base64urlEncode,
  boundedBytes,
  decodeUtf8,
  requireBytes,
  utf8,
} from "./bytes.js";
import {
  LAB_WARNING,
  MAX_PLAINTEXT_BYTES,
  MAX_SODIUM_WRAPPER_BYTES,
  SODIUM_CONTACT_LABEL,
  SODIUM_LAB_LABEL,
} from "./constants.js";

await sodium.ready;

const PUBLIC_KEY_BYTES = sodium.crypto_box_PUBLICKEYBYTES;
const PRIVATE_KEY_BYTES = sodium.crypto_box_SECRETKEYBYTES;
const NONCE_BYTES = sodium.crypto_box_NONCEBYTES;

function validateIdentity(identity, name = "identity") {
  if (identity === null || typeof identity !== "object") {
    throw new TypeError(`${name} must be an object`);
  }
  const publicKey = requireBytes(identity.publicKey, `${name} public key`);
  const privateKey = requireBytes(identity.privateKey, `${name} private key`);
  if (publicKey.length !== PUBLIC_KEY_BYTES) {
    throw new Error(`${name} public key must be ${PUBLIC_KEY_BYTES} bytes`);
  }
  if (privateKey.length !== PRIVATE_KEY_BYTES) {
    throw new Error(`${name} private key must be ${PRIVATE_KEY_BYTES} bytes`);
  }

  return { publicKey, privateKey };
}

function validatePublicKey(publicKey, name = "public key") {
  const bytes = requireBytes(publicKey, name);
  if (bytes.length !== PUBLIC_KEY_BYTES) {
    throw new Error(`${name} must be ${PUBLIC_KEY_BYTES} bytes`);
  }

  return bytes;
}

function exactObjectKeys(value, expectedKeys, name) {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) {
    throw new Error(`${name} must be a plain object`);
  }

  const actual = Object.keys(value).sort();
  const expected = [...expectedKeys].sort();
  if (
    actual.length !== expected.length ||
    actual.some((key, index) => key !== expected[index])
  ) {
    throw new Error(`${name} has unexpected or missing fields`);
  }
}

export function generateSodiumIdentity() {
  const keypair = sodium.crypto_box_keypair();
  return {
    publicKey: new Uint8Array(keypair.publicKey),
    privateKey: new Uint8Array(keypair.privateKey),
  };
}

export function exportSodiumContact(publicKey) {
  return `${SODIUM_CONTACT_LABEL}:${base64urlEncode(
    validatePublicKey(publicKey),
  )}`;
}

export function importSodiumContact(contact) {
  if (typeof contact !== "string") {
    throw new TypeError("contact must be a string");
  }
  const prefix = `${SODIUM_CONTACT_LABEL}:`;
  if (!contact.startsWith(prefix)) {
    throw new Error(`contact must start with ${prefix}`);
  }

  return base64urlDecode(
    contact.slice(prefix.length),
    PUBLIC_KEY_BYTES,
    "contact key",
  );
}

function makeWrapper(senderPublicKey, recipientPublicKey, nonce, ciphertext) {
  return JSON.stringify({
    lab: SODIUM_LAB_LABEL,
    warning: "UNSTABLE EXPERIMENT; NOT FOR REAL SECRETS",
    sender: exportSodiumContact(senderPublicKey),
    recipient: exportSodiumContact(recipientPublicKey),
    nonce: base64urlEncode(nonce),
    ciphertext: base64urlEncode(ciphertext),
  });
}

export function parseSodiumEnvelope(serializedEnvelope) {
  if (typeof serializedEnvelope !== "string") {
    throw new TypeError("experimental envelope must be a string");
  }
  if (utf8(serializedEnvelope).length > MAX_SODIUM_WRAPPER_BYTES) {
    throw new RangeError(
      `experimental envelope exceeds the ${MAX_SODIUM_WRAPPER_BYTES}-byte laboratory limit`,
    );
  }

  let value;
  try {
    value = JSON.parse(serializedEnvelope);
  } catch (error) {
    throw new Error("experimental envelope is not valid JSON", {
      cause: error,
    });
  }
  exactObjectKeys(
    value,
    ["lab", "warning", "sender", "recipient", "nonce", "ciphertext"],
    "experimental envelope",
  );
  if (value.lab !== SODIUM_LAB_LABEL) {
    throw new Error("unexpected experimental envelope label");
  }
  if (value.warning !== "UNSTABLE EXPERIMENT; NOT FOR REAL SECRETS") {
    throw new Error("unexpected experimental warning field");
  }

  const senderPublicKey = importSodiumContact(value.sender);
  const recipientPublicKey = importSodiumContact(value.recipient);
  const nonce = base64urlDecode(value.nonce, NONCE_BYTES, "nonce");
  const ciphertext = base64urlDecode(value.ciphertext, undefined, "ciphertext");
  if (ciphertext.length < sodium.crypto_box_MACBYTES) {
    throw new Error("ciphertext is truncated");
  }
  if (ciphertext.length > MAX_PLAINTEXT_BYTES + sodium.crypto_box_MACBYTES) {
    throw new RangeError("ciphertext exceeds the laboratory limit");
  }

  return { senderPublicKey, recipientPublicKey, nonce, ciphertext };
}

export function sealSodiumBytes(plaintext, senderIdentity, recipientPublicKey) {
  const message = boundedBytes(plaintext, MAX_PLAINTEXT_BYTES, "plaintext");
  const sender = validateIdentity(senderIdentity, "sender identity");
  const recipient = validatePublicKey(
    recipientPublicKey,
    "recipient public key",
  );
  const nonce = sodium.randombytes_buf(NONCE_BYTES);
  const ciphertext = sodium.crypto_box_easy(
    message,
    nonce,
    recipient,
    sender.privateKey,
  );

  return {
    nonce: new Uint8Array(nonce),
    ciphertext: new Uint8Array(ciphertext),
    serialized: makeWrapper(sender.publicKey, recipient, nonce, ciphertext),
  };
}

export function sealSodiumText(text, senderIdentity, recipientPublicKey) {
  return sealSodiumBytes(
    utf8(text, "plaintext"),
    senderIdentity,
    recipientPublicKey,
  ).serialized;
}

export function openSodiumBytes(
  serializedEnvelope,
  recipientIdentity,
  expectedSenderPublicKey,
) {
  const envelope = parseSodiumEnvelope(serializedEnvelope);
  const recipient = validateIdentity(recipientIdentity, "recipient identity");
  const expectedSender = validatePublicKey(
    expectedSenderPublicKey,
    "expected sender public key",
  );

  if (!sodium.memcmp(envelope.recipientPublicKey, recipient.publicKey)) {
    throw new Error("experimental envelope names a different recipient");
  }
  if (!sodium.memcmp(envelope.senderPublicKey, expectedSender)) {
    throw new Error("experimental envelope names a different expected sender");
  }

  let plaintext;
  try {
    plaintext = sodium.crypto_box_open_easy(
      envelope.ciphertext,
      envelope.nonce,
      expectedSender,
      recipient.privateKey,
    );
  } catch (error) {
    throw new Error("ciphertext authentication failed", { cause: error });
  }

  if (!plaintext) {
    throw new Error("ciphertext authentication failed");
  }

  return new Uint8Array(plaintext);
}

export function openSodiumText(
  serializedEnvelope,
  recipientIdentity,
  expectedSenderPublicKey,
) {
  return decodeUtf8(
    openSodiumBytes(
      serializedEnvelope,
      recipientIdentity,
      expectedSenderPublicKey,
    ),
    "decrypted plaintext",
  );
}

/**
 * Demonstrates recipient forgeability without implementing cryptographic
 * internals. Bob uses the high-level crypto_box operation with Alice's public
 * key and Bob's private key, then labels the transcript Alice -> Bob. Bob's
 * normal opener derives the same shared key and accepts it.
 */
export function forgeSodiumAsExpectedSender(
  plaintext,
  recipientIdentity,
  claimedSenderPublicKey,
) {
  const message = boundedBytes(plaintext, MAX_PLAINTEXT_BYTES, "plaintext");
  const recipient = validateIdentity(recipientIdentity, "recipient identity");
  const claimedSender = validatePublicKey(
    claimedSenderPublicKey,
    "claimed sender public key",
  );
  const nonce = sodium.randombytes_buf(NONCE_BYTES);
  const ciphertext = sodium.crypto_box_easy(
    message,
    nonce,
    claimedSender,
    recipient.privateKey,
  );

  return makeWrapper(claimedSender, recipient.publicKey, nonce, ciphertext);
}

/**
 * Models disclosure of the original sender's static private key. A holder of
 * that key and the recipient's public contact can derive the same shared key
 * and open a captured transcript. This is a laboratory probe, not a normal UI.
 */
export function openSodiumAfterSenderKeyDisclosure(
  serializedEnvelope,
  disclosedSenderIdentity,
  recipientPublicKey,
) {
  const envelope = parseSodiumEnvelope(serializedEnvelope);
  const sender = validateIdentity(disclosedSenderIdentity, "disclosed sender");
  const recipient = validatePublicKey(
    recipientPublicKey,
    "recipient public key",
  );
  if (
    !sodium.memcmp(envelope.senderPublicKey, sender.publicKey) ||
    !sodium.memcmp(envelope.recipientPublicKey, recipient)
  ) {
    throw new Error("captured transcript contacts do not match disclosed keys");
  }

  let plaintext;
  try {
    plaintext = sodium.crypto_box_open_easy(
      envelope.ciphertext,
      envelope.nonce,
      recipient,
      sender.privateKey,
    );
  } catch (error) {
    throw new Error("captured ciphertext could not be opened", {
      cause: error,
    });
  }
  if (!plaintext) {
    throw new Error("captured ciphertext could not be opened");
  }

  return new Uint8Array(plaintext);
}

export const sodiumExperiment = Object.freeze({
  label: SODIUM_LAB_LABEL,
  warning: LAB_WARNING,
  rawOverheadBytes: sodium.crypto_box_MACBYTES,
  publicKeyBytes: PUBLIC_KEY_BYTES,
  nonceBytes: NONCE_BYTES,
});
