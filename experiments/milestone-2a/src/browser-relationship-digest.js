import { relationshipDigestInput } from "../../milestone-1/src/relationship-digest-input.js";

function bytesToHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

export async function relationshipDiagnosticHex(firstContact, secondContact) {
  const input = relationshipDigestInput(firstContact, secondContact);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", input);
  return bytesToHex(new Uint8Array(digest));
}

export function groupDiagnostic(hex) {
  if (!/^[0-9a-f]{64}$/u.test(hex)) {
    throw new Error("relationship diagnostic must be 64 lowercase hex digits");
  }
  return hex.match(/.{1,8}/gu).join(" ");
}
