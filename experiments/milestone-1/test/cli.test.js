import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { test } from "node:test";

import { LAB_WARNING } from "../src/constants.js";

const execFileAsync = promisify(execFile);
const cliPath = fileURLToPath(new URL("../src/cli.js", import.meta.url));

async function runCli(arguments_) {
  return execFileAsync(process.execPath, [cliPath, ...arguments_], {
    encoding: "utf8",
    maxBuffer: 256 * 1024,
  });
}

test("every supported laboratory command prints the experimental warning", async () => {
  for (const arguments_ of [
    ["sodium", "identity"],
    ["sodium", "fingerprint"],
    ["sodium", "probe"],
    ["age", "identity"],
    ["age", "fingerprint"],
    ["age", "probe"],
    ["compare", "measure"],
  ]) {
    const { stdout, stderr } = await runCli(arguments_);
    assert.match(stderr, new RegExp(LAB_WARNING.replaceAll(".", "\\.")));
    assert.doesNotMatch(
      `${stdout}\n${stderr}`,
      /\bstable\b|protocol version 1|CipherBook v1|CBE1|CBC1/i,
    );
  }
});

test("identity commands do not print private key material", async () => {
  for (const mode of ["sodium", "age"]) {
    const { stdout } = await runCli([mode, "identity"]);
    assert.doesNotMatch(stdout, /AGE-SECRET-KEY|privateKey|secretKey/);
    assert.match(stdout, /was not printed/);
  }
});

test("unsupported commands fail without accepting plaintext arguments", async () => {
  await assert.rejects(
    () => runCli(["sodium", "seal", "synthetic text argument"]),
    (error) => {
      assert.equal(error.code, 1);
      assert.match(
        error.stderr,
        new RegExp(LAB_WARNING.replaceAll(".", "\\.")),
      );
      assert.doesNotMatch(error.stdout, /synthetic text argument/);
      return true;
    },
  );
});
