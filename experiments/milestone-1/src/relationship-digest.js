import { createHash } from "node:crypto";

import { relationshipDigestInput } from "./relationship-digest-input.js";

/**
 * Produces a full SHA-256 relationship diagnostic for UX experiments.
 *
 * This is deliberately not an encryption key, secret, emoji selection, final
 * fingerprint length, or protocol commitment.
 */
export function relationshipDigest(firstContact, secondContact) {
  return new Uint8Array(
    createHash("sha256")
      .update(relationshipDigestInput(firstContact, secondContact))
      .digest(),
  );
}

export function relationshipDigestHex(firstContact, secondContact) {
  return Buffer.from(relationshipDigest(firstContact, secondContact)).toString(
    "hex",
  );
}
