import { execFile, spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

import { boundedBytes, utf8 } from "./bytes.js";
import { MAX_AGE_ARMOR_BYTES, MAX_PLAINTEXT_BYTES } from "./constants.js";
import { exportAgeContact } from "./age.js";

const execFileAsync = promisify(execFile);
const maximumProcessOutput = MAX_AGE_ARMOR_BYTES + MAX_PLAINTEXT_BYTES;

function ageExecutable() {
  return process.env.CIPHERBOOK_LAB_AGE_BIN || "age";
}

async function runAge(arguments_, input) {
  return new Promise((resolve, reject) => {
    const child = spawn(ageExecutable(), arguments_, {
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
    });
    const stdoutChunks = [];
    const stderrChunks = [];
    let stdoutBytes = 0;
    let stderrBytes = 0;
    let outputLimitExceeded = false;

    child.stdout.on("data", (chunk) => {
      stdoutBytes += chunk.length;
      if (stdoutBytes > maximumProcessOutput) {
        outputLimitExceeded = true;
        child.kill();
        return;
      }
      stdoutChunks.push(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderrBytes += chunk.length;
      if (stderrBytes <= maximumProcessOutput) {
        stderrChunks.push(chunk);
      }
    });
    child.once("error", (error) => {
      reject(
        new Error("official age CLI could not be started", { cause: error }),
      );
    });
    child.once("close", (code, signal) => {
      if (outputLimitExceeded) {
        reject(
          new Error("official age CLI output exceeded the laboratory limit"),
        );
        return;
      }
      if (code !== 0) {
        const diagnostic = Buffer.concat(stderrChunks).toString("utf8").trim();
        reject(
          new Error(
            `official age CLI failed (${signal || `exit ${code}`})${
              diagnostic ? `: ${diagnostic}` : ""
            }`,
          ),
        );
        return;
      }
      resolve(new Uint8Array(Buffer.concat(stdoutChunks)));
    });

    child.stdin.on("error", (error) => {
      if (error.code !== "EPIPE") {
        child.kill();
      }
    });
    child.stdin.end(Buffer.from(input));
  });
}

export async function officialAgeVersion() {
  try {
    const { stdout, stderr } = await execFileAsync(
      ageExecutable(),
      ["--version"],
      {
        encoding: "utf8",
        maxBuffer: 4096,
        windowsHide: true,
      },
    );
    return `${stdout}${stderr}`.trim();
  } catch (error) {
    throw new Error("official age CLI is unavailable", { cause: error });
  }
}

export async function encryptWithOfficialAge(plaintext, recipientContact) {
  const message = boundedBytes(plaintext, MAX_PLAINTEXT_BYTES, "plaintext");
  const recipient = exportAgeContact(recipientContact);
  const output = await runAge(["--armor", "--recipient", recipient], message);
  return Buffer.from(output).toString("utf8");
}

export async function decryptWithOfficialAge(armoredEnvelope, identity) {
  if (typeof armoredEnvelope !== "string") {
    throw new TypeError("native age armor must be a string");
  }
  if (utf8(armoredEnvelope).length > MAX_AGE_ARMOR_BYTES) {
    throw new RangeError("native age armor exceeds the laboratory limit");
  }
  if (
    identity === null ||
    typeof identity !== "object" ||
    typeof identity.secret !== "string"
  ) {
    throw new TypeError("age identity must contain a secret string");
  }

  const temporaryDirectory = await mkdtemp(
    join(tmpdir(), "cipherbook-age-lab-"),
  );
  const identityPath = join(temporaryDirectory, "DISPOSABLE-IDENTITY.txt");
  try {
    await writeFile(
      identityPath,
      `# INSECURE DISPOSABLE TEST IDENTITY\n${identity.secret}\n`,
      { encoding: "utf8", mode: 0o600 },
    );
    return await runAge(
      ["--decrypt", "--identity", identityPath],
      utf8(armoredEnvelope),
    );
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
}
