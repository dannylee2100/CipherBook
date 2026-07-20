export function createAlphaState() {
  return {
    busy: false,
    identity: null,
    ownContact: "",
    contactDraft: "",
    counterparty: null,
    relationshipHex: "",
    emojiItems: [],
    comparisonConfirmed: false,
    sealPlaintext: "",
    generatedEnvelope: "",
    openEnvelope: "",
    openedPlaintext: "",
    status: "No temporary identity exists.",
    openStatus: "",
    errors: {
      identity: "",
      identityImport: "",
      identityExport: "",
      contact: "",
      seal: "",
      open: "",
    },
  };
}

export function clearTrustDependentOutput(state) {
  state.generatedEnvelope = "";
  state.openEnvelope = "";
  state.openedPlaintext = "";
  state.openStatus = "";
  state.errors.seal = "";
  state.errors.open = "";
}

export function clearVerificationState(state) {
  state.relationshipHex = "";
  state.emojiItems = [];
  state.comparisonConfirmed = false;
  clearTrustDependentOutput(state);
}

export function replaceCounterparty(state, counterparty) {
  clearVerificationState(state);
  state.counterparty = counterparty;
}

export function replaceIdentity(state, restored, adapter) {
  if (
    !restored ||
    !restored.identity ||
    typeof restored.contact !== "string" ||
    restored.contact.length === 0
  ) {
    throw new Error("a complete restored identity is required");
  }

  if (state.identity) {
    adapter.disposeIdentity(state.identity);
  }
  state.identity = restored.identity;
  state.ownContact = restored.contact;
  state.contactDraft = "";
  state.counterparty = null;
  state.relationshipHex = "";
  state.emojiItems = [];
  state.comparisonConfirmed = false;
  state.sealPlaintext = "";
  state.generatedEnvelope = "";
  state.openEnvelope = "";
  state.openedPlaintext = "";
  state.openStatus = "";
  state.errors = {
    identity: "",
    identityImport: "",
    identityExport: "",
    contact: "",
    seal: "",
    open: "",
  };
  state.status =
    "Encrypted identity file restored. Import the counterparty contact and compare the full hexadecimal value again.";
}

export function disposeAlphaState(state, adapter) {
  if (state?.identity) {
    adapter.disposeIdentity(state.identity);
  }
  if (!state || typeof state !== "object") {
    return;
  }
  state.identity = null;
  state.ownContact = "";
  state.contactDraft = "";
  state.counterparty = null;
  state.relationshipHex = "";
  state.emojiItems = [];
  state.comparisonConfirmed = false;
  state.sealPlaintext = "";
  state.generatedEnvelope = "";
  state.openEnvelope = "";
  state.openedPlaintext = "";
  state.openStatus = "";
  state.status = "No temporary identity exists.";
  state.errors = {
    identity: "",
    identityImport: "",
    identityExport: "",
    contact: "",
    seal: "",
    open: "",
  };
}
