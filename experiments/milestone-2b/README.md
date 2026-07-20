> [!WARNING]
> **Experimental study harness only. Do not use real secrets, real contacts, or
> identifying participant data. No human study has been run.**

# Milestone 2B: verification-method study harness

## Purpose

This directory contains a disposable, local-only harness for a later moderated
pilot of six manual public-verification representations. It presents synthetic
exact-match and controlled-mismatch tasks under a predeclared eight-arm plan.
It does not select a representation, select a displayed length, define a
fingerprint, or begin Milestone 3.

QR encoding and exact generated-image decoding remain a separate
moderator-only technical demonstration. QR is not a participant condition and
does not enter manual false-accept, false-reject, unsure, or completion-time
metrics.

Automated tests and maintainer self-tests are technical evidence only. They are
not participant observations and must not be entered in
[`RESULTS_TEMPLATE.md`](RESULTS_TEMPLATE.md).

## Evidence categories

### Facts

- The manual plan has eight predeclared arms, `A` through `H`.
- Every arm has 24 tasks: four tasks for each of six manual conditions.
- Every condition within every arm has at least one exact match and at least one
  controlled mismatch. Condition-level ratios vary among 1/3, 2/2, and 3/1;
  every arm still totals 12 matches and 12 mismatches. The participant is not
  told any distribution.
- Across the complete eight-arm set there are 96 matches and 96 mismatches.
- Each interactive session receives a 128-bit synthetic seed from
  `crypto.getRandomValues`. A domain-separated SHA-256 expansion derives the
  arm check, task order, 32-byte synthetic values, mutation choices, positions,
  and deterministic task IDs.
- Exported synthetic plan metadata is sufficient to regenerate the exact task
  order and stimuli with the reviewed harness code.
- The harness has no identity, contact, message, private-key, public-key, or
  cryptographic-construction input.
- State is held in JavaScript memory and is not automatically persisted or
  uploaded.
- QR images and decoding are local. No camera or microphone path exists.

### Assumptions to test with humans

- Participants naturally inspect enough of a representation to detect a
  controlled mismatch without being coached about a comparison strategy.
- English emoji labels and Bytewords are understandable to sampled
  participants.
- Ordinal positions help participants report what they inspected without
  changing their pre-response strategy.
- Participants understand that every representation is public and cannot
  decrypt anything.

### Hypotheses

- Representation and length may affect false accepts, false rejects,
  completion time, rendering, language, and accessibility behavior.
- Blinding the moderator until a committed response may reduce cueing, although
  it cannot eliminate behavioral or procedural cues.
- A technical QR round trip may justify a separate two-device/camera workflow
  experiment; it cannot supply human QR-usability evidence itself.

### Experiment-only decisions

- Use the first 48, 96, or 144 bits for the manual conditions listed below,
  most-significant-bit first.
- Use a published 64-entry Matrix SAS emoji table with experiment-only English
  labels.
- Use the published 256-entry Bytewords list as a direct byte-to-word mapping.
- Use an unmistakable unstable prefix for the synthetic QR demonstration.
- Use JSON and CSV only as anonymous local observation exports.
- Use `M2B-MANUAL-STUDY-PLAN-EXPERIMENT-UNSTABLE-1` to identify this disposable
  task plan. It is a study-plan identifier, not a protocol version.

These choices are study instrumentation. They are not normative for CipherBook
and do not resolve a project decision.

## Manual conditions and mappings

| Manual condition    | Displayed source | Experiment-only mapping                                                      |
| ------------------- | ---------------: | ---------------------------------------------------------------------------- |
| Visual emoji — 8    |          48 bits | First 48 bits split MSB-first into eight 6-bit indices                       |
| Visual emoji — 16   |          96 bits | First 96 bits split MSB-first into sixteen 6-bit indices                     |
| Visual emoji — 24   |         144 bits | First 144 bits split MSB-first into twenty-four 6-bit indices                |
| Spoken emoji labels |          96 bits | Same sixteen indices as visual emoji — 16; experiment-only English labels    |
| Word list           |          96 bits | First twelve bytes map directly to twelve Bytewords entries                  |
| Grouped hexadecimal |          96 bits | First twelve bytes as 24 lowercase characters in six numbered groups of four |

The spoken-label, word, and hexadecimal conditions all use the same first 96
source bits. Bit selection does not change after task generation.

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

These work factors do not measure human performance. Skimming, omissions,
rendering differences, language barriers, and transcription errors can reduce
the effective comparison below the displayed bit count. A final length cannot
be chosen from arithmetic alone.

## Predeclared counterbalancing

The moderator allocates arms in a fixed `A` through `H` rotation before
recruitment. The interface draws random 128-bit candidate seeds until the
domain-separated expansion derives the preassigned arm. Conditioning on one of
eight arms leaves approximately 125 bits of synthetic seed uncertainty; the
seed is not a key or real relationship value.

The table declares exact-match counts; controlled mismatches are `4 - matches`.
Each row contains two 1/3, four 2/2, and two 3/1 allocations, while every column
totals 12/12 over its six conditions.

| Manual condition    |   A |   B |   C |   D |   E |   F |   G |   H |
| ------------------- | --: | --: | --: | --: | --: | --: | --: | --: |
| Visual emoji — 8    |   1 |   1 |   3 |   3 |   2 |   2 |   2 |   2 |
| Visual emoji — 16   |   2 |   2 |   1 |   1 |   3 |   3 |   2 |   2 |
| Visual emoji — 24   |   2 |   2 |   2 |   2 |   1 |   1 |   3 |   3 |
| Spoken emoji labels |   3 |   3 |   2 |   2 |   2 |   2 |   1 |   1 |
| Word list           |   1 |   1 |   2 |   2 |   3 |   3 |   2 |   2 |
| Grouped hexadecimal |   3 |   3 |   2 |   2 |   1 |   1 |   2 |   2 |

Every condition/arm cell includes one substitution at the beginning, middle,
or end. A cell then includes zero, one, or two secondary mismatches—adjacent
transposition, omitted entry, duplicated entry, or, for visual emoji only,
candidate visual confusion—until it reaches its declared mismatch count. The
remaining task slots are independent exact matches.

Beginning, middle, and end substitutions rotate so each appears 16 times across
the complete eight-arm, six-condition plan. For each visual emoji condition,
the four secondary classes each occur twice across the arms. For the three
non-visual conditions, the three secondary classes rotate so each occurs eight
times in aggregate. A participant sees one to three mismatch classes for a
condition, always fewer than the six or seven available classes.

The cryptographic expansion assigns every planned task a 256-bit order priority,
then sorts the 24 tasks by that priority. This randomizes condition and
match/mismatch order without changing the predeclared counts. Participant-facing
task identifiers contain only the arm and an ordinal; they do not encode ground
truth or mismatch class.

Eight completed arms are required to execute the declared matrix. Six
participants may miss a mismatch class for a condition depending on arm
allocation, skipped tasks, or withdrawal, and cannot complete the full
eight-arm replication. This small design offers directional observations only;
it is not a statistical validation.

The plan, task count, arm allocation rule, and mismatch schedule must be fixed
before recruitment and must not be adapted after seeing participant performance.
Because the repository is public, allocation concealment is procedural rather
than secret: participants should not review the plan before completing tasks.

## Mismatch semantics

An **entry** means one emoji, one spoken label, one word, or one four-character
hexadecimal group, according to the condition. `omitted-entry` removes exactly
one entry. `duplicated-entry` inserts exactly one duplicate entry. Every
controlled mismatch records its exact entry position; an adjacent transposition
records both entry positions.

The complete experiment-only mismatch vocabulary is:

- `substitution-beginning`;
- `substitution-middle`;
- `substitution-end`;
- `adjacent-transposition`;
- `omitted-entry`;
- `duplicated-entry`; and
- `visually-similar-emoji` for visual emoji conditions only.

The visual-confusion pairs are candidates for observation, not findings that
glyphs are confusable on all platforms.

## Reproducibility boundary

JSON and CSV include:

- `studyPlanVersion`;
- `studyArm`;
- the complete 128-bit hexadecimal `taskSetSeed`; and
- a deterministic `taskId` on every observation.

The same seed and arm reconstruct the exact ordered tasks and stimuli. A seed
that derives a different arm is rejected. Different seeds change synthetic
stimuli and ordinarily change task order. The seed is permitted synthetic study
material: it contains no identity, contact, key, message, participant data, or
real relationship value.

The expansion uses SHA-256 only as deterministic study-fixture generation. It
does not define fingerprint derivation, key derivation, serialization, protocol
bytes, or a production construction.

## Moderated workflow

1. Before recruitment, the moderator assigns the next arm in the declared
   allocation and does not disclose ground-truth ratios.
2. The moderator enters a `P01`-style anonymous code and creates the fixed
   24-task session.
3. Before response, the answer key is absent. For spoken-label tasks only, the
   moderator sees the reference needed to conduct the task.
4. The participant sees the neutral instruction: **“Decide whether the two
   displayed values match. Answer Match, Mismatch, or Unsure.”**
5. A response is captured with a local monotonic timer, participant controls
   disappear, and the response cannot be changed.
6. Only then does the moderator see ground truth, mismatch details, and the
   prompt: **“Which numbered positions or groups did you compare?”**
7. The moderator may enter a bounded task note and, for spoken tasks, a repeat
   count, then saves and advances.
8. After all 24 tasks, the moderator reviews the aggregate counts and every
   observation note, confirms that notes contain no identifying data, and may
   explicitly download JSON or CSV.

The moderator can pause before a response without recording it. Restarting a
task begins a new timer. No automatic time limit ends a task.

## QR technical scope

The QR dependency encodes all 32 synthetic bytes behind
`CIPHERBOOK-M2B-SYNTHETIC-STUDY-VALUE-UNSTABLE:` and provides a complete
hexadecimal fallback. The moderator-only control draws one generated image to a
canvas and checks that the decoder recovers the exact source bytes.

The QR demonstration has no participant response, confidence, timer, task
record, or manual aggregate. It does not request camera permission, retain an
image, upload data, or confirm a human identity. A valid human QR comparison
requires a separately designed two-device or camera workflow that addresses
permission, aiming, lighting, handoff, reciprocity, and accessibility. No such
workflow is implemented or authorized here.

## Published mapping sources and dependencies

- Emoji table: Matrix `matrix-spec` `data-definitions/sas-emoji.json` at commit
  `4c2bb5aae19dcb15e2bee3127d57de80b5068195`, Apache License 2.0. Only the
  index, normative code-point sequence, and English label are copied.
- Word list: Blockchain Commons BCR-2020-012 Bytewords at commit
  `bacd8054be636ec48b0118763384cf6c7f947ab7`, the exact 256-entry list,
  BSD-2-Clause-Patent. This experiment uses only the direct byte mapping; it
  does not claim Bytewords checksum or container compatibility.
- QR package: `@nuintun/qrcode` 5.0.3, MIT. It is the only new direct package
  and has one transitive helper, `tslib` 2.8.1 under the 0BSD license. Package
  metadata, release activity, license, transitive dependency, archive, and
  source request/storage patterns were inspected on 2026-07-20.

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

The Milestone 2B suite checks plan balance, arm rotation, exact reconstruction,
entry-level mismatch semantics, moderator blinding, neutral instructions, note
review, anonymous export, QR separation and exact decoding, mapping integrity,
storage, network, build, and browser behavior. Passing automation is technical
evidence only and cannot substitute for participant observation.

## Local technical evidence

Recorded on macOS arm64 on 2026-07-20 with Node 26.4.0, npm 11.17.0,
Playwright Test 1.61.1, Chromium 149.0.7827.55, and Firefox 151.0:

- 46 representation, study-plan, mismatch, result, QR, attribution, and policy
  tests passed. The separately invoked QR subset passed all 3 tests.
- Chromium passed 9 of 9 and Firefox passed 9 of 9 blinding, neutral-wording,
  response-immutability, QR-separation, export, reset, storage, media, and
  network checks.
- Generated QR matrices and rendered images decoded to the exact 32 synthetic
  source bytes in both browser engines. No camera path was tested or added.
- Browser observations found empty local storage, session storage, cookies,
  IndexedDB, Cache Storage, and service-worker registrations, with no request
  outside the local test origin and no camera or microphone request.
- The build contained one local HTML file (10.46 kB), one local CSS file (3.94
  kB), and one local JavaScript file (80.78 kB). Bundle inspection found no
  remote runtime URL, persistence call, media path, service worker, web
  manifest, weak study PRNG, participant coaching phrase, or protocol marker
  covered by the policy checks.
- All 64 emoji entries matched the pinned Matrix source exactly; all 256 words
  matched the pinned Bytewords source exactly. QR 5.0.3 and tslib 2.8.1 license
  files matched the documented MIT and 0BSD notices.
- `npm audit` and `npm audit --omit=dev` each reported zero known
  vulnerabilities at the time of the run. This registry result is not an
  independent review or prediction about future package state.
- `npm ci` reported unapproved install scripts for optional development-only
  `fsevents` packages inherited from existing Playwright/Vite tooling. They
  were not approved or executed; the tested toolchains completed without them.
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
- The harness imposes no automatic time limit and respects reduced-motion
  preferences.
- QR has a full textual fallback, but no human QR accessibility result exists.

Automated checks cannot establish screen-reader usability, pronunciation across
accents, English-language comprehension, or cross-platform glyph
distinguishability. Those require actual participants and tested environments.

## Anonymous observation boundary

The export records synthetic plan metadata, condition, displayed bits, ground
truth, mismatch class and location, participant response, correctness,
false-accept/false-reject flags, unsure, elapsed milliseconds, optional
confidence, spoken repeat count, and a short moderator observation. It contains
no rendered stimulus or raw synthetic digest; those are regenerated from the
permitted task-set seed.

The 240-character observation field has a warning directly beside it. Export
review displays every note and requires confirmation that no identifying data
appears. Do not enter names, emails, phone numbers, employers, accounts,
demographics, device or network identifiers, real digests, contacts, messages,
keys, clipboard data, audio, or images.

The harness does not automatically save or upload observations. Explicitly
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
- Human QR metrics or comparison against the manual-condition aggregates
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
