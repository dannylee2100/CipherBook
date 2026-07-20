import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { test } from "node:test";

import {
  IDENTITY_FILE_LAYOUT,
  IDENTITY_FILE_MAX_BYTES,
} from "../src/identity-file.js";
import { readSelectedIdentityFile } from "../src/identity-file-input.js";

function syntheticFile(size, result = new Uint8Array(size)) {
  let readCalls = 0;
  return {
    file: {
      size,
      async arrayBuffer() {
        readCalls += 1;
        return result.buffer.slice(
          result.byteOffset,
          result.byteOffset + result.byteLength,
        );
      },
    },
    readCalls: () => readCalls,
  };
}

test("file selection accepts one exact-length file without trusting metadata", async () => {
  const bytes = new Uint8Array(randomBytes(IDENTITY_FILE_LAYOUT.totalBytes));
  const selected = syntheticFile(bytes.length, bytes);
  selected.file.name = "ignored-name.txt";
  selected.file.type = "text/plain";

  assert.deepEqual(await readSelectedIdentityFile([selected.file]), bytes);
  assert.equal(selected.readCalls(), 1);
});

test("empty, oversized, truncated, trailing, and multiple selections fail before read", async () => {
  for (const selected of [
    syntheticFile(0),
    syntheticFile(IDENTITY_FILE_MAX_BYTES + 1),
    syntheticFile(IDENTITY_FILE_LAYOUT.totalBytes - 1),
    syntheticFile(IDENTITY_FILE_LAYOUT.totalBytes + 1),
  ]) {
    await assert.rejects(() => readSelectedIdentityFile([selected.file]));
    assert.equal(selected.readCalls(), 0);
  }

  const first = syntheticFile(IDENTITY_FILE_LAYOUT.totalBytes);
  const second = syntheticFile(IDENTITY_FILE_LAYOUT.totalBytes);
  await assert.rejects(() => readSelectedIdentityFile([]));
  await assert.rejects(() =>
    readSelectedIdentityFile([first.file, second.file]),
  );
  assert.equal(first.readCalls(), 0);
  assert.equal(second.readCalls(), 0);
});

test("a file whose reported size disagrees with bytes is rejected after one bounded read", async () => {
  const selected = syntheticFile(
    IDENTITY_FILE_LAYOUT.totalBytes,
    new Uint8Array(IDENTITY_FILE_LAYOUT.totalBytes - 1),
  );
  await assert.rejects(
    () => readSelectedIdentityFile([selected.file]),
    (error) => error.code === "file-length",
  );
  assert.equal(selected.readCalls(), 1);
});
