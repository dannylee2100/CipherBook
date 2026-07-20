import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const buildRoot = fileURLToPath(new URL("../dist/", import.meta.url));
const entries = await readdir(buildRoot, { recursive: true });
const files = entries.filter((entry) => /\.(?:html|css|js)$/u.test(entry));
assert.ok(
  files.length >= 3,
  "study build must contain HTML, CSS, and JavaScript",
);

const output = (
  await Promise.all(
    files.map((entry) =>
      readFile(new URL(entry, new URL("../dist/", import.meta.url)), "utf8"),
    ),
  )
).join("\n");

for (const pattern of [
  /(?:src|href)=["']https?:\/\//iu,
  /\b(?:fetch|WebSocket|EventSource|sendBeacon)\s*\(/u,
  /\bXMLHttpRequest\b/u,
  /\blocalStorage\s*[.[]/u,
  /\bsessionStorage\s*[.[]/u,
  /\bindexedDB\s*[.(]/u,
  /\bdocument\.cookie\s*=/u,
  /\bserviceWorker\.register\b/u,
  /\bgetUserMedia\s*\(/u,
  /\bMediaRecorder\b/u,
  /\bMath\.random\s*\(/u,
  /\bMath\.imul\s*\(/u,
  /\bfnv1a32\b/u,
  /compare every (?:item|entry|group)/iu,
  /(?:do not|don't) (?:skim|check only)/iu,
  /CipherBook\s+v1|\bCBE1\b|\bCBC1\b/iu,
]) {
  assert.doesNotMatch(output, pattern);
}

assert.equal(
  entries.some((entry) =>
    /(?:^|\/)(?:sw|service-worker)\.[cm]?js$|\.webmanifest$/iu.test(entry),
  ),
  false,
  "study build must not contain a service worker or web manifest",
);

console.log(`Checked ${files.length} locally bundled Milestone 2B files.`);
