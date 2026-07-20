> [!WARNING]
> **Experimental study harness only. Do not use real secrets, real contacts, or
> identifying participant data. No human study has been run.**

# Milestone 2B: verification-method study harness

## Purpose

This directory contains a disposable, local-only harness for presenting
synthetic match and controlled-mismatch tasks. It lets a human moderator later
observe how participants compare QR, emoji, spoken labels, words, and
hexadecimal. It does not select a verification method, select a displayed
length, define a fingerprint, or begin Milestone 3.

Automated tests and maintainer self-tests are technical evidence only. They are
not participant observations and must not be entered in
[`RESULTS_TEMPLATE.md`](RESULTS_TEMPLATE.md).

## Evidence categories

### Facts

- Every interactive reference starts from a fresh 32-byte value obtained
  locally through `crypto.getRandomValues`. The visual-confusion task then
  constrains one six-bit study position to a declared candidate pair; comparison
  values are exact copies or controlled mutations.
- Every automated fixture is deterministic synthetic data.
- The harness has no identity, contact, message, private-key, public-key, or
  cryptographic-construction input.
- State is held in JavaScript memory and is not automatically persisted or
  uploaded.
- Export requires a moderator to review a summary, confirm, and explicitly
  choose JSON or CSV download.
- QR images and decoding are local. No camera or microphone path exists.

### Assumptions to test with humans

- Participants will compare every displayed group rather than skim.
- English emoji labels and Bytewords are understandable to the sampled
  participants.
- Ordinal positions reduce omission and transposition errors.
- Participants understand that every representation is public and cannot
  decrypt anything.

### Hypotheses

- Different representations and lengths will expose materially different
  false-accept, false-reject, completion-time, rendering, language, and
  accessibility behavior.
- Automated full-digest QR comparison may reduce manual transcription errors
  while creating a different risk: unjustified confidence in what the QR binds
  to a human identity.

### Experiment-only decisions

- Use the first 48, 96, or 144 bits for the manual conditions listed below,
  most-significant-bit first.
- Use a published 64-entry Matrix SAS emoji table with experiment-only English
  labels.
- Use the published 256-entry Bytewords list as a direct byte-to-word mapping.
- Use an unmistakable unstable prefix for synthetic QR payloads.
- Use JSON and CSV only as anonymous local observation exports.

These choices are disposable study instrumentation. They are not normative for
CipherBook and do not resolve any project decision.

## Experimental conditions and mappings

| Condition           | Displayed source | Mapping                                                                                                                                             |
| ------------------- | ---------------: | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Full-digest QR      |         256 bits | All 32 bytes encoded with the experiment-only prefix `CIPHERBOOK-M2B-SYNTHETIC-STUDY-VALUE-UNSTABLE:`; full 64-character hexadecimal fallback shown |
| Visual emoji — 8    |          48 bits | First 48 bits split MSB-first into eight 6-bit indices                                                                                              |
| Visual emoji — 16   |          96 bits | First 96 bits split MSB-first into sixteen 6-bit indices                                                                                            |
| Visual emoji — 24   |         144 bits | First 144 bits split MSB-first into twenty-four 6-bit indices                                                                                       |
| Spoken emoji labels |          96 bits | Same sixteen indices as visual emoji — 16; English labels only                                                                                      |
| Word list           |          96 bits | First twelve bytes map directly to twelve Bytewords entries                                                                                         |
| Grouped hexadecimal |          96 bits | First twelve bytes as 24 lowercase characters in six numbered groups of four                                                                        |

The spoken-label, word, and hexadecimal conditions all use the same first 96
source bits. Bit selection does not change per participant after task
generation.

### Security interpretation of shortening

Displaying `n` bits preserves at most `n` displayed bits. A one-sided targeted
search against one fixed value is generally on the order of `2^n`. An active
intermediary able to choose two substituted values may use a generic two-value
collision search around `2^(n/2)`:

| Displayed bits | Approximate generic active two-value work |
| -------------: | ----------------------------------------: |
|             48 |                                    `2^24` |
|             96 |                                    `2^48` |
|            144 |                                    `2^72` |
|            256 |                                   `2^128` |

These work factors do not measure human performance. Skimming, omissions,
rendering differences, language barriers, and transcription errors can reduce
the effective comparison below the displayed bit count. A final length cannot
be chosen from arithmetic alone.

## Controlled tasks

Each selected condition receives one exact-match task. Manual conditions also
receive beginning, middle, and ending substitutions; an adjacent
transposition; one omission; and one duplication. Visual emoji adds an
experiment-only candidate glyph/category-confusion substitution. QR adds one
different complete digest. Inapplicable mismatch classes are omitted rather
than forced.

Automated fixture generation is deterministic from a test seed for
reproducibility. Interactive references are generated locally and task ordering
may be fixed or shuffled from a separate local random seed. No collision or key
search is performed.

## Study workflow

1. The moderator enters a code matching `P01`-style syntax, selects conditions,
   and chooses fixed or locally randomized order.
2. The moderator sees the answer key and reference material.
3. Starting a task switches to a participant view that hides the answer key and
   starts `performance.now()` timing.
4. The participant chooses **Match**, **Mismatch**, or **Unsure**, with optional
   confidence from 1 through 3.
5. The moderator sees the outcome, enters a repeat count for spoken tasks and an
   optional short non-identifying observation, then saves and advances.
6. After all tasks, the moderator reviews an aggregate summary and must confirm
   before choosing an explicit local JSON or CSV download.

The moderator can pause a task without recording a response. Restarting begins
a new timer. No automatic time limit ends a task.

See [`STUDY_PROTOCOL.md`](STUDY_PROTOCOL.md) before involving participants and
[`DATA_SCHEMA.md`](DATA_SCHEMA.md) for every export field.

## QR technical scope

The QR dependency encodes and decodes the complete experiment-only payload in
the browser and Node tests. Browser automation draws a generated image to a
canvas and verifies recovery of the exact 32 source bytes. The harness does not
request camera permission, retain images, upload images, or auto-confirm a human
identity. Generated-image decoding is not evidence about real camera usability.

## Published mapping sources and dependencies

- Emoji table: Matrix `matrix-spec` `data-definitions/sas-emoji.json` at commit
  `4c2bb5aae19dcb15e2bee3127d57de80b5068195`, Apache License 2.0. Only the
  index, normative code-point sequence, and English label are copied.
- Word list: Blockchain Commons BCR-2020-012 Bytewords, the exact 256-entry
  list, BSD-2-Clause-Patent. This experiment uses only the direct byte mapping;
  it does not claim Bytewords checksum or container compatibility.
- QR package: `@nuintun/qrcode` 5.0.3, MIT. It is the only new direct package,
  provides both local encoding and decoding, and has one transitive helper:
  `tslib` 2.8.1 under the 0BSD license. Package metadata, release activity,
  license, transitive dependency, archive, and source request/storage patterns
  were inspected on 2026-07-20.

Complete notices are in [`ATTRIBUTIONS.md`](ATTRIBUTIONS.md). No remote emoji
artwork, font, script, or runtime service is used.

## Run locally

This repository records Node 26.4.0 as the tested Node version. Other Node
versions are untested.

```text
npm ci
npm run lab:2b:dev
```

Open `http://127.0.0.1:4174`. This local server is experiment tooling, not a
hosting or deployment choice.

## Automated checks

```text
npm run check
npm run test:interop
npm run test:browser:chromium
npm run test:browser:firefox
npm run test:cross-runtime
npm run lab:2a:build
npm run check:browser-build
npm run test:study:unit
npm run test:study:qr
npm run test:study:chromium
npm run test:study:firefox
npm run lab:2b:build
npm run check:study-build
```

## Local technical evidence

Recorded on macOS arm64 on 2026-07-20:

| Component                       | Exact tested value |
| ------------------------------- | ------------------ |
| Node                            | 26.4.0             |
| npm                             | 11.17.0            |
| Playwright Test                 | 1.61.1             |
| Chromium supplied by Playwright | 149.0.7827.55      |
| Firefox supplied by Playwright  | 151.0              |
| `@nuintun/qrcode`               | 5.0.3              |
| `tslib`                         | 2.8.1              |

- Thirty-five representation, task-generation, result, QR, attribution, and
  policy tests passed. The separately invoked QR subset passed all three tests.
- Chromium passed 9 of 9 and Firefox passed 9 of 9 workflow, QR,
  accessibility-oriented, export, reset, storage, media, and network checks.
- Generated QR matrices and rendered images both decoded to the exact 32
  synthetic source bytes in both browser engines.
- Browser observations found empty local storage, session storage, cookies,
  IndexedDB, Cache Storage, and service-worker registrations, with no request
  outside the local test origin and no camera or microphone request.
- Exact emoji strings, English labels, and ordinals were identical in the DOM
  assertions. Visual glyph shapes were not image-compared or judged by humans;
  no cross-platform rendering conclusion follows.
- Keyboard focus and response activation passed. No screen reader was tested.
- The build contained one local HTML file (10,045 bytes), one local CSS file
  (3,749 bytes), and one local JavaScript file (76,936 bytes). Bundle inspection
  found no remote runtime URL, persistence call, media path, service worker,
  web manifest, or protocol marker covered by the policy checks.
- `npm audit` and `npm audit --omit=dev` each reported zero known
  vulnerabilities at the time of the run. This registry result is not an
  independent review or prediction about future package state.
- `npm ci` reported unapproved install scripts for optional development-only
  `fsevents` packages inherited from existing Playwright/Vite tooling. They were
  not approved or executed; the tested toolchains completed without them.
- The complete Milestone 1 and Milestone 2A regression suites also passed,
  including official age 1.3.1 interoperability. That regression evidence does
  not select a construction.

No human participant result appears in this technical evidence.

## Accessibility and language boundary

- Every emoji includes visible English text, an ordinal, an accessible label,
  and an exact code-point sequence in the mapping source.
- Every spoken label, word, and hex group is numbered.
- Color is never the sole distinction, controls have explicit labels, response
  controls are keyboard operable, and no animation is required.
- QR has a full textual fallback.
- The harness imposes no automatic time limit and respects reduced-motion
  preferences.

Automated checks cannot establish screen-reader usability, pronunciation across
accents, English-language comprehension, or cross-platform glyph
distinguishability. Those require actual participants and tested environments.

## Anonymous observation boundary

The export records condition, displayed bits, ground truth, mismatch class and
location, participant response, correctness, false-accept/false-reject flags,
unsure, elapsed milliseconds, optional confidence, spoken repeat count, and a
short moderator observation. It contains no stimuli or study seed.

Do not put names, emails, phone numbers, employers, accounts, device or network
identifiers, free-form biographies, real digests, contacts, messages, keys,
clipboard data, audio, or images into the harness or its observation field.

The application does not automatically save or upload observations. Explicitly
downloaded files remain on the moderator's device. Clear and reload reset the
interface state, but JavaScript cannot guarantee erasure from browser,
operating-system, crash, swap, or instrumentation layers.

## Explicit exclusions

- Real identities, contacts, relationship values, messages, keys, or secrets
- A final verification representation or displayed length
- A cryptographic-construction or sender-authentication decision
- A CipherBook envelope, serialization, stable format, or protocol bytes
- Persistence, accounts, vault, passphrases, recovery, or migration
- Telemetry, analytics, remote collection, backend services, or personal data
- Camera, microphone, audio recording, speech recognition, or image retention
- PWA, service worker, offline installation, hosting, GitHub Pages, or deployment
- Safari, WebKit, mobile, screen-reader, or camera usability claims
- Human-study findings, a winning method, Milestone 3 analysis, or product claims

## Decisions still unresolved

1. libsodium `crypto_box` versus age/Typage or another maintained construction;
2. recipient-local authentication versus transferable signatures;
3. a custom envelope versus an existing envelope format;
4. fingerprint representation and length;
5. QR-first versus spoken or manual verification;
6. serialization or no new serialization;
7. persistent vault and recovery;
8. hosting and deployment; and
9. protocol version 1 bytes.

No result from this harness resolves any item above.
