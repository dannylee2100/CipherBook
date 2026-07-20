import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const buildRoot = fileURLToPath(new URL("../dist/", import.meta.url));
const entries = await readdir(buildRoot, { recursive: true });
const files = entries.filter((entry) => /\.(?:html|css|js)$/u.test(entry));
assert.ok(
  files.length >= 3,
  "browser build must contain HTML, CSS, and JavaScript",
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
  /\b(?:fetch|WebSocket|EventSource)\s*\(\s*["']https?:\/\//u,
  /\blocalStorage\s*[.[]/u,
  /\bsessionStorage\s*[.[]/u,
  /\bindexedDB\s*[.(]/u,
  /\bdocument\.cookie\s*=/u,
  /\bserviceWorker\.register\b/u,
  /CipherBook\s+v1|\bCBE1\b|\bCBC1\b|protocol version 1/iu,
]) {
  assert.doesNotMatch(output, pattern);
}

assert.equal(
  entries.some((entry) =>
    /(?:^|\/)(?:sw|service-worker)\.[cm]?js$|\.webmanifest$/iu.test(entry),
  ),
  false,
  "browser build must not contain a service worker or web manifest",
);

console.log(`Checked ${files.length} locally bundled browser files.`);
