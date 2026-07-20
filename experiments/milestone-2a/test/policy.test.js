import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const experimentRoot = fileURLToPath(new URL("..", import.meta.url));
const runtimeFiles = [
  "index.html",
  "src/browser-age.js",
  "src/browser-relationship-digest.js",
  "src/browser-sodium.js",
  "src/clipboard.js",
  "src/main.js",
  "src/state.js",
  "src/styles.css",
  "src/view.js",
];

async function runtimeText() {
  return (
    await Promise.all(
      runtimeFiles.map((path) =>
        readFile(new URL(path, `${new URL("../", import.meta.url)}`), "utf8"),
      ),
    )
  ).join("\n");
}

test("runtime source contains no persistence, service-worker, or URL-state calls", async () => {
  const source = await runtimeText();
  for (const pattern of [
    /\blocalStorage\s*[.[]/u,
    /\bsessionStorage\s*[.[]/u,
    /\bindexedDB\s*[.(]/u,
    /\bdocument\.cookie\s*=/u,
    /\bcaches\.(?:open|match|put|delete)\s*\(/u,
    /\bserviceWorker\.(?:register|ready)\b/u,
    /\bclipboard\.read(?:Text)?\s*\(/u,
    /\blocation\.(?:search|hash)\b/u,
  ]) {
    assert.doesNotMatch(source, pattern);
  }
});

test("runtime source contains no remote asset or runtime request", async () => {
  const source = await runtimeText();
  assert.doesNotMatch(source, /(?:src|href)=["']https?:\/\//iu);
  assert.doesNotMatch(
    source,
    /\b(?:fetch|WebSocket|EventSource)\s*\(\s*["']https?:\/\//u,
  );
  assert.doesNotMatch(source, /@import\s+url\(["']?https?:\/\//iu);
});

test("CSP permits WebAssembly without enabling general JavaScript eval", async () => {
  const source = await runtimeText();
  assert.match(source, /script-src 'self' 'wasm-unsafe-eval'/u);
  assert.doesNotMatch(source, /script-src[^\n"]*\s'unsafe-eval'/u);
});

test("experiment directory contains no service worker, manifest, or deployment artifact", async () => {
  const entries = await readdir(experimentRoot, { recursive: true });
  assert.equal(
    entries.some((path) =>
      /(?:^|\/)(?:sw|service-worker)\.[cm]?js$|\.webmanifest$|manifest\.json$/iu.test(
        path,
      ),
    ),
    false,
  );
  assert.equal(
    entries.some((path) => /(?:^|\/)deploy(?:ment)?\//iu.test(path)),
    false,
  );
});

test("runtime avoids protocol-version and positive sender-proof labels", async () => {
  const source = await runtimeText();
  assert.doesNotMatch(
    source,
    /CipherBook\s+v1|\bCBE1\b|\bCBC1\b|protocol version 1/iu,
  );
  assert.doesNotMatch(
    source,
    /Signed by Alice|Verified author|Proven sender|Non-repudiable/iu,
  );
});
