export function createExperimentState(mode = "sodium") {
  return {
    mode,
    busy: false,
    identity: null,
    ownContact: "",
    contactDraft: "",
    counterparty: null,
    diagnosticRaw: "",
    comparisonConfirmed: false,
    sealPlaintext: "",
    generatedEnvelope: "",
    openEnvelope: "",
    openedPlaintext: "",
    identityStatus: "No temporary identity exists.",
    copyStatus: "",
    errors: {
      identity: "",
      contact: "",
      seal: "",
      open: "",
    },
  };
}

export function disposeExperimentState(state, modeAdapter) {
  if (state?.identity) {
    modeAdapter.disposeIdentity(state.identity);
  }

  if (state && typeof state === "object") {
    state.identity = null;
    state.ownContact = "";
    state.contactDraft = "";
    state.counterparty = null;
    state.diagnosticRaw = "";
    state.comparisonConfirmed = false;
    state.sealPlaintext = "";
    state.generatedEnvelope = "";
    state.openEnvelope = "";
    state.openedPlaintext = "";
    state.copyStatus = "";
    state.errors = { identity: "", contact: "", seal: "", open: "" };
  }
}

export function clearContactDependentState(state) {
  state.counterparty = null;
  state.diagnosticRaw = "";
  state.comparisonConfirmed = false;
  state.generatedEnvelope = "";
  state.openedPlaintext = "";
  state.errors.contact = "";
  state.errors.seal = "";
  state.errors.open = "";
}
