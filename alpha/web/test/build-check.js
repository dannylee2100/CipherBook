import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const buildRoot = fileURLToPath(new URL("../dist/", import.meta.url));
const entries = await readdir(buildRoot, { recursive: true });
const files = entries.filter((entry) => /\.(?:html|css|js)$/u.test(entry));
assert.ok(
  files.length >= 3,
  "Preview build must contain HTML, CSS, and JavaScript",
);

const html = await readFile(
  new URL("index.html", new URL("../dist/", import.meta.url)),
  "utf8",
);
const output = (
  await Promise.all(
    files.map((entry) =>
      readFile(new URL(entry, new URL("../dist/", import.meta.url)), "utf8"),
    ),
  )
).join("\n");

// The bundled sodium runtime retains a worker-only XMLHttpRequest loader. The
// source policy rejects application use of that API, while storage.spec.js
// audits the production bundle and permits only its initial HTML/CSS/JS loads.
for (const pattern of [
  /(?:src|href)=["']https?:\/\//iu,
  /\b(?:fetch|WebSocket|EventSource|sendBeacon)\s*\(/u,
  /\blocalStorage\s*[.[]/u,
  /\bsessionStorage\s*[.[]/u,
  /\bindexedDB\s*[.(]/u,
  /\bdocument\.cookie\s*=/u,
  /\bcaches\.(?:open|match|put|delete)\s*\(/u,
  /\bserviceWorker\.register\b/u,
  /\b(?:showSaveFilePicker|showOpenFilePicker|getDirectory)\s*\(/u,
  /CipherBook\s+v1|\bCBE1\b|\bCBC1\b/iu,
  /Verified author|Signed by|Proven sender|Authenticated to third parties/iu,
  /AGE-SECRET-KEY|age-encryption/iu,
  /(?:Reset your password|Forgot (?:your )?password|Recover (?:your )?passphrase)/iu,
  /(?:production[- ]ready|has been independently reviewed|has been human[- ]validated)/iu,
  /(?:stable|canonical|compatible) identity[- ]file format/iu,
  /(?:Copy|Display|Download) (?:the )?(?:unencrypted )?private key/iu,
  /\b(?:analytics|telemetry)\b/iu,
  /autocomplete=["'](?:new-password|current-password)["']/iu,
  /password managers? (?:cannot|can't|will not|won't|never) (?:save|store|retain|fill)/iu,
]) {
  assert.doesNotMatch(output, pattern);
}

assert.match(output, /experimental, unreviewed preview/iu);
assert.match(
  output,
  /not been independently reviewed or tested with representative\s+users/iu,
);
assert.match(output, /recipient-forgeable/iu);
assert.match(output, /not third-party proof of authorship/iu);
assert.match(output, /password managers/iu);
assert.match(output, /not protocol v1 or a\s+compatibility promise/iu);
assert.match(output, /GitHub may observe\s+ordinary hosting metadata/iu);
assert.match(output, /does not send usage reports/iu);
assert.doesNotMatch(output, /CIPHERBOOK_BUILD_(?:LABEL|COMMIT)/u);

const expectedBase = process.env.CIPHERBOOK_BASE_PATH;
if (expectedBase) {
  assert.match(
    html,
    new RegExp(
      `(?:src|href)="${expectedBase.replaceAll("/", "\\/")}assets/`,
      "u",
    ),
  );
}

const expectedCommit = process.env.CIPHERBOOK_BUILD_COMMIT;
if (expectedCommit) {
  assert.match(output, new RegExp(expectedCommit, "u"));
}

assert.equal(
  entries.some((entry) =>
    /(?:^|\/)(?:sw|service-worker)\.[cm]?js$|\.webmanifest$/iu.test(entry),
  ),
  false,
  "Preview build must not contain a service worker or web manifest",
);

assert.ok(entries.includes(".nojekyll"), "Pages build must include .nojekyll");

console.log(`Checked ${files.length} locally bundled preview files.`);
