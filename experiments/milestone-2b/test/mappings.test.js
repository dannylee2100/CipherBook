import assert from "node:assert/strict";
import { test } from "node:test";

import { REPRESENTATION_DEFINITIONS } from "../src/constants.js";
import { EMOJI_TABLE } from "../src/emoji-table.js";
import {
  bytesToHex,
  emojiEntries,
  groupFullDigestHex,
  hexEntries,
  representationFor,
  representationSignature,
  sixBitIndices,
  spokenEntries,
  wordEntries,
} from "../src/representations.js";
import { WORD_LIST } from "../src/word-list.js";

const fixture = Uint8Array.from({ length: 32 }, (_, index) => index);

test("same synthetic digest produces identical representations", () => {
  for (const condition of REPRESENTATION_DEFINITIONS) {
    const first = representationFor(condition.id, fixture);
    const second = representationFor(condition.id, fixture.slice());
    assert.deepEqual(first, second);
  }
});

test("a changed first digest byte changes every study representation", () => {
  const changed = fixture.slice();
  changed[0] ^= 0xff;
  for (const condition of REPRESENTATION_DEFINITIONS) {
    assert.notEqual(
      representationSignature(representationFor(condition.id, fixture)),
      representationSignature(representationFor(condition.id, changed)),
      condition.id,
    );
  }
});

test("emoji conditions use exact six-bit MSB-first counts", () => {
  assert.equal(emojiEntries(fixture, 8).length, 8);
  assert.equal(emojiEntries(fixture, 16).length, 16);
  assert.equal(emojiEntries(fixture, 24).length, 24);
  assert.deepEqual(sixBitIndices(new Uint8Array(32), 24), Array(24).fill(0));
  assert.deepEqual(
    sixBitIndices(new Uint8Array(32).fill(0xff), 24),
    Array(24).fill(63),
  );
  for (const index of sixBitIndices(fixture, 24)) {
    assert.ok(index >= 0 && index < 64);
  }
});

test("spoken labels use the same first 96 bits as visual emoji-16", () => {
  assert.deepEqual(
    spokenEntries(fixture).map((item) => item.index),
    emojiEntries(fixture, 16).map((item) => item.index),
  );
});

test("spoken labels, words, and hexadecimal consume the same first 96 source bits", () => {
  const spoken = spokenEntries(fixture);
  const words = wordEntries(fixture);
  const hex = hexEntries(fixture);
  assert.deepEqual(
    spoken.map((item) => item.index),
    sixBitIndices(fixture, 16),
  );
  assert.deepEqual(
    words.map((item) => item.index),
    Array.from(fixture.slice(0, 12)),
  );
  assert.equal(
    hex.map((item) => item.group).join(""),
    bytesToHex(fixture.slice(0, 12)),
  );
});

test("word condition maps the first twelve bytes to exact list indices", () => {
  const entries = wordEntries(fixture);
  assert.equal(entries.length, 12);
  assert.deepEqual(
    entries.map((item) => item.index),
    Array.from(fixture.slice(0, 12)),
  );
  assert.deepEqual(
    entries.map((item) => item.word),
    WORD_LIST.slice(0, 12),
  );
});

test("hex condition is 24 lowercase characters in six numbered groups", () => {
  const entries = hexEntries(fixture);
  assert.equal(entries.length, 6);
  assert.equal(
    entries.map((item) => item.group).join(""),
    "000102030405060708090a0b",
  );
  assert.deepEqual(
    entries.map((item) => item.position),
    [1, 2, 3, 4, 5, 6],
  );
});

test("full QR fallback exposes all 256 synthetic bits", () => {
  assert.equal(bytesToHex(fixture).length, 64);
  assert.equal(
    groupFullDigestHex(fixture).replaceAll(" ", ""),
    bytesToHex(fixture),
  );
});

test("emoji table is an exact 64-entry indexed code-point mapping", () => {
  assert.equal(EMOJI_TABLE.length, 64);
  assert.equal(new Set(EMOJI_TABLE.map((item) => item.symbol)).size, 64);
  for (const [index, item] of EMOJI_TABLE.entries()) {
    assert.equal(item.index, index);
    const actual = Array.from(
      item.symbol,
      (character) => `U+${character.codePointAt(0).toString(16).toUpperCase()}`,
    ).join("");
    assert.equal(actual, item.codePoints);
    assert.doesNotMatch(
      actual,
      /U\+1F3F[B-F]/u,
      "skin-tone modifiers are excluded",
    );
  }
});

test("word list is an exact unique 256-entry byte mapping", () => {
  assert.equal(WORD_LIST.length, 256);
  assert.equal(new Set(WORD_LIST).size, 256);
  assert.ok(WORD_LIST.every((word) => /^[a-z]{4}$/u.test(word)));
});
