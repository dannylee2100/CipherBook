import { utf8 } from "../../../experiments/milestone-1/src/bytes.js";
import {
  MAX_PLAINTEXT_BYTES,
  MAX_SODIUM_WRAPPER_BYTES,
} from "../../../experiments/milestone-1/src/constants.js";
import { copyTextFromUserGesture } from "./clipboard.js";
import { deriveEmojiConvenience } from "./emoji.js";
import { deriveRelationshipFingerprint } from "./fingerprint.js";
import { shareCiphertextFromUserGesture } from "./share.js";
import { sodiumAlpha } from "./sodium-adapter.js";
import {
  clearVerificationState,
  createAlphaState,
  disposeAlphaState,
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
  return "The envelope could not be opened by this Alpha 0 identity.";
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
      "Counterparty draft changed. Re-import and compare the full hexadecimal value before sealing.";
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
  state.generatedEnvelope = "";
  state.status = state.comparisonConfirmed
    ? "Full hexadecimal comparison confirmed for this temporary relationship."
    : "Comparison confirmation removed; sealing is disabled.";
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
    "Synthetic Alpha 0 note. This text is not real or sensitive information.";
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
      if (utf8(state.openEnvelope).length > MAX_SODIUM_WRAPPER_BYTES) {
        throw new Error("envelope is oversized");
      }
      state.openedPlaintext = await sodiumAlpha.open(
        state.openEnvelope,
        state.identity,
        state.counterparty,
      );
      state.openStatus = "Opened using the expected relationship key.";
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
  resetState(
    "Application state cleared. Browser and operating-system memory erasure is not guaranteed.",
  );
  render(state);
});

globalThis.addEventListener("pagehide", () => {
  disposeAlphaState(state, sodiumAlpha);
});

render(state);
