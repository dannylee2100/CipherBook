import {
  exportAgeContact,
  generateAgeIdentity,
  importAgeContact,
  openAgeText,
  sealAgeText,
} from "../../milestone-1/src/age.js";

export const ageBrowserMode = Object.freeze({
  id: "age",
  label: "Native age experiment",
  senderMeaning:
    "Encrypted for this recipient. The sender is not cryptographically verified by this envelope.",
  compromiseMeaning:
    "Anyone with this recipient’s public age contact can create an envelope the recipient opens. Later compromise of the recipient identity can expose retained envelopes.",

  async generateIdentity() {
    return generateAgeIdentity();
  },

  exportContact(identity) {
    return exportAgeContact(identity);
  },

  importContact(contact) {
    const text = importAgeContact(contact);
    return { material: text, text };
  },

  async seal(text, _identity, counterparty) {
    return sealAgeText(text, counterparty.material);
  },

  async open(envelope, identity) {
    return openAgeText(envelope, identity);
  },

  disposeIdentity(identity) {
    if (identity && typeof identity === "object") {
      identity.secret = null;
      identity.recipient = null;
    }
  },
});
