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
  state.errors = { identity: "", contact: "", seal: "", open: "" };
}
