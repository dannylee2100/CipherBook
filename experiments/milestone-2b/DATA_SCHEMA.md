# Milestone 2B anonymous observation schema

> [!WARNING]
> This experiment records synthetic-task observations only. Do not enter or
> export personal information, real contacts, real relationship values, keys,
> messages, audio, images, or clipboard contents.

## Storage boundary

The active session and records exist only in application memory. The harness
does not automatically use local storage, session storage, IndexedDB, cookies,
Cache Storage, service workers, URL state, remote APIs, telemetry, or analytics.
Reload and Clear reset the interface. That does not guarantee erasure from
browser, operating-system, crash, swap, downloaded-file, or instrumentation
layers.

## Observation fields

| Field                      | Type                 | Meaning                                                                                   |
| -------------------------- | -------------------- | ----------------------------------------------------------------------------------------- |
| `harnessVersion`           | string               | Exact experiment-harness identifier; not a protocol version                               |
| `anonymousParticipantCode` | string               | Locally assigned `P01`-style code; never a name                                           |
| `sessionId`                | string               | Locally random opaque session label                                                       |
| `taskId`                   | string               | Session-local task ordinal                                                                |
| `condition`                | enum string          | `qr-256`, `emoji-48`, `emoji-96`, `emoji-144`, `spoken-emoji-96`, `words-96`, or `hex-96` |
| `displayedBits`            | integer              | 48, 96, 144, or 256 according to the condition                                            |
| `groundTruth`              | enum string          | `match` or `mismatch`                                                                     |
| `mismatchType`             | enum string          | `none` or one controlled mismatch class                                                   |
| `mismatchPosition`         | string or null       | Synthetic item/group/digest-byte location                                                 |
| `participantResponse`      | enum string          | `match`, `mismatch`, or `unsure`                                                          |
| `correct`                  | boolean              | Whether response equals ground truth; Unsure is false                                     |
| `falseAccept`              | boolean              | Mismatch ground truth answered Match                                                      |
| `falseReject`              | boolean              | Match ground truth answered Mismatch                                                      |
| `unsure`                   | boolean              | Whether the response was Unsure                                                           |
| `completionMilliseconds`   | non-negative integer | Rounded `performance.now()` task duration; not cryptographic evidence                     |
| `confidence`               | integer or null      | Optional fixed scale 1, 2, or 3                                                           |
| `repeatCount`              | integer              | Moderator-entered spoken-label repeat count; zero otherwise                               |
| `moderatorObservation`     | string               | Optional task-relevant note, maximum 240 characters, no personal data                     |

## Export container

Explicit JSON export contains:

- `format`: `M2B-ANONYMOUS-OBSERVATIONS-EXPERIMENT-UNSTABLE`;
- an on-device handling warning;
- the harness identifier;
- anonymous participant code;
- session ID; and
- the observation array.

CSV contains the observation fields in the table order. Neither format contains
task seeds, synthetic digest bytes, rendered reference or comparison stimuli,
QR payloads, or generated images. CSV cells beginning with a spreadsheet-formula
prefix are neutralized before download.

## Prohibited fields and content

Do not add or infer:

- name, email, phone number, employer, account identifier, IP address, device
  fingerprint, or biography;
- real identity, public contact, private key, public key, recovery material, or
  passphrase;
- real relationship digest, contact fingerprint, message, plaintext, or
  ciphertext;
- clipboard content, audio, microphone data, image, camera frame, or video;
- browser history, user agent, screen dimensions, font inventory, or other
  fingerprinting data; or
- an automatic timestamp or remote collector not required by the study.

The short moderator observation is not a loophole for personal information.

## Export action

The moderator must:

1. complete the selected tasks;
2. choose **Review export**;
3. inspect total, false-accept, false-reject, and unsure counts;
4. affirm the explicit-download confirmation; and
5. choose JSON or CSV.

The browser then creates a local download. The harness does not upload it.
Downloaded files remain under the moderator's device and organizational data
handling controls.
