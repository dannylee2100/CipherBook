import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const experimentRoot = fileURLToPath(new URL("..", import.meta.url));
const repositoryRoot = new URL("../../../", import.meta.url);
const runtimeFiles = [
  "index.html",
  "src/constants.js",
  "src/emoji-table.js",
  "src/main.js",
  "src/qr.js",
  "src/representations.js",
  "src/results.js",
  "src/state.js",
  "src/styles.css",
  "src/task-generator.js",
  "src/view.js",
  "src/word-list.js",
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

test("runtime contains no automatic persistence or URL state", async () => {
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

test("runtime contains no remote request, telemetry, camera, microphone, or audio path", async () => {
  const source = await runtimeText();
  for (const pattern of [
    /(?:src|href)=["']https?:\/\//iu,
    /\b(?:fetch|WebSocket|EventSource|sendBeacon)\s*\(/u,
    /\bXMLHttpRequest\b/u,
    /@import\s+url\(["']?https?:\/\//iu,
    /\bgetUserMedia\s*\(/u,
    /\bMediaRecorder\b/u,
    /\bSpeechRecognition\b/u,
    /\bwebkitSpeechRecognition\b/u,
    /\bclipboard\.read(?:Text)?\s*\(/u,
  ]) {
    assert.doesNotMatch(source, pattern);
  }
});

test("runtime has no weak study PRNG or participant coaching language", async () => {
  const source = await runtimeText();
  assert.doesNotMatch(source, /\bMath\.random\s*\(/u);
  assert.doesNotMatch(source, /\bMath\.imul\s*\(/u);
  assert.doesNotMatch(source, /\bfnv1a32\b/u);
  assert.doesNotMatch(source, /compare every (?:item|entry|group)/iu);
  assert.doesNotMatch(source, /(?:do not|don't) (?:skim|check only)/iu);
});

test("runtime labels synthetic values and makes no final recommendation", async () => {
  const source = await runtimeText();
  for (const label of [
    "SYNTHETIC STUDY VALUE",
    "NOT A KEY",
    "NOT A PASSWORD",
    "NOT A REAL CONTACT FINGERPRINT",
  ]) {
    assert.match(source, new RegExp(label, "u"));
  }
  assert.doesNotMatch(
    source,
    /recommended verification method|approved fingerprint length|selected fingerprint format|CipherBook\s+v1|\bCBE1\b|\bCBC1\b/iu,
  );
});

test("experiment directory contains no service worker, manifest, deployment, or participant result", async () => {
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
  assert.equal(
    entries.some((path) => /(?:^|\/)RESULTS\.(?:md|json|csv)$/iu.test(path)),
    false,
  );
});

test("QR is labeled as a separate technical demonstration, not a participant condition", async () => {
  const source = await runtimeText();
  assert.match(source, /moderator-only QR technical demonstration/iu);
  assert.match(source, /not a participant task/iu);
  assert.doesNotMatch(source, /id:\s*["']qr-256["']/u);
});

test("the QR dependency and Alpha 1 sodium-wrapper replacement are exact", async () => {
  const packageValue = JSON.parse(
    await readFile(new URL("package.json", repositoryRoot), "utf8"),
  );
  assert.equal(packageValue.dependencies["@nuintun/qrcode"], "5.0.3");
  assert.equal(packageValue.dependencies["libsodium-wrappers-sumo"], "0.8.4");
  assert.deepEqual(Object.keys(packageValue.dependencies).sort(), [
    "@nuintun/qrcode",
    "age-encryption",
    "libsodium-wrappers-sumo",
  ]);
});

test("licensed study mappings have attribution documentation", async () => {
  const attribution = await readFile(
    new URL("../ATTRIBUTIONS.md", import.meta.url),
    "utf8",
  );
  assert.match(attribution, /matrix-spec/iu);
  assert.match(attribution, /4c2bb5aae19dcb15e2bee3127d57de80b5068195/u);
  assert.match(attribution, /Apache License 2\.0/iu);
  assert.match(attribution, /Blockchain Commons/iu);
  assert.match(attribution, /bacd8054be636ec48b0118763384cf6c7f947ab7/u);
  assert.match(attribution, /BSD-2-Clause-Patent/iu);
  assert.match(attribution, /@nuintun\/qrcode/iu);
  assert.match(attribution, /MIT License/iu);
});
