import { utf8 } from "../../../experiments/milestone-1/src/bytes.js";
import { relationshipDigestInput } from "../../../experiments/milestone-1/src/relationship-digest-input.js";

export function bytesToLowerHex(bytes) {
  if (!(bytes instanceof Uint8Array)) {
    throw new TypeError("relationship digest must be bytes");
  }
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

export function groupFullHex(hex) {
  if (!/^[0-9a-f]{64}$/u.test(hex)) {
    throw new Error("relationship comparison must be 64 lowercase hex digits");
  }
  return hex.match(/.{8}/gu).join(" ");
}

export async function deriveRelationshipFingerprint(
  firstContact,
  secondContact,
) {
  const input = relationshipDigestInput(
    utf8(firstContact, "first public contact"),
    utf8(secondContact, "second public contact"),
  );
  const digest = new Uint8Array(
    await globalThis.crypto.subtle.digest("SHA-256", input),
  );
  const hex = bytesToLowerHex(digest);
  return Object.freeze({
    bytes: digest,
    hex,
    groupedHex: groupFullHex(hex),
  });
}
