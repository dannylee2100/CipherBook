import { utf8 } from "../../../experiments/milestone-1/src/bytes.js";
import {
  exportSodiumContact,
  forgeSodiumAsExpectedSender,
  generateSodiumIdentity,
  openSodiumText,
  sealSodiumText,
} from "../../../experiments/milestone-1/src/sodium.js";

export function recipientForgeProbe() {
  const claimedSender = generateSodiumIdentity();
  const recipient = generateSodiumIdentity();
  const envelope = forgeSodiumAsExpectedSender(
    utf8("synthetic Alpha 0 recipient-forged transcript"),
    recipient,
    claimedSender.publicKey,
  );
  return openSodiumText(envelope, recipient, claimedSender.publicKey);
}

export function outsiderRelabelProbe() {
  const alice = generateSodiumIdentity();
  const bob = generateSodiumIdentity();
  const outsider = generateSodiumIdentity();
  const value = JSON.parse(
    sealSodiumText(
      "synthetic Alpha 0 outsider transcript",
      outsider,
      bob.publicKey,
    ),
  );
  value.sender = exportSodiumContact(alice.publicKey);
  try {
    openSodiumText(JSON.stringify(value), bob, alice.publicKey);
    return false;
  } catch {
    return true;
  }
}
