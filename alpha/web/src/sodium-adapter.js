import { utf8 } from "../../../experiments/milestone-1/src/bytes.js";
import { MAX_PUBLIC_CONTACT_BYTES } from "../../../experiments/milestone-1/src/constants.js";
import {
  exportSodiumContact,
  generateSodiumIdentity,
  importSodiumContact,
  openSodiumText,
  sealSodiumText,
} from "../../../experiments/milestone-1/src/sodium.js";

function importBoundedContact(contact) {
  if (typeof contact !== "string") {
    throw new TypeError("contact must be text");
  }
  if (utf8(contact).length > MAX_PUBLIC_CONTACT_BYTES) {
    throw new RangeError("contact exceeds the experimental size limit");
  }
  const material = importSodiumContact(contact);
  return Object.freeze({ material, text: exportSodiumContact(material) });
}

export const sodiumAlpha = Object.freeze({
  async generateIdentity() {
    return generateSodiumIdentity();
  },

  exportContact(identity) {
    return exportSodiumContact(identity.publicKey);
  },

  importContact(contact) {
    return importBoundedContact(contact);
  },

  async seal(text, identity, counterparty) {
    return sealSodiumText(text, identity, counterparty.material);
  },

  async open(envelope, identity, counterparty) {
    if (!counterparty) {
      throw new Error("an expected counterparty contact is required");
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
