# Milestone 2B anonymous observation schema

> [!WARNING]
> This experiment records synthetic manual-task observations only. Do not enter
> or export personal information, real contacts, real relationship values, keys,
> messages, audio, images, or clipboard contents.

## Storage boundary

The active session and records exist only in application memory. The harness
does not automatically use local storage, session storage, IndexedDB, cookies,
Cache Storage, service workers, URL state, remote APIs, telemetry, or analytics.
Reload and Clear reset the interface. That does not guarantee erasure from
browser, operating-system, crash, swap, downloaded-file, or instrumentation
layers.

## Reproducible synthetic plan metadata

Each session uses the disposable study-plan identifier
`M2B-MANUAL-STUDY-PLAN-EXPERIMENT-UNSTABLE-1`, one preassigned arm from `A`
through `H`, and a complete 128-bit lowercase hexadecimal `taskSetSeed` produced
with `crypto.getRandomValues`.

A domain-separated SHA-256 expansion verifies the arm and derives task order,
synthetic values, mutation choices, mutation positions, and task IDs. Given the
exported plan identifier, arm, seed, and reviewed harness code, an auditor can
reconstruct the exact ordered tasks and match every observation by `taskId`.
The seed is permitted synthetic study material, not an identity, key, contact,
message, real relationship value, or participant identifier.

This mechanism is experiment instrumentation. It does not define a fingerprint,
key derivation, serialization, stable format, or protocol version.

## Observation fields

| Field                      | Type                 | Meaning                                                                                                 |
| -------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------- |
| `harnessVersion`           | string               | Exact experiment-harness identifier; not a protocol version                                             |
| `studyPlanVersion`         | string               | Exact unstable manual-study-plan identifier; not a protocol version                                     |
| `studyArm`                 | enum string          | Preassigned arm `A` through `H`                                                                         |
| `taskSetSeed`              | string               | Complete 128-bit synthetic hexadecimal seed used to reconstruct the plan                                |
| `anonymousParticipantCode` | string               | Locally assigned `P01`-style code; never a name                                                         |
| `sessionId`                | string               | Opaque session label derived from permitted synthetic session material                                  |
| `taskId`                   | string               | Deterministic arm-and-ordinal task link; does not encode ground truth                                   |
| `condition`                | enum string          | `emoji-48`, `emoji-96`, `emoji-144`, `spoken-emoji-96`, `words-96`, or `hex-96`                         |
| `displayedBits`            | integer              | 48, 96, or 144 according to the manual condition                                                        |
| `groundTruth`              | enum string          | `match` or `mismatch`; unavailable to the moderator until after response                                |
| `mismatchType`             | enum string          | `none` or one controlled mismatch class listed below                                                    |
| `mismatchPosition`         | string or null       | Exact affected entry, or both entries for a transposition                                               |
| `participantResponse`      | enum string          | `match`, `mismatch`, or `unsure`                                                                        |
| `correct`                  | boolean              | Whether response equals ground truth; Unsure is false                                                   |
| `falseAccept`              | boolean              | Mismatch ground truth answered Match                                                                    |
| `falseReject`              | boolean              | Match ground truth answered Mismatch                                                                    |
| `unsure`                   | boolean              | Whether the response was Unsure                                                                         |
| `completionMilliseconds`   | non-negative integer | Rounded `performance.now()` task duration; usability observation, not cryptographic evidence            |
| `confidence`               | integer or null      | Optional fixed scale 1, 2, or 3                                                                         |
| `repeatCount`              | integer              | Moderator-entered spoken-label repeat count; zero otherwise                                             |
| `moderatorObservation`     | string               | Optional task-relevant note, maximum 240 characters, confirmed free of identifying data before download |

## Mismatch vocabulary

- `none` for an exact match;
- `substitution-beginning`;
- `substitution-middle`;
- `substitution-end`;
- `adjacent-transposition`;
- `omitted-entry`;
- `duplicated-entry`; and
- `visually-similar-emoji` for visual emoji only.

An entry is one emoji, one spoken label, one word, or one four-character
hexadecimal group, depending on the condition. `omitted-entry` removes exactly
one such entry. `duplicated-entry` inserts exactly one duplicate. The recorded
position names the affected entry after one-based numbering; a transposition
names both adjacent entries.

## Export containers

Explicit JSON export contains:

- `format`: `M2B-ANONYMOUS-OBSERVATIONS-EXPERIMENT-UNSTABLE`;
- an on-device handling warning;
- harness and study-plan identifiers;
- study arm and complete synthetic task-set seed;
- planned manual task count;
- anonymous participant code and session ID; and
- the observation array.

CSV contains every observation field in the table order, including the
repeated plan identifier, arm, and seed needed to interpret an independently
handled row. CSV cells beginning with a spreadsheet-formula prefix are
neutralized before download.

Neither export contains rendered reference or comparison objects, raw synthetic
digest fields, QR payloads, generated images, or QR participant metrics. Those
manual stimuli can be regenerated from the plan metadata. QR is a separate
technical demonstration and produces no observation record.

Before export, the implementation verifies that each planned `taskId` appears
exactly once and that every observation's condition, displayed bits, ground
truth, mismatch class, and position match the reconstructed in-memory task.

## Prohibited fields and content

Do not add, collect, or infer:

- name, email, phone number, employer, account identifier, IP address, network
  identifier, device fingerprint, demographics, or biography;
- real identity, public contact, private key, public key, recovery material, or
  passphrase;
- real relationship digest, contact fingerprint, message, plaintext, or
  ciphertext;
- clipboard content, audio, microphone data, image, camera frame, or video;
- browser history, user agent, screen dimensions, font inventory, or other
  fingerprinting data; or
- an automatic timestamp or remote collector not required by the study.

The short moderator observation is not a loophole for personal information.
The UI places this warning beside the field, previews every note, and requires
confirmation that the notes contain no identifying data before download.

## Export action

The moderator must:

1. complete all 24 tasks from the predeclared arm;
2. choose **Review export**;
3. inspect total, false-accept, false-reject, and unsure counts;
4. inspect every observation note;
5. confirm that no note contains identifying data; and
6. choose JSON or CSV.

The browser then creates a local download. The harness does not upload it.
Downloaded files remain under the moderator's device and organizational data
handling controls.
