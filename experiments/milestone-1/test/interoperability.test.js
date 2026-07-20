import assert from "node:assert/strict";
import { test } from "node:test";

import { decodeUtf8, utf8 } from "../src/bytes.js";
import { generateAgeIdentity, openAgeText, sealAgeText } from "../src/age.js";
import {
  decryptWithOfficialAge,
  encryptWithOfficialAge,
  officialAgeVersion,
} from "../src/age-cli.js";

test("the official age executable is the expected tested release", async () => {
  assert.equal(await officialAgeVersion(), "v1.3.1");
});

test("Typage native armor decrypts with the official age executable", async () => {
  const bob = await generateAgeIdentity();
  const plaintext = "synthetic Typage-to-official-age payload";
  const armored = await sealAgeText(plaintext, bob.recipient);

  assert.equal(
    decodeUtf8(await decryptWithOfficialAge(armored, bob)),
    plaintext,
  );
});

test("official-age native armor decrypts through Typage", async () => {
  const bob = await generateAgeIdentity();
  const plaintext = "synthetic official-age-to-Typage payload";
  const armored = await encryptWithOfficialAge(utf8(plaintext), bob.recipient);

  assert.match(armored, /^-----BEGIN AGE ENCRYPTED FILE-----\n/);
  assert.equal(await openAgeText(armored, bob), plaintext);
});
