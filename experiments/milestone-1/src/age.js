import * as age from "age-encryption";

import { boundedBytes, decodeUtf8, requireBytes, utf8 } from "./bytes.js";
import {
  MAX_AGE_ARMOR_BYTES,
  MAX_PLAINTEXT_BYTES,
  MAX_PUBLIC_CONTACT_BYTES,
} from "./constants.js";

export const AGE_SENDER_NOTICE =
  "Encrypted for this recipient. The sender is not cryptographically verified by this envelope.";

function validateAgeIdentity(identity) {
  if (
    identity === null ||
    typeof identity !== "object" ||
    typeof identity.secret !== "string" ||
    typeof identity.recipient !== "string"
  ) {
    throw new TypeError(
      "age identity must contain a secret and recipient string",
    );
  }
  if (!identity.secret.startsWith("AGE-SECRET-KEY-1")) {
    throw new Error("age identity is not a native X25519 identity");
  }

  return identity;
}

export async function generateAgeIdentity() {
  const secret = await age.generateIdentity();
  const recipient = await age.identityToRecipient(secret);
  return { secret, recipient };
}

export function exportAgeContact(identityOrRecipient) {
  const recipient =
    typeof identityOrRecipient === "string"
      ? identityOrRecipient
      : validateAgeIdentity(identityOrRecipient).recipient;
  return importAgeContact(recipient);
}

export function importAgeContact(contact) {
  if (typeof contact !== "string") {
    throw new TypeError("age public contact must be a string");
  }
  if (
    contact.length === 0 ||
    utf8(contact).length > MAX_PUBLIC_CONTACT_BYTES ||
    contact.trim() !== contact ||
    contact.includes("\n") ||
    !contact.startsWith("age1")
  ) {
    throw new Error("age public contact must be one native age recipient line");
  }

  try {
    const validator = new age.Encrypter();
    validator.addRecipient(contact);
  } catch (error) {
    throw new Error("age public contact is not a supported native recipient", {
      cause: error,
    });
  }

  return contact;
}

export async function sealAgeBytes(plaintext, recipientContact) {
  const message = boundedBytes(plaintext, MAX_PLAINTEXT_BYTES, "plaintext");
  const recipient = importAgeContact(recipientContact);
  const encrypter = new age.Encrypter();
  encrypter.addRecipient(recipient);

  return new Uint8Array(await encrypter.encrypt(message));
}

export function armorAgeEnvelope(binaryEnvelope) {
  const binary = requireBytes(binaryEnvelope, "native age envelope");
  if (binary.length > MAX_AGE_ARMOR_BYTES) {
    throw new RangeError("native age envelope exceeds the laboratory limit");
  }

  const armored = age.armor.encode(binary);
  if (utf8(armored).length > MAX_AGE_ARMOR_BYTES) {
    throw new RangeError("native age armor exceeds the laboratory limit");
  }

  return armored;
}

export function dearmorAgeEnvelope(armoredEnvelope) {
  if (typeof armoredEnvelope !== "string") {
    throw new TypeError("native age armor must be a string");
  }
  if (utf8(armoredEnvelope).length > MAX_AGE_ARMOR_BYTES) {
    throw new RangeError("native age armor exceeds the laboratory limit");
  }

  try {
    return new Uint8Array(age.armor.decode(armoredEnvelope));
  } catch (error) {
    throw new Error("native age armor is malformed", { cause: error });
  }
}

export async function sealAgeText(text, recipientContact) {
  return armorAgeEnvelope(
    await sealAgeBytes(utf8(text, "plaintext"), recipientContact),
  );
}

export async function openAgeBytes(binaryEnvelope, identity) {
  const binary = requireBytes(binaryEnvelope, "native age envelope");
  if (binary.length === 0 || binary.length > MAX_AGE_ARMOR_BYTES) {
    throw new RangeError("native age envelope is empty or exceeds the limit");
  }
  const validatedIdentity = validateAgeIdentity(identity);
  const decrypter = new age.Decrypter();
  decrypter.addIdentity(validatedIdentity.secret);

  let plaintext;
  try {
    plaintext = new Uint8Array(await decrypter.decrypt(binary));
  } catch (error) {
    throw new Error("native age decryption failed", { cause: error });
  }
  if (plaintext.length > MAX_PLAINTEXT_BYTES) {
    throw new RangeError("decrypted plaintext exceeds the laboratory limit");
  }

  return plaintext;
}

export async function openAgeArmor(armoredEnvelope, identity) {
  return openAgeBytes(dearmorAgeEnvelope(armoredEnvelope), identity);
}

export async function openAgeText(armoredEnvelope, identity) {
  return decodeUtf8(
    await openAgeArmor(armoredEnvelope, identity),
    "decrypted plaintext",
  );
}
