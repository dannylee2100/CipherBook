import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { test } from "node:test";

import { downloadEncryptedIdentityFile } from "../src/identity-file-download.js";
import {
  IDENTITY_FILE_MIME,
  IDENTITY_FILE_NAME,
} from "../src/identity-file.js";

test("explicit adapter call downloads one encrypted blob and always cleans up", async () => {
  const bytes = new Uint8Array(randomBytes(107));
  const events = [];
  let createdBlob;
  const anchor = {
    download: "",
    hidden: false,
    href: "",
    click() {
      events.push("click");
    },
    remove() {
      events.push("remove");
    },
  };
  const documentObject = {
    body: {
      append(value) {
        assert.equal(value, anchor);
        events.push("append");
      },
    },
    createElement(name) {
      assert.equal(name, "a");
      events.push("create-anchor");
      return anchor;
    },
  };
  const urlObject = {
    createObjectURL(blob) {
      createdBlob = blob;
      events.push("create-url");
      return "blob:synthetic-local-object";
    },
    revokeObjectURL(value) {
      assert.equal(value, "blob:synthetic-local-object");
      events.push("revoke-url");
    },
  };

  downloadEncryptedIdentityFile(bytes, { documentObject, urlObject });

  assert.equal(createdBlob.type, IDENTITY_FILE_MIME);
  assert.deepEqual(new Uint8Array(await createdBlob.arrayBuffer()), bytes);
  assert.equal(anchor.download, IDENTITY_FILE_NAME);
  assert.equal(anchor.href, "blob:synthetic-local-object");
  assert.deepEqual(events, [
    "create-url",
    "create-anchor",
    "append",
    "click",
    "remove",
    "revoke-url",
  ]);
});

test("download cleanup runs when the synthetic click fails", () => {
  const events = [];
  const anchor = {
    click() {
      throw new Error("synthetic click failure");
    },
    remove() {
      events.push("remove");
    },
  };
  const documentObject = {
    body: { append() {} },
    createElement() {
      return anchor;
    },
  };
  const urlObject = {
    createObjectURL() {
      return "blob:synthetic-local-object";
    },
    revokeObjectURL() {
      events.push("revoke-url");
    },
  };

  assert.throws(() =>
    downloadEncryptedIdentityFile(new Uint8Array(randomBytes(107)), {
      documentObject,
      urlObject,
    }),
  );
  assert.deepEqual(events, ["remove", "revoke-url"]);
});
