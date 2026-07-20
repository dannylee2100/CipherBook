import {
  exportSodiumContact,
  generateSodiumIdentity,
  importSodiumContact,
  openSodiumText,
  sealSodiumText,
} from "../../milestone-1/src/sodium.js";

export const sodiumBrowserMode = Object.freeze({
  id: "sodium",
  label: "Sodium relationship experiment",
  senderMeaning:
    "This mode performs a recipient-local expected-sender key check. The recipient can forge a transcript that their own client accepts. It is not proof to a third party that the claimed sender authored the message.",
  compromiseMeaning:
    "Later disclosure of either party’s static private key can expose retained envelopes for this relationship.",

  async generateIdentity() {
    return generateSodiumIdentity();
  },

  exportContact(identity) {
    return exportSodiumContact(identity.publicKey);
  },

  importContact(contact) {
    const material = importSodiumContact(contact);
    return { material, text: exportSodiumContact(material) };
  },

  async seal(text, identity, counterparty) {
    return sealSodiumText(text, identity, counterparty.material);
  },

  async open(envelope, identity, counterparty) {
    if (!counterparty) {
      throw new Error("an expected sender contact is required");
    }
    return openSodiumText(envelope, identity, counterparty.material);
  },

  disposeIdentity(identity) {
    if (identity?.privateKey instanceof Uint8Array) {
      identity.privateKey.fill(0);
    }
    if (identity && typeof identity === "object") {
      identity.publicKey = null;
      identity.privateKey = null;
    }
  },
});
