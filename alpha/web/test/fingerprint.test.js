import assert from "node:assert/strict";
import { test } from "node:test";

import { sixBitIndices } from "../../../experiments/milestone-2b/src/representations.js";
import { ALPHA_EMOJI_BITS, deriveEmojiConvenience } from "../src/emoji.js";
import { deriveRelationshipFingerprint } from "../src/fingerprint.js";
import { sodiumAlpha } from "../src/sodium-adapter.js";

test("the same contact pair produces one symmetric full relationship digest", async () => {
  const alice = await sodiumAlpha.generateIdentity();
  const bob = await sodiumAlpha.generateIdentity();
  const aliceContact = sodiumAlpha.exportContact(alice);
  const bobContact = sodiumAlpha.exportContact(bob);

  const aliceView = await deriveRelationshipFingerprint(
    aliceContact,
    bobContact,
  );
  const bobView = await deriveRelationshipFingerprint(bobContact, aliceContact);

  assert.deepEqual(aliceView.bytes, bobView.bytes);
  assert.equal(aliceView.bytes.length, 32);
  assert.match(aliceView.hex, /^[0-9a-f]{64}$/u);
  assert.equal(aliceView.groupedHex.replaceAll(" ", ""), aliceView.hex);
  assert.equal(aliceView.groupedHex.split(" ").length, 8);
});

test("the 16-emoji convenience view consumes exactly the first 96 bits", async () => {
  const alice = await sodiumAlpha.generateIdentity();
  const bob = await sodiumAlpha.generateIdentity();
  const fingerprint = await deriveRelationshipFingerprint(
    sodiumAlpha.exportContact(alice),
    sodiumAlpha.exportContact(bob),
  );
  const items = deriveEmojiConvenience(fingerprint.bytes);

  assert.equal(ALPHA_EMOJI_BITS, 96);
  assert.equal(items.length, 16);
  assert.deepEqual(
    items.map((item) => item.index),
    sixBitIndices(fingerprint.bytes, 16),
  );
  assert.deepEqual(
    items.map((item) => item.position),
    Array.from({ length: 16 }, (_, index) => index + 1),
  );
  assert.ok(
    items.every(
      (item) =>
        item.symbol.length > 0 &&
        item.label.length > 0 &&
        item.codePoints.startsWith("U+"),
    ),
  );
});

test("changing either contact changes both alpha comparison displays", async () => {
  const alice = await sodiumAlpha.generateIdentity();
  const bob = await sodiumAlpha.generateIdentity();
  const carol = await sodiumAlpha.generateIdentity();
  const aliceContact = sodiumAlpha.exportContact(alice);
  const first = await deriveRelationshipFingerprint(
    aliceContact,
    sodiumAlpha.exportContact(bob),
  );
  const changed = await deriveRelationshipFingerprint(
    aliceContact,
    sodiumAlpha.exportContact(carol),
  );

  assert.notEqual(first.hex, changed.hex);
  assert.notDeepEqual(
    deriveEmojiConvenience(first.bytes).map((item) => item.index),
    deriveEmojiConvenience(changed.bytes).map((item) => item.index),
  );
});
