import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const alphaRoot = fileURLToPath(new URL("..", import.meta.url));
const runtimeFiles = [
  "index.html",
  "src/clipboard.js",
  "src/emoji.js",
  "src/fingerprint.js",
  "src/main.js",
  "src/share.js",
  "src/sodium-adapter.js",
  "src/state.js",
  "src/styles.css",
  "src/view.js",
];

async function runtimeText() {
  return (
    await Promise.all(
      runtimeFiles.map((path) =>
        readFile(new URL(path, new URL("../", import.meta.url)), "utf8"),
      ),
    )
  ).join("\n");
}

test("Alpha 0 runtime contains no persistence, service-worker, or URL-state calls", async () => {
  const source = await runtimeText();
  for (const pattern of [
    /\blocalStorage\s*[.[]/u,
    /\bsessionStorage\s*[.[]/u,
    /\bindexedDB\s*[.(]/u,
    /\bdocument\.cookie\s*=/u,
    /\bcaches\.(?:open|match|put|delete)\s*\(/u,
    /\bserviceWorker\.(?:register|ready)\b/u,
    /\blocation\.(?:search|hash)\b/u,
  ]) {
    assert.doesNotMatch(source, pattern);
  }
});

test("Alpha 0 runtime contains no remote assets, requests, analytics, or telemetry", async () => {
  const source = await runtimeText();
  for (const pattern of [
    /(?:src|href)=["']https?:\/\//iu,
    /@import\s+url\(["']?https?:\/\//iu,
    /\b(?:fetch|WebSocket|EventSource|sendBeacon)\s*\(/u,
    /\bXMLHttpRequest\b/u,
    /\banalytics\b/iu,
    /\btelemetry\b/iu,
  ]) {
    assert.doesNotMatch(source, pattern);
  }
});

test("Alpha 0 has no age mode, private-key export, or positive authorship wording", async () => {
  const source = await runtimeText();
  assert.doesNotMatch(source, /milestone-1\/src\/age\.js|age-encryption/iu);
  assert.doesNotMatch(source, /mode-select|construction selector/iu);
  assert.doesNotMatch(
    source,
    /Verified author|Signed by|Proven sender|Authenticated to third parties|Non-repudiable/iu,
  );
  assert.doesNotMatch(
    source,
    /base64urlEncode\s*\(\s*identity\.privateKey|download.*private|copy.*private/iu,
  );
});

test("warnings preserve unstable, unvalidated, and no-real-secrets boundaries", async () => {
  const source = await runtimeText();
  assert.match(source, /not been independently reviewed or human-validated/iu);
  assert.match(source, /Do not use\s+real secrets/iu);
  assert.match(source, /Experimental convenience view/iu);
  assert.match(source, /First 96 bits only/iu);
  assert.match(source, /not third-party proof of\s+authorship/iu);
  assert.doesNotMatch(
    source,
    /has been human-validated|usability-validated|participants (?:confirmed|validated)|study (?:proved|shows)/iu,
  );
  assert.doesNotMatch(source, /CipherBook\s+v1|\bCBE1\b|\bCBC1\b/iu);
});

test("Alpha 0 contains no PWA, service worker, deployment, or participant data artifact", async () => {
  const entries = await readdir(alphaRoot, { recursive: true });
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
  assert.equal(
    entries.some((path) => /participant|study-data|raw-results/iu.test(path)),
    false,
  );
});

test("Alpha 0 styling includes visible focus and reduced-motion handling", async () => {
  const source = await runtimeText();
  assert.match(source, /:focus-visible/u);
  assert.match(source, /prefers-reduced-motion:\s*reduce/u);
  assert.match(source, /outline:/u);
});
