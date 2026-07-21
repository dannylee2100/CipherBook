import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { test } from "node:test";

import {
  createAlphaState,
  disposeAlphaState,
  replaceIdentity,
} from "../src/state.js";

function identity() {
  return {
    publicKey: new Uint8Array(randomBytes(32)),
    privateKey: new Uint8Array(randomBytes(32)),
  };
}

function populatedState() {
  const state = createAlphaState();
  state.identity = identity();
  state.ownContact = "synthetic-public-contact";
  state.identityFileDownloadStarted = true;
  state.contactDraft = "synthetic-counterparty-contact";
  state.counterparty = { text: state.contactDraft };
  state.relationshipHex = "ab".repeat(32);
  state.emojiItems = [{ symbol: "🧪" }];
  state.comparisonConfirmed = true;
  state.sealPlaintext = "synthetic unsent content";
  state.generatedEnvelope = "synthetic generated ciphertext";
  state.openEnvelope = "synthetic pasted ciphertext";
  state.openedPlaintext = "synthetic opened content";
  state.openStatus = "synthetic open status";
  for (const key of Object.keys(state.errors)) {
    state.errors[key] = `synthetic ${key} error`;
  }
  return state;
}

test("successful identity replacement disposes old key and clears every dependent field", () => {
  const state = populatedState();
  const oldIdentity = state.identity;
  const oldPrivateKey = oldIdentity.privateKey;
  const restored = {
    identity: identity(),
    contact: "synthetic-restored-public-contact",
  };
  const adapter = {
    disposeIdentity(value) {
      value.privateKey.fill(0);
      value.privateKey = null;
      value.publicKey = null;
    },
  };

  replaceIdentity(state, restored, adapter);

  assert.ok(oldPrivateKey.every((byte) => byte === 0));
  assert.equal(state.identity, restored.identity);
  assert.equal(state.ownContact, restored.contact);
  assert.equal(state.identityFileDownloadStarted, false);
  assert.equal(state.contactDraft, "");
  assert.equal(state.counterparty, null);
  assert.equal(state.relationshipHex, "");
  assert.deepEqual(state.emojiItems, []);
  assert.equal(state.comparisonConfirmed, false);
  assert.equal(state.sealPlaintext, "");
  assert.equal(state.generatedEnvelope, "");
  assert.equal(state.openEnvelope, "");
  assert.equal(state.openedPlaintext, "");
  assert.equal(state.openStatus, "");
  assert.ok(Object.values(state.errors).every((value) => value === ""));
  assert.equal(
    state.status,
    "The CipherBook identity from this file was restored. Its public contact is shown below. Counterparty contacts and previous verification were not restored. Paste the counterparty’s public contact and compare the full hexadecimal value again.",
  );
});

test("rejecting an incomplete candidate preserves all current state", () => {
  const state = populatedState();
  const before = structuredClone(state);
  let disposeCalls = 0;

  assert.throws(() =>
    replaceIdentity(state, null, {
      disposeIdentity() {
        disposeCalls += 1;
      },
    }),
  );

  assert.deepEqual(state, before);
  assert.equal(disposeCalls, 0);
});

test("clear removes identity and all import/export error state", () => {
  const state = populatedState();
  const privateKey = state.identity.privateKey;
  disposeAlphaState(state, {
    disposeIdentity(value) {
      value.privateKey.fill(0);
      value.privateKey = null;
      value.publicKey = null;
    },
  });

  assert.ok(privateKey.every((byte) => byte === 0));
  assert.equal(state.identity, null);
  assert.equal(state.ownContact, "");
  assert.equal(state.identityFileDownloadStarted, false);
  assert.ok(Object.values(state.errors).every((value) => value === ""));
  assert.doesNotMatch(JSON.stringify(state), /passphrase/iu);
});
