import { utf8 } from "../../milestone-1/src/bytes.js";
import {
  MAX_AGE_ARMOR_BYTES,
  MAX_PLAINTEXT_BYTES,
  MAX_SODIUM_WRAPPER_BYTES,
} from "../../milestone-1/src/constants.js";
import { ageBrowserMode } from "./browser-age.js";
import { relationshipDiagnosticHex } from "./browser-relationship-digest.js";
import { sodiumBrowserMode } from "./browser-sodium.js";
import { copyTextFromUserGesture } from "./clipboard.js";
import {
  clearContactDependentState,
  createExperimentState,
  disposeExperimentState,
} from "./state.js";
import { elements, render } from "./view.js";

const modes = Object.freeze({
  sodium: sodiumBrowserMode,
  age: ageBrowserMode,
});

let state = createExperimentState();

function modeAdapter() {
  return modes[state.mode];
}

function resetState(mode = state.mode) {
  disposeExperimentState(state, modeAdapter());
  state = createExperimentState(mode);
}

function classifyOpenFailure(error) {
  const message = error instanceof Error ? error.message : "";
  if (/different recipient|wrong recipient/iu.test(message)) {
    return "This envelope names or requires a different recipient.";
  }
  if (/expected sender|different expected sender/iu.test(message)) {
    return "The expected sender contact does not match this experimental envelope.";
  }
  if (/truncat|malformed|JSON|base64|field|label|armor/iu.test(message)) {
    return "The envelope is malformed or truncated.";
  }
  if (/auth|decrypt|ciphertext/iu.test(message)) {
    return "Authentication or decryption failed. The envelope may be altered or for another identity.";
  }
  return "The envelope could not be opened in this experimental mode.";
}

async function runBusy(errorArea, action, failureMessage) {
  state.busy = true;
  state.errors[errorArea] = "";
  state.copyStatus = "";
  render(state, modeAdapter());
  try {
    await action();
  } catch (error) {
    state.errors[errorArea] =
      typeof failureMessage === "function"
        ? failureMessage(error)
        : failureMessage;
  } finally {
    state.busy = false;
    render(state, modeAdapter());
  }
}

elements["mode-select"].addEventListener("change", (event) => {
  const nextMode = event.currentTarget.value;
  if (!(nextMode in modes)) {
    return;
  }
  resetState(nextMode);
  render(state, modeAdapter());
});

elements["generate-identity"].addEventListener("click", async () => {
  await runBusy(
    "identity",
    async () => {
      const adapter = modeAdapter();
      const identity = await adapter.generateIdentity();
      resetState(state.mode);
      state.identity = identity;
      state.ownContact = adapter.exportContact(identity);
      state.identityStatus =
        "Temporary identity active. Only its public contact is displayed.";
    },
    "Temporary identity generation failed in this browser.",
  );
});

elements["copy-own-contact"].addEventListener("click", async () => {
  try {
    await copyTextFromUserGesture(state.ownContact);
    state.copyStatus = "Public contact copied.";
  } catch {
    state.copyStatus = "Public contact copy failed.";
  }
  render(state, modeAdapter());
});

elements["contact-input"].addEventListener("input", (event) => {
  state.contactDraft = event.currentTarget.value;
  state.errors.contact = "";
  if (
    state.counterparty &&
    state.contactDraft !== state.counterparty.text &&
    state.comparisonConfirmed
  ) {
    state.comparisonConfirmed = false;
    state.generatedEnvelope = "";
    state.openedPlaintext = "";
  }
  render(state, modeAdapter());
});

elements["import-contact"].addEventListener("click", async () => {
  await runBusy(
    "contact",
    async () => {
      const adapter = modeAdapter();
      const imported = adapter.importContact(state.contactDraft);
      if (imported.text === state.ownContact) {
        throw new Error("own contact is not a counterparty");
      }

      clearContactDependentState(state);
      state.counterparty = imported;
      state.contactDraft = imported.text;
      state.diagnosticRaw = await relationshipDiagnosticHex(
        utf8(state.ownContact),
        utf8(imported.text),
      );
    },
    (error) =>
      /own contact/iu.test(error instanceof Error ? error.message : "")
        ? "The active identity cannot be imported as its own counterparty."
        : "The contact is malformed, unsupported, or oversized.",
  );
});

elements["comparison-confirmed"].addEventListener("change", (event) => {
  state.comparisonConfirmed = event.currentTarget.checked;
  if (!state.comparisonConfirmed) {
    state.generatedEnvelope = "";
  }
  render(state, modeAdapter());
});

elements["seal-plaintext"].addEventListener("input", (event) => {
  state.sealPlaintext = event.currentTarget.value;
  state.generatedEnvelope = "";
  state.errors.seal =
    utf8(state.sealPlaintext).length > MAX_PLAINTEXT_BYTES
      ? `Text exceeds the ${MAX_PLAINTEXT_BYTES}-byte experimental limit.`
      : "";
  render(state, modeAdapter());
});

elements["fill-synthetic"].addEventListener("click", () => {
  state.sealPlaintext =
    "Synthetic laboratory note. This is not real or sensitive information.";
  state.generatedEnvelope = "";
  state.errors.seal = "";
  render(state, modeAdapter());
});

elements["seal-button"].addEventListener("click", async () => {
  await runBusy(
    "seal",
    async () => {
      if (!state.identity || !state.counterparty) {
        throw new Error("identity and contact are required");
      }
      if (!state.comparisonConfirmed) {
        throw new Error("comparison confirmation is required");
      }
      if (utf8(state.sealPlaintext).length > MAX_PLAINTEXT_BYTES) {
        throw new Error("plaintext is oversized");
      }
      state.generatedEnvelope = await modeAdapter().seal(
        state.sealPlaintext,
        state.identity,
        state.counterparty,
      );
    },
    "Sealing failed. Check the temporary identity, contact, and text size.",
  );
});

elements["copy-envelope"].addEventListener("click", async () => {
  try {
    await copyTextFromUserGesture(state.generatedEnvelope);
    state.copyStatus = "Experimental ciphertext copied.";
  } catch {
    state.copyStatus = "Ciphertext copy failed.";
  }
  render(state, modeAdapter());
});

elements["open-envelope"].addEventListener("input", (event) => {
  state.openEnvelope = event.currentTarget.value;
  state.openedPlaintext = "";
  state.errors.open = "";
  render(state, modeAdapter());
});

elements["open-button"].addEventListener("click", async () => {
  await runBusy(
    "open",
    async () => {
      state.openedPlaintext = "";
      const maximum =
        state.mode === "sodium"
          ? MAX_SODIUM_WRAPPER_BYTES
          : MAX_AGE_ARMOR_BYTES;
      if (utf8(state.openEnvelope).length > maximum) {
        throw new Error("envelope is oversized");
      }
      state.openedPlaintext = await modeAdapter().open(
        state.openEnvelope,
        state.identity,
        state.counterparty,
      );
    },
    classifyOpenFailure,
  );
});

elements["copy-plaintext"].addEventListener("click", async () => {
  try {
    await copyTextFromUserGesture(state.openedPlaintext);
    state.copyStatus = "Opened plaintext copied after explicit action.";
  } catch {
    state.copyStatus = "Plaintext copy failed.";
  }
  render(state, modeAdapter());
});

elements["clear-all"].addEventListener("click", () => {
  resetState(state.mode);
  render(state, modeAdapter());
});

globalThis.addEventListener("pagehide", () => {
  disposeExperimentState(state, modeAdapter());
});

render(state, modeAdapter());
