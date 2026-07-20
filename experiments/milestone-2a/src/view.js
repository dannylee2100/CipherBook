import { MAX_PLAINTEXT_BYTES } from "../../milestone-1/src/constants.js";
import { utf8 } from "../../milestone-1/src/bytes.js";
import { groupDiagnostic } from "./browser-relationship-digest.js";

const ids = [
  "mode-select",
  "generate-identity",
  "identity-status",
  "identity-error",
  "own-contact",
  "copy-own-contact",
  "contact-input",
  "import-contact",
  "active-contact",
  "contact-error",
  "relationship-diagnostic",
  "comparison-confirmed",
  "seal-plaintext",
  "seal-byte-count",
  "fill-synthetic",
  "seal-button",
  "seal-error",
  "sealed-envelope",
  "copy-envelope",
  "open-envelope",
  "open-button",
  "open-error",
  "opened-plaintext",
  "copy-plaintext",
  "clear-all",
  "construction-name",
  "sender-meaning",
  "compromise-meaning",
  "copy-status",
];

export const elements = Object.fromEntries(
  ids.map((id) => {
    const element = document.getElementById(id);
    if (!element) {
      throw new Error(`missing laboratory element: ${id}`);
    }
    return [id, element];
  }),
);

function setValue(element, value) {
  if (element.value !== value) {
    element.value = value;
  }
}

export function render(state, modeAdapter) {
  const plaintextBytes = utf8(state.sealPlaintext).length;
  const identityReady = Boolean(state.identity);
  const contactReady = Boolean(state.counterparty);
  const envelopeReady = state.openEnvelope.length > 0;

  elements["mode-select"].value = state.mode;
  elements["mode-select"].disabled = state.busy;
  elements["generate-identity"].disabled = state.busy;
  elements["identity-status"].textContent = state.identityStatus;
  elements["identity-error"].textContent = state.errors.identity;
  setValue(elements["own-contact"], state.ownContact);
  elements["copy-own-contact"].disabled =
    state.busy || state.ownContact.length === 0;

  setValue(elements["contact-input"], state.contactDraft);
  elements["contact-input"].disabled = state.busy || !identityReady;
  elements["import-contact"].disabled =
    state.busy || !identityReady || state.contactDraft.length === 0;
  elements["import-contact"].textContent = contactReady
    ? "Replace counterparty contact"
    : "Import counterparty contact";
  elements["active-contact"].textContent = contactReady
    ? state.counterparty.text
    : "No counterparty contact imported.";
  elements["contact-error"].textContent = state.errors.contact;

  setValue(
    elements["relationship-diagnostic"],
    state.diagnosticRaw ? groupDiagnostic(state.diagnosticRaw) : "",
  );
  elements["comparison-confirmed"].disabled =
    state.busy || state.diagnosticRaw.length === 0;
  elements["comparison-confirmed"].checked = state.comparisonConfirmed;

  setValue(elements["seal-plaintext"], state.sealPlaintext);
  elements["seal-plaintext"].disabled = state.busy;
  elements["seal-byte-count"].textContent =
    `${plaintextBytes} / ${MAX_PLAINTEXT_BYTES} UTF-8 bytes`;
  elements["fill-synthetic"].disabled = state.busy;
  elements["seal-button"].disabled =
    state.busy ||
    !identityReady ||
    !contactReady ||
    !state.comparisonConfirmed ||
    plaintextBytes > MAX_PLAINTEXT_BYTES;
  elements["seal-error"].textContent = state.errors.seal;
  setValue(elements["sealed-envelope"], state.generatedEnvelope);
  elements["copy-envelope"].disabled =
    state.busy || state.generatedEnvelope.length === 0;

  setValue(elements["open-envelope"], state.openEnvelope);
  elements["open-envelope"].disabled = state.busy;
  elements["open-button"].disabled =
    state.busy ||
    !identityReady ||
    !envelopeReady ||
    (state.mode === "sodium" && !contactReady);
  elements["open-error"].textContent = state.errors.open;
  elements["opened-plaintext"].textContent = state.openedPlaintext;
  elements["copy-plaintext"].disabled =
    state.busy || state.openedPlaintext.length === 0;

  elements["clear-all"].disabled = state.busy;
  elements["construction-name"].textContent = modeAdapter.label;
  elements["sender-meaning"].textContent = modeAdapter.senderMeaning;
  elements["compromise-meaning"].textContent = modeAdapter.compromiseMeaning;
  elements["copy-status"].textContent = state.copyStatus;
}
