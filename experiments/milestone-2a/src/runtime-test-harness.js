import { utf8 } from "../../milestone-1/src/bytes.js";
import {
  exportAgeContact,
  generateAgeIdentity,
  openAgeText,
  sealAgeText,
} from "../../milestone-1/src/age.js";
import {
  exportSodiumContact,
  forgeSodiumAsExpectedSender,
  generateSodiumIdentity,
  importSodiumContact,
  openSodiumText,
  sealSodiumText,
} from "../../milestone-1/src/sodium.js";

let sodiumRecipientIdentity;
let ageRecipientIdentity;

export function createSodiumRecipientForTest() {
  sodiumRecipientIdentity = generateSodiumIdentity();
  return exportSodiumContact(sodiumRecipientIdentity.publicKey);
}

export function openSodiumForTest(envelope, expectedSenderContact) {
  if (!sodiumRecipientIdentity) {
    throw new Error("test recipient identity is missing");
  }
  return openSodiumText(
    envelope,
    sodiumRecipientIdentity,
    importSodiumContact(expectedSenderContact),
  );
}

export function sealSodiumForTest(text, recipientContact) {
  const sender = generateSodiumIdentity();
  return {
    senderContact: exportSodiumContact(sender.publicKey),
    envelope: sealSodiumText(
      text,
      sender,
      importSodiumContact(recipientContact),
    ),
  };
}

export function sodiumRecipientForgeProbe() {
  const claimedSender = generateSodiumIdentity();
  const recipient = generateSodiumIdentity();
  const envelope = forgeSodiumAsExpectedSender(
    utf8("synthetic browser recipient-forged transcript"),
    recipient,
    claimedSender.publicKey,
  );
  return openSodiumText(envelope, recipient, claimedSender.publicKey);
}

export function sodiumOutsiderRelabelProbe() {
  const alice = generateSodiumIdentity();
  const bob = generateSodiumIdentity();
  const outsider = generateSodiumIdentity();
  const value = JSON.parse(
    sealSodiumText(
      "synthetic outsider browser transcript",
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

export async function createAgeRecipientForTest() {
  ageRecipientIdentity = await generateAgeIdentity();
  return exportAgeContact(ageRecipientIdentity);
}

export async function openAgeForTest(envelope) {
  if (!ageRecipientIdentity) {
    throw new Error("test age identity is missing");
  }
  return openAgeText(envelope, ageRecipientIdentity);
}

export async function sealAgeForTest(text, recipientContact) {
  return sealAgeText(text, recipientContact);
}

export async function ageOutsiderProbe() {
  const recipient = await generateAgeIdentity();
  const envelope = await sealAgeText(
    "synthetic outsider-created browser envelope",
    exportAgeContact(recipient),
  );
  return {
    envelope,
    opened: await openAgeText(envelope, recipient),
  };
}
