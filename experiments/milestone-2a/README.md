> [!WARNING]
> **Experimental laboratory only. Do not use real secrets. All identities and
> messages disappear when this page is cleared or reloaded.**

# Milestone 2A: memory-only browser envelope workflow

## Purpose

This locally run browser experiment tests whether the same temporary-contact,
comparison, seal, copy, and open workflow can run for both Milestone 1
construction candidates. It gathers browser feasibility and wording evidence.
It does not select sodium or age, approve hexadecimal verification, define a
protocol, or authorize Milestone 2B.

## Run locally

The repository has tested Node 26.4.0 only. Other Node versions are untested.
The official age interoperability probes also require `age` 1.3.1 on `PATH`.

```text
npm ci
npx playwright install chromium firefox
npm run lab:2a:dev
```

Open `http://127.0.0.1:4173`. The server is local experiment tooling, not a
hosting or deployment design.

Validation commands are:

```text
npm run check
npm run test:interop
npm run test:browser:chromium
npm run test:browser:firefox
npm run test:cross-runtime
npm run lab:2a:build
npm run check:browser-build
```

## Construction study controls

The selector is labeled **Study control — not a user-selectable final
algorithm**. Switching it clears the current identity, contact, diagnostic,
confirmation, plaintext, and envelope state.

### Sodium relationship experiment

The browser reuses the unstable `CBLAB-SODIUM-A` envelope and contact handling
from Milestone 1. Its user-facing statement is:

> This mode performs a recipient-local expected-sender key check. The recipient
> can forge a transcript that their own client accepts. It is not proof to a
> third party that the claimed sender authored the message.

Later disclosure of either static private key can expose retained envelopes for
the relationship. No signature or third-party authorship proof is provided.

### Native age experiment

The browser uses native age armor without a CipherBook wrapper. Its user-facing
statement is:

> Encrypted for this recipient. The sender is not cryptographically verified by
> this envelope.

Anyone with the public age recipient can create an envelope that the recipient
opens. Later compromise of the recipient identity can expose retained
envelopes. No sender identity is inferred from age armor.

## Relationship diagnostic

Both modes reuse the Milestone 1 tagged, ordered, length-delimited relationship
input and display the complete SHA-256 result as 64 hexadecimal characters.
The interface labels it `UX EXPERIMENT ONLY`, public, not a password, not an
encryption key, and not a selected fingerprint format. Sealing remains disabled
until the user explicitly states that the entire value was compared through a
separate trusted interaction.

Hexadecimal is neutral technical instrumentation here. This milestone does not
test or approve its usability, representation, or length.

## Memory-only boundary

- Private identity material exists only in JavaScript memory.
- The interface never displays, downloads, or exports a private identity.
- Clear drops all application references and overwrites sodium private-key byte
  arrays where practical.
- Reload starts with no identity, contact, confirmation, plaintext, or envelope.
- JavaScript cannot guarantee reliable memory erasure.
- Plaintext copying is a separate explicit action and warns that the operating
  system or other applications may retain clipboard contents.

The runtime does not use IndexedDB, local storage, session storage, cookies,
Cache Storage, file-system persistence, URL query or fragment state, or service
workers. Automated tests inspect these stores after both construction workflows.

## Tooling and direct dependencies

| Dependency           | Exact version | Role in this experiment                                                                             |
| -------------------- | ------------- | --------------------------------------------------------------------------------------------------- |
| `libsodium-wrappers` | 0.8.4         | Existing high-level sodium construction used by both Node and browser experiments                   |
| `age-encryption`     | 0.3.0         | Existing Typage implementation for native age identities, armor, sealing, and opening               |
| `vite`               | 8.1.5         | Development-only local server and disposable static bundler; it does not select future architecture |
| `@playwright/test`   | 1.61.1        | Development-only Chromium and Firefox automation and cross-runtime test harness                     |
| `prettier`           | 3.9.5         | Existing deterministic formatter                                                                    |

All runtime imports are bundled locally. The page loads no remote scripts,
styles, fonts, images, analytics, telemetry, or runtime API.

The tested `libsodium-wrappers` WebAssembly distribution requires the narrow
Content Security Policy source `'wasm-unsafe-eval'`. The experiment does not
enable general JavaScript `'unsafe-eval'`. This observed CSP constraint is
browser feasibility evidence, not a production policy recommendation.

## Browser test scope

Automated tests exercise Chromium and Firefox supplied by Playwright 1.61.1.
Exact observed browser versions and results are recorded in [RESULTS.md](RESULTS.md).
Safari, WebKit, mobile browsers, browser extensions, compromised endpoints, and
production hosting remain untested.

## Explicit exclusions

Milestone 2A does not include emoji, words, spoken comparison, QR, cameras,
contact lists, chat, history, persistence, passphrases, vaults, recovery, PWA
installation, manifests, service workers, native packaging, hosting, GitHub
Pages, telemetry, remote runtime services, signatures, a custom wrapper around
age, a stable browser or CLI API, protocol bytes, a construction recommendation,
real secrets, or Milestone 2B work.
