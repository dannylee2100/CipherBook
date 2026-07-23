import { utf8 } from "../../../experiments/milestone-1/src/bytes.js";
import {
  MAX_PLAINTEXT_BYTES,
  MAX_SODIUM_WRAPPER_BYTES,
} from "../../../experiments/milestone-1/src/constants.js";
import { copyTextFromUserGesture } from "./clipboard.js";
import { deriveEmojiConvenience } from "./emoji.js";
import { deriveRelationshipFingerprint } from "./fingerprint.js";
import { downloadEncryptedIdentityFile } from "./identity-file-download.js";
import { readSelectedIdentityFile } from "./identity-file-input.js";
import {
  exportEncryptedIdentityFile,
  importEncryptedIdentityFile,
} from "./identity-file.js";
import { shareCiphertextFromUserGesture } from "./share.js";
import { sodiumAlpha } from "./sodium-adapter.js";
import {
  clearTrustDependentOutput,
  clearVerificationState,
  createAlphaState,
  disposeAlphaState,
  replaceIdentity,
  replaceCounterparty,
} from "./state.js";
import { elements, render } from "./view.js";

let state = createAlphaState();

function resetState(status = "No temporary identity exists.") {
  disposeAlphaState(state, sodiumAlpha);
  state = createAlphaState();
  state.status = status;
}

function classifyOpenFailure(error) {
  const message = error instanceof Error ? error.message : "";
  if (
    /full hexadecimal relationship comparison is not confirmed/iu.test(message)
  ) {
    return "Confirm the full hexadecimal relationship comparison before opening this envelope.";
  }
  if (/different recipient/iu.test(message)) {
    return "This envelope names a different recipient.";
  }
  if (/different expected sender|expected counterparty/iu.test(message)) {
    return "The expected counterparty contact does not match this envelope.";
  }
  if (/truncat|malformed|JSON|base64|field|label/iu.test(message)) {
    return "The envelope is malformed or truncated.";
  }
  if (/auth|decrypt|ciphertext/iu.test(message)) {
    return "Opening failed. The ciphertext may be altered or for another relationship.";
  }
  return "The envelope could not be opened by this preview identity.";
}

function classifyIdentityImportFailure(error) {
  const code = error && typeof error === "object" ? error.code : "";
  if (code === "authentication") {
    return "The identity file could not be opened. The passphrase may be incorrect, or the file may be damaged or modified.";
  }
  if (code === "file-format") {
    return "This is not a supported CipherBook experimental identity file.";
  }
  if (code === "kdf-profile") {
    return "This identity file uses an unsupported KDF profile.";
  }
  if (code === "file-oversized") {
    return "The selected identity file is oversized and was not read.";
  }
  if (code === "file-empty") {
    return "The selected identity file is empty.";
  }
  if (code === "file-count") {
    return "Select exactly one encrypted identity file.";
  }
  if (code === "file-length") {
    return "The identity file is truncated or has trailing data.";
  }
  if (code === "passphrase-empty") {
    return "Enter the identity-file passphrase.";
  }
  if (code === "passphrase-long") {
    return "The passphrase exceeds the 1024-byte UTF-8 limit.";
  }
  if (code === "kdf-failed") {
    return "The identity file could not be opened in this browser.";
  }
  return "The identity file could not be restored.";
}

function classifyIdentityExportFailure(error) {
  const code = error && typeof error === "object" ? error.code : "";
  if (code === "passphrase-empty") {
    return "Enter and confirm a new passphrase.";
  }
  if (code === "passphrase-short") {
    return "Use at least 12 Unicode code points. This minimum does not make a passphrase strong.";
  }
  if (code === "passphrase-long") {
    return "The passphrase exceeds the 1024-byte UTF-8 limit.";
  }
  if (code === "passphrase-mismatch") {
    return "Passphrase and confirmation must match exactly.";
  }
  if (code === "kdf-failed") {
    return "The encrypted identity file could not be created in this browser.";
  }
  return "The encrypted identity file could not be created.";
}

function clearImportControls() {
  elements["identity-import-passphrase"].value = "";
  elements["identity-file-input"].value = "";
}

function clearExportControls() {
  elements["identity-export-passphrase"].value = "";
  elements["identity-export-confirmation"].value = "";
  elements["identity-export-acknowledgment"].checked = false;
}

function clearIdentityFileControls() {
  clearImportControls();
  clearExportControls();
}

function resetVisibleApplicationState(
  status = "No temporary identity exists.",
) {
  resetState(status);
  clearIdentityFileControls();
  render(state);
}

async function runBusy(errorArea, action, failureMessage) {
  state.busy = true;
  state.errors[errorArea] = "";
  render(state);
  try {
    await action();
  } catch (error) {
    state.errors[errorArea] =
      typeof failureMessage === "function"
        ? failureMessage(error)
        : failureMessage;
  } finally {
    state.busy = false;
    render(state);
  }
}

async function copyWithStatus(text, success, failure) {
  try {
    await copyTextFromUserGesture(text);
    state.status = success;
  } catch {
    state.status = failure;
  }
  render(state);
}

elements["generate-identity"].addEventListener("click", async () => {
  await runBusy(
    "identity",
    async () => {
      const identity = await sodiumAlpha.generateIdentity();
      resetState();
      state.identity = identity;
      state.ownContact = sodiumAlpha.exportContact(identity);
      state.status =
        "Temporary identity active. Private identity material remains in application memory and is not displayed.";
    },
    "Temporary identity generation failed in this browser.",
  );
  clearIdentityFileControls();
  render(state);
});

for (const id of ["identity-file-input", "identity-import-passphrase"]) {
  elements[id].addEventListener("input", () => {
    state.errors.identityImport = "";
    render(state);
  });
}

elements["restore-identity-file"].addEventListener("click", async () => {
  await runBusy(
    "identityImport",
    async () => {
      const fileBytes = await readSelectedIdentityFile(
        elements["identity-file-input"].files,
      );
      const restored = await importEncryptedIdentityFile(
        fileBytes,
        elements["identity-import-passphrase"].value,
      );
      replaceIdentity(state, restored, sodiumAlpha);
    },
    classifyIdentityImportFailure,
  );
  clearImportControls();
  render(state);
});

for (const id of [
  "identity-export-passphrase",
  "identity-export-confirmation",
  "identity-export-acknowledgment",
]) {
  elements[id].addEventListener("input", () => {
    state.errors.identityExport = "";
    render(state);
  });
}

elements["download-identity-file"].addEventListener("click", async () => {
  await runBusy(
    "identityExport",
    async () => {
      if (!state.identity) {
        throw new Error("an active identity is required");
      }
      if (!elements["identity-export-acknowledgment"].checked) {
        throw new Error("the offline-guessing acknowledgment is required");
      }
      const fileBytes = await exportEncryptedIdentityFile(
        state.identity,
        elements["identity-export-passphrase"].value,
        elements["identity-export-confirmation"].value,
      );
      downloadEncryptedIdentityFile(fileBytes);
      state.identityFileDownloadStarted = true;
      state.status =
        "Encrypted identity-file download started. CipherBook cannot verify where the browser stored the file or whether you retained it.";
    },
    classifyIdentityExportFailure,
  );
  clearExportControls();
  render(state);
});

elements["copy-own-contact"].addEventListener("click", async () => {
  await copyWithStatus(
    state.ownContact,
    "Public contact copied.",
    "Public contact copy failed.",
  );
});

elements["contact-input"].addEventListener("input", (event) => {
  state.contactDraft = event.currentTarget.value;
  state.errors.contact = "";
  if (state.counterparty && state.contactDraft !== state.counterparty.text) {
    clearVerificationState(state);
    state.status =
      "Counterparty draft changed. Re-import and compare the full hexadecimal value before sealing or opening.";
  }
  render(state);
});

elements["import-contact"].addEventListener("click", async () => {
  await runBusy(
    "contact",
    async () => {
      const imported = sodiumAlpha.importContact(state.contactDraft);
      if (imported.text === state.ownContact) {
        throw new Error("own contact is not a counterparty");
      }

      replaceCounterparty(state, imported);
      state.contactDraft = imported.text;
      const fingerprint = await deriveRelationshipFingerprint(
        state.ownContact,
        imported.text,
      );
      state.relationshipHex = fingerprint.groupedHex;
      state.emojiItems = deriveEmojiConvenience(fingerprint.bytes);
      state.status =
        "Counterparty imported. Compare the full hexadecimal value through a separate trusted interaction.";
    },
    (error) =>
      /own contact/iu.test(error instanceof Error ? error.message : "")
        ? "The active identity cannot be its own counterparty."
        : "The contact is malformed, unsupported, or oversized.",
  );
});

elements["comparison-confirmed"].addEventListener("change", (event) => {
  state.comparisonConfirmed = event.currentTarget.checked;
  if (!state.comparisonConfirmed) {
    clearTrustDependentOutput(state);
  }
  state.status = state.comparisonConfirmed
    ? "Full hexadecimal comparison confirmed for this temporary relationship."
    : "Comparison confirmation removed; sealing and opening are disabled.";
  render(state);
});

elements["seal-plaintext"].addEventListener("input", (event) => {
  state.sealPlaintext = event.currentTarget.value;
  state.generatedEnvelope = "";
  state.errors.seal =
    utf8(state.sealPlaintext).length > MAX_PLAINTEXT_BYTES
      ? `Text exceeds the ${MAX_PLAINTEXT_BYTES}-byte experimental limit.`
      : "";
  render(state);
});

elements["fill-synthetic"].addEventListener("click", () => {
  state.sealPlaintext =
    "Synthetic CipherBook preview note. This text is not real or sensitive information.";
  state.generatedEnvelope = "";
  state.errors.seal = "";
  render(state);
});

elements["seal-button"].addEventListener("click", async () => {
  await runBusy(
    "seal",
    async () => {
      if (!state.identity || !state.counterparty) {
        throw new Error("identity and counterparty are required");
      }
      if (!state.comparisonConfirmed) {
        throw new Error("full comparison confirmation is required");
      }
      if (utf8(state.sealPlaintext).length > MAX_PLAINTEXT_BYTES) {
        throw new Error("plaintext is oversized");
      }
      state.generatedEnvelope = await sodiumAlpha.seal(
        state.sealPlaintext,
        state.identity,
        state.counterparty,
      );
      state.status =
        "Unstable ciphertext generated. Send it through another application.";
    },
    "Sealing failed. Check the temporary identity, contact, comparison, and text size.",
  );
});

elements["copy-envelope"].addEventListener("click", async () => {
  await copyWithStatus(
    state.generatedEnvelope,
    "Ciphertext copied.",
    "Ciphertext copy failed.",
  );
});

elements["share-envelope"].addEventListener("click", async () => {
  try {
    const shared = await shareCiphertextFromUserGesture(
      state.generatedEnvelope,
    );
    state.status = shared
      ? "Ciphertext handed to the native share interface."
      : "Native sharing was canceled; ciphertext remains available to copy.";
  } catch {
    state.status =
      "Native ciphertext sharing failed; use the copy fallback instead.";
  }
  render(state);
});

elements["open-envelope"].addEventListener("input", (event) => {
  state.openEnvelope = event.currentTarget.value;
  state.openedPlaintext = "";
  state.openStatus = "";
  state.errors.open = "";
  render(state);
});

elements["open-button"].addEventListener("click", async () => {
  await runBusy(
    "open",
    async () => {
      state.openedPlaintext = "";
      state.openStatus = "";
      if (!state.identity) {
        throw new Error("an active temporary identity is required");
      }
      if (!state.counterparty) {
        throw new Error("an expected counterparty contact is required");
      }
      if (!state.comparisonConfirmed) {
        throw new Error(
          "the full hexadecimal relationship comparison is not confirmed",
        );
      }
      if (!state.relationshipHex) {
        throw new Error("a full relationship diagnostic is required");
      }
      if (state.openEnvelope.length === 0) {
        throw new Error("an experimental envelope is required");
      }
      if (utf8(state.openEnvelope).length > MAX_SODIUM_WRAPPER_BYTES) {
        throw new Error("envelope is oversized");
      }
      state.openedPlaintext = await sodiumAlpha.open(
        state.openEnvelope,
        state.identity,
        state.counterparty,
      );
      state.openStatus =
        "Opened after confirming the expected relationship's full hexadecimal comparison.";
      state.status =
        "Envelope opened locally. This is not third-party proof of authorship.";
    },
    classifyOpenFailure,
  );
});

elements["copy-plaintext"].addEventListener("click", async () => {
  await copyWithStatus(
    state.openedPlaintext,
    "Opened plaintext copied after explicit action.",
    "Plaintext copy failed.",
  );
});

elements["clear-all"].addEventListener("click", () => {
  resetVisibleApplicationState(
    "Clear removes the application state controlled by this page. It cannot delete exported files or guarantee memory erasure.",
  );
});

globalThis.addEventListener("pagehide", () => {
  resetVisibleApplicationState();
});

globalThis.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    resetVisibleApplicationState();
  }
});

render(state);
