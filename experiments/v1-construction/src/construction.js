import sodium from "libsodium-wrappers-sumo";
import {
  cloneBytes,
  concatBytes,
  decodeParts,
  decodeU32,
  encodeParts,
  encodeU32,
  equalBytes,
  text,
  utf8,
} from "./bytes.js";

export const SPIKE_WARNING =
  "CIPHERBOOK CONSTRUCTION SPIKE — UNSTABLE — SYNTHETIC DATA ONLY";
export const CANDIDATE_SEALED = "sealed-box-plus-signature";
export const CANDIDATE_STATIC = "static-box-plus-signature";

const SIGNATURE_DOMAIN = utf8("CIPHERBOOK-CONSTRUCTION-SPIKE-SIGNATURE");
const SPIKE_MODEL = utf8("unstable-model-a");
export const MAX_PAYLOAD_BYTES = 65_536;
export const MAX_SPIKE_CIPHERTEXT_BYTES = MAX_PAYLOAD_BYTES + 1_024;
const EXPECTED_CONTEXT_PARTS = 7;

async function ready() {
  await sodium.ready;
}

function checkedBytes(value, length, name) {
  if (!(value instanceof Uint8Array) || value.length !== length) {
    throw new Error(`invalid ${name}`);
  }
  return value;
}

function publicContact(identity) {
  return {
    encryptionPublicKey: cloneBytes(identity.encryptionPublicKey),
    signingPublicKey: cloneBytes(identity.signingPublicKey),
  };
}

export async function generateDisposableIdentity() {
  await ready();
  const encryption = sodium.crypto_box_keypair();
  const signing = sodium.crypto_sign_keypair();
  return {
    encryptionPublicKey: cloneBytes(encryption.publicKey),
    encryptionPrivateKey: cloneBytes(encryption.privateKey),
    signingPublicKey: cloneBytes(signing.publicKey),
    signingPrivateKey: cloneBytes(signing.privateKey),
  };
}

export function getPublicContact(identity) {
  return publicContact(identity);
}

function encodeSignedContext(senderContact, recipientContact, payload) {
  checkedBytes(
    senderContact.encryptionPublicKey,
    sodium.crypto_box_PUBLICKEYBYTES,
    "sender encryption key",
  );
  checkedBytes(
    senderContact.signingPublicKey,
    sodium.crypto_sign_PUBLICKEYBYTES,
    "sender signing key",
  );
  checkedBytes(
    recipientContact.encryptionPublicKey,
    sodium.crypto_box_PUBLICKEYBYTES,
    "recipient encryption key",
  );
  checkedBytes(
    recipientContact.signingPublicKey,
    sodium.crypto_sign_PUBLICKEYBYTES,
    "recipient signing key",
  );
  if (!(payload instanceof Uint8Array) || payload.length > MAX_PAYLOAD_BYTES) {
    throw new Error("invalid synthetic payload");
  }

  return encodeParts([
    SIGNATURE_DOMAIN,
    SPIKE_MODEL,
    senderContact.encryptionPublicKey,
    senderContact.signingPublicKey,
    recipientContact.encryptionPublicKey,
    recipientContact.signingPublicKey,
    payload,
  ]);
}

function decodeSignedContext(bytes) {
  const [
    domain,
    model,
    senderEncryptionPublicKey,
    senderSigningPublicKey,
    recipientEncryptionPublicKey,
    recipientSigningPublicKey,
    payload,
  ] = decodeParts(bytes, EXPECTED_CONTEXT_PARTS);

  if (
    !equalBytes(domain, SIGNATURE_DOMAIN) ||
    !equalBytes(model, SPIKE_MODEL)
  ) {
    throw new Error("signed context belongs to another domain");
  }
  checkedBytes(
    senderEncryptionPublicKey,
    sodium.crypto_box_PUBLICKEYBYTES,
    "signed sender encryption key",
  );
  checkedBytes(
    senderSigningPublicKey,
    sodium.crypto_sign_PUBLICKEYBYTES,
    "signed sender signing key",
  );
  checkedBytes(
    recipientEncryptionPublicKey,
    sodium.crypto_box_PUBLICKEYBYTES,
    "signed recipient encryption key",
  );
  checkedBytes(
    recipientSigningPublicKey,
    sodium.crypto_sign_PUBLICKEYBYTES,
    "signed recipient signing key",
  );
  if (payload.length > MAX_PAYLOAD_BYTES) {
    throw new Error("signed payload is oversized");
  }

  return {
    senderContact: {
      encryptionPublicKey: senderEncryptionPublicKey,
      signingPublicKey: senderSigningPublicKey,
    },
    recipientContact: {
      encryptionPublicKey: recipientEncryptionPublicKey,
      signingPublicKey: recipientSigningPublicKey,
    },
    payload,
  };
}

export async function createSignedPacket(
  senderIdentity,
  recipientContact,
  plaintext,
) {
  await ready();
  if (typeof plaintext !== "string") {
    throw new Error("synthetic plaintext must be a string");
  }
  const payload = utf8(plaintext);
  const context = encodeSignedContext(
    publicContact(senderIdentity),
    recipientContact,
    payload,
  );
  const signature = sodium.crypto_sign_detached(
    context,
    checkedBytes(
      senderIdentity.signingPrivateKey,
      sodium.crypto_sign_SECRETKEYBYTES,
      "sender signing private key",
    ),
  );
  return concatBytes(encodeU32(context.length), context, signature);
}

function parseSignedPacket(packet) {
  if (
    !(packet instanceof Uint8Array) ||
    packet.length < 4 + sodium.crypto_sign_BYTES
  ) {
    throw new Error("signed packet is truncated");
  }
  const contextLength = decodeU32(packet, 0);
  const signatureOffset = 4 + contextLength;
  if (signatureOffset + sodium.crypto_sign_BYTES !== packet.length) {
    throw new Error("signed packet length is invalid");
  }
  return {
    context: packet.slice(4, signatureOffset),
    signature: packet.slice(signatureOffset),
  };
}

function assertExpectedContact(actual, expected, role) {
  if (
    !equalBytes(actual.encryptionPublicKey, expected.encryptionPublicKey) ||
    !equalBytes(actual.signingPublicKey, expected.signingPublicKey)
  ) {
    throw new Error(`${role} contact mismatch`);
  }
}

async function encryptPacket(
  candidate,
  packet,
  senderIdentity,
  recipientContact,
) {
  await ready();
  checkedBytes(
    recipientContact.encryptionPublicKey,
    sodium.crypto_box_PUBLICKEYBYTES,
    "recipient encryption public key",
  );
  if (candidate === CANDIDATE_SEALED) {
    return {
      candidate,
      ciphertext: cloneBytes(
        sodium.crypto_box_seal(packet, recipientContact.encryptionPublicKey),
      ),
    };
  }
  if (candidate === CANDIDATE_STATIC) {
    checkedBytes(
      senderIdentity.encryptionPrivateKey,
      sodium.crypto_box_SECRETKEYBYTES,
      "sender encryption private key",
    );
    const nonce = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES);
    return {
      candidate,
      nonce: cloneBytes(nonce),
      ciphertext: cloneBytes(
        sodium.crypto_box_easy(
          packet,
          nonce,
          recipientContact.encryptionPublicKey,
          senderIdentity.encryptionPrivateKey,
        ),
      ),
    };
  }
  throw new Error("unknown construction-spike candidate");
}

export async function sealSyntheticText(
  candidate,
  senderIdentity,
  recipientContact,
  plaintext,
) {
  const packet = await createSignedPacket(
    senderIdentity,
    recipientContact,
    plaintext,
  );
  return encryptPacket(candidate, packet, senderIdentity, recipientContact);
}

export async function resealPacketForProbe(
  candidate,
  packet,
  senderIdentity,
  recipientContact,
) {
  return encryptPacket(candidate, packet, senderIdentity, recipientContact);
}

export async function decryptPacketForProbe(
  envelope,
  recipientIdentity,
  expectedSenderContact,
) {
  await ready();
  if (
    envelope?.candidate !== CANDIDATE_SEALED &&
    envelope?.candidate !== CANDIDATE_STATIC
  ) {
    throw new Error("unknown construction-spike candidate");
  }
  if (
    !envelope ||
    !(envelope.ciphertext instanceof Uint8Array) ||
    envelope.ciphertext.length === 0 ||
    envelope.ciphertext.length > MAX_SPIKE_CIPHERTEXT_BYTES
  ) {
    throw new Error("invalid construction-spike ciphertext");
  }
  checkedBytes(
    recipientIdentity.encryptionPublicKey,
    sodium.crypto_box_PUBLICKEYBYTES,
    "recipient encryption public key",
  );
  checkedBytes(
    recipientIdentity.encryptionPrivateKey,
    sodium.crypto_box_SECRETKEYBYTES,
    "recipient encryption private key",
  );
  checkedBytes(
    recipientIdentity.signingPublicKey,
    sodium.crypto_sign_PUBLICKEYBYTES,
    "recipient signing public key",
  );
  checkedBytes(
    expectedSenderContact.encryptionPublicKey,
    sodium.crypto_box_PUBLICKEYBYTES,
    "expected sender encryption public key",
  );
  checkedBytes(
    expectedSenderContact.signingPublicKey,
    sodium.crypto_sign_PUBLICKEYBYTES,
    "expected sender signing public key",
  );
  if (envelope.candidate === CANDIDATE_SEALED) {
    if (envelope.nonce !== undefined) {
      throw new Error("sealed candidate has an unexpected nonce");
    }
    return cloneBytes(
      sodium.crypto_box_seal_open(
        envelope.ciphertext,
        recipientIdentity.encryptionPublicKey,
        recipientIdentity.encryptionPrivateKey,
      ),
    );
  }
  if (envelope.candidate === CANDIDATE_STATIC) {
    checkedBytes(
      envelope.nonce,
      sodium.crypto_box_NONCEBYTES,
      "static candidate nonce",
    );
    return cloneBytes(
      sodium.crypto_box_open_easy(
        envelope.ciphertext,
        envelope.nonce,
        expectedSenderContact.encryptionPublicKey,
        recipientIdentity.encryptionPrivateKey,
      ),
    );
  }
  throw new Error("unreachable construction-spike candidate");
}

export async function openSyntheticText(
  envelope,
  recipientIdentity,
  expectedSenderContact,
) {
  await ready();
  const packet = await decryptPacketForProbe(
    envelope,
    recipientIdentity,
    expectedSenderContact,
  );
  const { context, signature } = parseSignedPacket(packet);
  const decoded = decodeSignedContext(context);

  assertExpectedContact(decoded.senderContact, expectedSenderContact, "sender");
  assertExpectedContact(
    decoded.recipientContact,
    publicContact(recipientIdentity),
    "recipient",
  );
  if (
    !sodium.crypto_sign_verify_detached(
      signature,
      context,
      expectedSenderContact.signingPublicKey,
    )
  ) {
    throw new Error("transferable signature verification failed");
  }
  return text(decoded.payload);
}

export function disposeIdentity(identity) {
  if (!identity) {
    return;
  }
  for (const key of ["encryptionPrivateKey", "signingPrivateKey"]) {
    if (identity[key] instanceof Uint8Array) {
      sodium.memzero(identity[key]);
    }
  }
}
