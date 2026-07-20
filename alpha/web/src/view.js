import { utf8 } from "../../../experiments/milestone-1/src/bytes.js";
import { MAX_PLAINTEXT_BYTES } from "../../../experiments/milestone-1/src/constants.js";
import { nativeShareAvailable } from "./share.js";

const ids = [
  "global-status",
  "generate-identity",
  "identity-error",
  "identity-file-input",
  "identity-import-passphrase",
  "restore-identity-file",
  "identity-import-error",
  "own-contact",
  "copy-own-contact",
  "identity-export-panel",
  "identity-export-pending-warning",
  "identity-export-passphrase",
  "identity-export-confirmation",
  "identity-export-acknowledgment",
  "download-identity-file",
  "identity-export-error",
  "identity-export-session-status",
  "contact-input",
  "import-contact",
  "active-contact",
  "contact-error",
  "relationship-hex",
  "relationship-emoji",
  "comparison-confirmed",
  "seal-plaintext",
  "seal-byte-count",
  "fill-synthetic",
  "seal-button",
  "seal-error",
  "sealed-envelope",
  "copy-envelope",
  "share-envelope",
  "open-envelope",
  "open-button",
  "open-error",
  "open-status",
  "opened-plaintext",
  "copy-plaintext",
  "clear-all",
];

export const elements = Object.fromEntries(
  ids.map((id) => {
    const element = document.getElementById(id);
    if (!element) {
      throw new Error(`missing Alpha 1 element: ${id}`);
    }
    return [id, element];
  }),
);

function setValue(element, value) {
  if (element.value !== value) {
    element.value = value;
  }
}

function renderEmoji(items) {
  elements["relationship-emoji"].replaceChildren(
    ...items.map((item) => {
      const row = document.createElement("li");
      row.className = "emoji-item";
      row.setAttribute(
        "aria-label",
        `Position ${item.position}: ${item.label}; ${item.codePoints}`,
      );

      const position = document.createElement("span");
      position.className = "emoji-position";
      position.textContent = String(item.position);
      const symbol = document.createElement("span");
      symbol.className = "emoji-symbol";
      symbol.setAttribute("aria-hidden", "true");
      symbol.textContent = item.symbol;
      const label = document.createElement("span");
      label.className = "emoji-label";
      label.textContent = item.label;
      row.append(position, symbol, label);
      return row;
    }),
  );
}

export function render(state) {
  const identityReady = Boolean(state.identity);
  const importPassphraseReady =
    elements["identity-import-passphrase"].value.length > 0;
  const selectedFileCount = elements["identity-file-input"].files?.length ?? 0;
  const exportPassphrase = elements["identity-export-passphrase"].value;
  const exportConfirmation = elements["identity-export-confirmation"].value;
  const exportPassphraseReady =
    Array.from(exportPassphrase).length >= 12 &&
    exportPassphrase === exportConfirmation;
  const contactReady = Boolean(state.counterparty);
  const fingerprintReady = state.relationshipHex.length > 0;
  const plaintextBytes = utf8(state.sealPlaintext).length;
  const envelopeReady = state.openEnvelope.length > 0;
  const generatedReady = state.generatedEnvelope.length > 0;

  elements["global-status"].textContent = state.status;
  elements["generate-identity"].disabled = state.busy;
  elements["identity-error"].textContent = state.errors.identity;
  elements["identity-file-input"].disabled = state.busy;
  elements["identity-import-passphrase"].disabled = state.busy;
  elements["restore-identity-file"].disabled =
    state.busy || selectedFileCount !== 1 || !importPassphraseReady;
  elements["identity-import-error"].textContent = state.errors.identityImport;
  setValue(elements["own-contact"], state.ownContact);
  elements["copy-own-contact"].disabled = state.busy || !identityReady;
  elements["identity-export-panel"].hidden = !identityReady;
  elements["identity-export-pending-warning"].hidden =
    !identityReady || state.identityFileDownloadStarted;
  elements["identity-export-session-status"].textContent =
    state.identityFileDownloadStarted
      ? "An encrypted identity-file download was started during this page session."
      : "No encrypted identity file has been downloaded during this page session.";
  elements["identity-export-passphrase"].disabled =
    state.busy || !identityReady;
  elements["identity-export-confirmation"].disabled =
    state.busy || !identityReady;
  elements["identity-export-acknowledgment"].disabled =
    state.busy || !identityReady;
  elements["download-identity-file"].disabled =
    state.busy ||
    !identityReady ||
    !exportPassphraseReady ||
    !elements["identity-export-acknowledgment"].checked;
  elements["identity-export-error"].textContent = state.errors.identityExport;

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

  setValue(elements["relationship-hex"], state.relationshipHex);
  renderEmoji(state.emojiItems);
  elements["comparison-confirmed"].disabled = state.busy || !fingerprintReady;
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
  elements["copy-envelope"].disabled = state.busy || !generatedReady;
  elements["share-envelope"].hidden = !nativeShareAvailable();
  elements["share-envelope"].disabled = state.busy || !generatedReady;

  setValue(elements["open-envelope"], state.openEnvelope);
  elements["open-envelope"].disabled = state.busy;
  elements["open-button"].disabled =
    state.busy ||
    !identityReady ||
    !contactReady ||
    !fingerprintReady ||
    !state.comparisonConfirmed ||
    !envelopeReady;
  elements["open-error"].textContent = state.errors.open;
  elements["open-status"].textContent = state.openStatus;
  elements["opened-plaintext"].textContent = state.openedPlaintext;
  elements["copy-plaintext"].disabled =
    state.busy || state.openedPlaintext.length === 0;

  elements["clear-all"].disabled = state.busy;
}
