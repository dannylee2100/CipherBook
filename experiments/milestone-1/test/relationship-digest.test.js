import assert from "node:assert/strict";
import { test } from "node:test";

import { utf8 } from "../src/bytes.js";
import {
  relationshipDigest,
  relationshipDigestHex,
} from "../src/relationship-digest.js";

test("relationship diagnostic is symmetric and retains the full digest", () => {
  const alice = utf8("synthetic-alice-public-contact");
  const bob = utf8("synthetic-bob-public-contact");

  assert.deepEqual(
    relationshipDigest(alice, bob),
    relationshipDigest(bob, alice),
  );
  assert.deepEqual(
    relationshipDigest(alice, bob),
    relationshipDigest(alice, bob),
  );
  assert.equal(relationshipDigest(alice, bob).length, 32);
  assert.match(relationshipDigestHex(alice, bob), /^[0-9a-f]{64}$/);
});

test("relationship diagnostic changes when either contact changes", () => {
  const alice = utf8("synthetic-alice-public-contact");
  const bob = utf8("synthetic-bob-public-contact");
  const changedAlice = utf8("synthetic-alice-public-contact-changed");
  const changedBob = utf8("synthetic-bob-public-contact-changed");
  const baseline = relationshipDigestHex(alice, bob);

  assert.notEqual(relationshipDigestHex(changedAlice, bob), baseline);
  assert.notEqual(relationshipDigestHex(alice, changedBob), baseline);
});

test("relationship diagnostic rejects empty, invalid, and oversized contacts", () => {
  assert.throws(() => relationshipDigest(new Uint8Array(), utf8("bob")));
  assert.throws(() => relationshipDigest("alice", utf8("bob")), TypeError);
  assert.throws(() => relationshipDigest(new Uint8Array(4097), utf8("bob")));
});
