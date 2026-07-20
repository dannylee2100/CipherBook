import { createHash } from "node:crypto";

import {
  compareBytes,
  concatBytes,
  requireBytes,
  uint32be,
  utf8,
} from "./bytes.js";
import {
  MAX_PUBLIC_CONTACT_BYTES,
  RELATIONSHIP_DIGEST_LABEL,
  RELATIONSHIP_DIGEST_NOTICE,
} from "./constants.js";

const domainTag = utf8(
  `${RELATIONSHIP_DIGEST_LABEL}\u0000${RELATIONSHIP_DIGEST_NOTICE}\u0000`,
);

function validateContact(value, name) {
  const contact = requireBytes(value, name);
  if (contact.length === 0) {
    throw new Error(`${name} must not be empty`);
  }
  if (contact.length > MAX_PUBLIC_CONTACT_BYTES) {
    throw new RangeError(
      `${name} exceeds the ${MAX_PUBLIC_CONTACT_BYTES}-byte laboratory limit`,
    );
  }

  return contact;
}

/**
 * Produces a full SHA-256 relationship diagnostic for UX experiments.
 *
 * This is deliberately not an encryption key, secret, emoji selection, final
 * fingerprint length, or protocol commitment.
 */
export function relationshipDigest(firstContact, secondContact) {
  const first = validateContact(firstContact, "first contact");
  const second = validateContact(secondContact, "second contact");
  const [lower, higher] =
    compareBytes(first, second) <= 0 ? [first, second] : [second, first];
  const input = concatBytes(
    domainTag,
    uint32be(lower.length),
    lower,
    uint32be(higher.length),
    higher,
  );

  return new Uint8Array(createHash("sha256").update(input).digest());
}

export function relationshipDigestHex(firstContact, secondContact) {
  return Buffer.from(relationshipDigest(firstContact, secondContact)).toString(
    "hex",
  );
}
