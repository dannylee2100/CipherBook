import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const alphaRoot = fileURLToPath(new URL("..", import.meta.url));
const repositoryRoot = new URL("../../../", import.meta.url);
const runtimeFiles = [
  "index.html",
  "src/clipboard.js",
  "src/emoji.js",
  "src/fingerprint.js",
  "src/identity-file-crypto.js",
  "src/identity-file-download.js",
  "src/identity-file-input.js",
  "src/identity-file.js",
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

test("Alpha 1 runtime contains no automatic persistence, service worker, or URL state", async () => {
  const source = await runtimeText();
  for (const pattern of [
    /\blocalStorage\s*[.[]/u,
    /\bsessionStorage\s*[.[]/u,
    /\bindexedDB\s*[.(]/u,
    /\bdocument\.cookie\s*=/u,
    /\bcaches\.(?:open|match|put|delete)\s*\(/u,
    /\bserviceWorker\.(?:register|ready)\b/u,
    /\b(?:showSaveFilePicker|showOpenFilePicker|getDirectory)\s*\(/u,
    /\blocation\.(?:search|hash)\b/u,
    /\bbeforeunload\b/u,
  ]) {
    assert.doesNotMatch(source, pattern);
  }
});

test("Alpha 1 runtime contains no remote assets, requests, analytics, or telemetry", async () => {
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

test("Alpha 1 has no age mode, clear private-key output, or positive authorship wording", async () => {
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
  assert.doesNotMatch(
    source,
    /new\s+Blob\s*\(\s*\[\s*(?:identity\.)?privateKey|writeText\s*\(\s*(?:identity\.)?privateKey/iu,
  );
});

test("Alpha 1 runtime never persists, logs, copies, shares, or names a passphrase", async () => {
  const source = await runtimeText();
  for (const pattern of [
    /console\.(?:log|info|warn|error|debug)\s*\([^)]*passphrase/iu,
    /(?:localStorage|sessionStorage|indexedDB|document\.cookie)[^\n]*passphrase/iu,
    /clipboard\.writeText\s*\([^)]*passphrase/iu,
    /navigator\.share\s*\([^)]*passphrase/iu,
    /download\s*=\s*[^\n]*passphrase/iu,
    /[?&#](?:passphrase|password)=/iu,
  ]) {
    assert.doesNotMatch(source, pattern);
  }
  const stateSource = await readFile(
    new URL("../src/state.js", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(stateSource, /passphrase/iu);
});

test("all identity passphrase controls request autocomplete off without claiming exclusion", async () => {
  const html = await readFile(
    new URL("../index.html", import.meta.url),
    "utf8",
  );
  for (const id of [
    "identity-import-passphrase",
    "identity-export-passphrase",
    "identity-export-confirmation",
  ]) {
    const field = html.match(
      new RegExp(`<input[^>]*\\bid="${id}"[^>]*>`, "isu"),
    )?.[0];
    assert.ok(field, `missing ${id}`);
    assert.match(field, /type="password"/iu);
    assert.match(field, /autocomplete="off"/iu);
    assert.match(field, /autocapitalize="none"/iu);
    assert.doesNotMatch(
      field,
      /autocomplete="(?:new-password|current-password)"/iu,
    );
  }
  assert.doesNotMatch(html, /remember[- ]passphrase/iu);
  assert.match(
    html,
    /browsers,\s+extensions, password managers, operating systems, and crash data may\s+still retain or offer to fill it/iu,
  );
});

test("documentation does not claim password-manager prevention", async () => {
  const documentation = (
    await Promise.all(
      [
        "README.md",
        "alpha/web/README.md",
        "alpha/web/KNOWN_LIMITATIONS.md",
        "docs/THREAT_MODEL.md",
        "docs/LIMITATIONS.md",
        "docs/decisions/ALPHA-0002-encrypted-identity-file.md",
      ].map((path) => readFile(new URL(path, repositoryRoot), "utf8")),
    )
  ).join("\n");

  assert.doesNotMatch(
    documentation,
    /password managers? (?:cannot|can't|will not|won't|never) (?:save|store|retain|fill)/iu,
  );
  assert.match(documentation, /autocomplete=[`"]off[`"]/iu);
  assert.match(
    documentation,
    /(?:not a guarantee|cannot prevent|does not prevent|may still retain or offer to fill)/iu,
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
  assert.doesNotMatch(
    source,
    /(?:production[- ]ready|has been independently reviewed|is independently reviewed|has been human[- ]validated|is human[- ]validated|stable identity[- ]file format|compatible identity[- ]file format)/iu,
  );
  assert.doesNotMatch(
    source,
    /(?:supports|offers|provides|includes).{0,40}(?:password reset|passphrase recovery)/iu,
  );
  assert.match(source, /There is no password reset/iu);
  assert.match(
    source,
    /CipherBook cannot verify where the browser stored the file or whether you retained it/iu,
  );
  assert.doesNotMatch(
    source,
    /Identity safely backed up|Export complete|File securely saved|Recovery configured/iu,
  );
});

test("Alpha 1 contains no PWA, service worker, deployment, or participant data artifact", async () => {
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

test("Alpha 1 styling includes visible focus and reduced-motion handling", async () => {
  const source = await runtimeText();
  assert.match(source, /:focus-visible/u);
  assert.match(source, /prefers-reduced-motion:\s*reduce/u);
  assert.match(source, /outline:/u);
});
