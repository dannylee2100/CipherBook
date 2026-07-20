# Threat Model

> [!WARNING]
> This is a threat model for a research hypothesis, not evidence that CipherBook
> protects real secrets. No construction or design is approved for real use.

## Purpose and status

This document identifies the threats that the lean validation work must expose
rather than conceal. It is not a claim that mitigations exist. Milestone 1 is a
disposable Node experiment using synthetic data, Milestone 2A is a disposable
browser workflow experiment, and Milestone 2B is a local synthetic verification
study harness. No Milestone 2B human study has been run. Any remaining
separately approved Milestone 2 work must remain a disposable experiment too.
The maintainer deferred that pilot and authorized a sodium-only Alpha 0
engineering preview, followed by the narrow Alpha 1 encrypted identity-file
experiment. Alpha 1 adds offline-file and passphrase threats; it supplies no
human-verification or passphrase-usability evidence.

## Evidence categories

### Facts

- An untrusted transport can read envelope text and associated metadata, retain
  it indefinitely, drop it, replay it, truncate it, or replace it.
- Public contact material and verification representations are intended to be
  public; private keys and plaintext are not.
- Plaintext necessarily exists at an endpoint before sealing and after opening.
- A recipient who learns plaintext can copy, disclose, transform, or retain it.
- This repository contains disposable Milestone laboratories and a provisional
  Alpha 1 browser preview. Their synthetic tests do not establish technical
  protection for real data or human verification behavior.
- Alpha 1 retains recipient-local, deniable, recipient-forgeable sodium
  authentication. It is not a signature or transferable proof of authorship.
- Alpha 1 uses static identity keys. Later disclosure of either party's static
  private key can expose retained relationship envelopes; it has no forward
  secrecy.
- Alpha 1 can manually export one static private key inside a fixed 107-byte
  Argon2id13/XChaCha20-Poly1305 file. A holder can guess the passphrase offline;
  there is no password reset or automatic persistence.

### Assumptions to test

- Alice and Bob have at least one trusted interaction independent of the
  untrusted message transport.
- Their devices, operating systems, browsers, and input/output paths are not
  already controlled by an attacker during the experiment.
- Users can notice and correctly respond to a changed or unverified contact.
- Maintained libraries used in spikes behave as documented in the tested
  browser and Node environments.

These are experiment assumptions, not guarantees that a future deployment can
enforce.

### Hypotheses

- A comparison step can make active public-key substitution detectable often
  enough to be useful.
- Users can distinguish a message accepted under recipient-local
  authentication from one carrying a transferable sender signature.
- The workflow remains understandable when the transport and recipient are
  explicitly treated as untrusted in different ways.

### Decisions approved so far

- Study the threats below before selecting a construction or format.
- Do not claim protection against compromised endpoints, malicious recipients,
  or metadata observation.
- Compare the consequences of later key compromise in both technical spikes.
- Stop validation if the workflow requires protection outside these boundaries
  or if users infer protections that the design cannot provide.

## Assets under study

The experiments are intended to reason about these assets, using only synthetic
values:

- payload confidentiality before the intended recipient opens it;
- integrity of the payload and any metadata that the construction authenticates;
- correct association between an imported public contact and a person;
- private identity-key material used by a spike;
- Alpha 1 passphrases, decrypted identity-file work buffers, and usable
  encrypted identity files;
- the user's understanding of who can create, read, retain, or alter an
  envelope; and
- evidence produced by the comparison, including envelope size, failure modes,
  interoperability, and observed user errors.

Availability, delivery, deletion, expiration, traffic-flow secrecy, and control
over a recipient's behavior are not protected assets for this validation.

## Trust boundaries

| Boundary           | Treated as trusted for the experiment               | Treated as untrusted or fallible                                                                                                               |
| ------------------ | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Endpoints          | A test device not already controlled by an attacker | Operating-system services, browser extensions, other applications, clipboards, downloads, backups, screen capture, and later device compromise |
| Human verification | A genuinely separate interaction is available       | Human attention, memory, comparison accuracy, language, accessibility, and display rendering                                                   |
| Message path       | Nothing beyond eventual delivery of some text       | Messenger, email, ticket, SMS, server, administrator, archive, proxy, and attacker on the path                                                 |
| Recipient          | Holds the intended private key for the test         | May retain or disclose plaintext and, depending on the construction, may be able to forge sender-attributed envelopes                          |
| Dependencies       | Their documented behavior is an input to a spike    | Packages, registries, maintainers, build tools, distributed bundles, and update channels may be compromised                                    |
| Prototype UI       | Only the behavior directly observed in the study    | Hosting, browser behavior, rendering, camera, clipboard, and user interpretation                                                               |

## Attacker capabilities and validation questions

| Threat                          | Attacker capability                                                                                                          | Potential impact                                                                                                           | What the validation must determine                                                                                                                                                                                                 | Residual boundary                                                                                                                 |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Untrusted message transport     | Observe, store, replay, reorder, truncate, corrupt, suppress, or replace contacts and envelopes                              | Disclosure of metadata; denial of service; stale or attacker-created input; attempted contact substitution                 | Whether tampering and wrong-recipient cases fail clearly, and whether replay is understood as possible                                                                                                                             | Delivery, freshness, replay prevention, and metadata concealment remain unavailable without additional systems                    |
| Public-key substitution         | Replace Alice's contact for Bob, Bob's contact for Alice, or both before verification                                        | Attacker may establish separate relationships and read or alter later traffic                                              | Whether out-of-band verification detects one-key and active two-key substitution; whether users compare the whole representation                                                                                                   | A skipped, rushed, or compromised verification step defeats the intended association                                              |
| Human verification failure      | Encourage omission, skimming, transposition, premature confirmation, or reliance on familiar glyphs                          | False acceptance of a substituted key or rejection of a correct key                                                        | Error rates for manual emoji, spoken-label, word, and hexadecimal comparison; whether users know the value is public. QR in Milestone 2B supplies technical encode/decode evidence only and needs a separate human workflow study. | No representation eliminates coercion, inattentiveness, accessibility barriers, or dishonest participants                         |
| Endpoint compromise             | Control an endpoint before or during identity generation, sealing, verification, or opening                                  | Theft or alteration of plaintext and keys; falsified UI; incorrect randomness                                              | Whether warnings state the boundary without implying a workaround                                                                                                                                                                  | A client cannot protect secrets from an attacker controlling the client environment                                               |
| Browser or extension compromise | Read or change the DOM, typed passphrases, selected/downloaded files, clipboard, scripts, or memory                          | Theft or modification of keys, files, contacts, plaintext, or displayed fingerprints                                       | Minimize page-held values, clear inputs and temporary buffers best-effort, and state that the browser and extensions remain trusted in practice                                                                                    | A web prototype cannot isolate itself from a malicious browser, extension, OS, download path, or screen-capture tool              |
| Metadata exposure               | Observe participants, account identifiers, timestamps, IP addresses, message length, frequency, and retained ciphertext      | Relationship and activity disclosure even if payload bytes are unreadable                                                  | Whether every flow avoids suggesting that an envelope hides transport metadata                                                                                                                                                     | Ciphertext sent through an existing account inherits that transport's metadata and retention behavior                             |
| Malicious recipient             | Open an intended message, copy it, reveal it, misquote it, keep it, or potentially forge recipient-local authentication      | Disclosure, loss of control, attribution disputes, or fabricated transcripts                                               | Whether users understand recipient restraint is not provided and whether the two constructions have different forgery semantics                                                                                                    | Cryptography cannot force a recipient to forget plaintext or behave honestly                                                      |
| Stolen identity file            | Copy a downloaded file and perform unlimited offline guesses                                                                 | Recovery of the static private key after a successful guess; impersonation and exposure of retained relationship envelopes | Fixed Argon2id13 interactive cost, visible weak-passphrase warning, no hints, and no cleartext public contact                                                                                                                      | Guessing is fully offline; weak passphrases remain weak, and CipherBook cannot revoke or delete copies                            |
| Hostile identity file           | Supply malformed, oversized, truncated, altered, or unknown-profile bytes and try to control KDF cost                        | Resource exhaustion, parser confusion, destructive identity replacement, or misleading errors                              | Check one file and `File.size` before reading; cap at 4 KiB; require exactly 107 bytes, exact magic/profile, and fixed local KDF values before KDF; replace state only after full authentication and reconstruction                | The browser still allocates the fixed 64 MiB profile for structurally valid hostile files, and denial of service remains possible |
| Key loss                        | Lose the active key, file, or passphrase before opening                                                                      | Permanent inability to open test envelopes                                                                                 | State that continuity requires both the manually retained file and exact passphrase; provide no misleading reset path                                                                                                              | CipherBook has no recovery service, managed backup, or alternate unlock mechanism                                                 |
| Later key compromise            | Obtain a static private key directly or by decrypting an exported file after collecting old envelopes                        | Possible recovery or forgery of past envelopes, depending on construction and direction of compromise                      | Preserve the no-forward-secrecy warning and record that identity restoration can extend key lifetime                                                                                                                               | No forward-secrecy claim is allowed unless a later approved protocol actually demonstrates it                                     |
| Supply-chain compromise         | Publish a malicious package, modify a dependency or build artifact, compromise a maintainer account, or exploit a dependency | Key/passphrase/plaintext theft, weakened randomness, changed behavior, or falsified UI                                     | Use one official locked libsodium wrapper, bundle locally, inspect output, audit dependencies, and keep CI actions pinned                                                                                                          | Dependency review reduces but cannot eliminate ecosystem and maintainer risk                                                      |

## In-scope attacks for the validation

- Active and passive behavior by the untrusted text transport.
- Replacement of one or both public contacts before human verification.
- Tampered, truncated, malformed, replayed, and wrong-recipient experimental
  envelopes.
- An outsider attempting to impersonate a known sender.
- A recipient testing whether recipient-local authentication is forgeable by
  that recipient.
- Later compromise of test identity keys and analysis of captured test
  envelopes.
- Human comparison errors, including omissions, transpositions, skimming,
  cross-platform rendering differences, accessibility barriers, and language
  ambiguity.
- Browser, extension, clipboard, camera, and supply-chain exposure as design
  boundaries and study observations.
- Theft, guessing, alteration, truncation, oversizing, and unsupported-profile
  handling for synthetic Alpha 1 identity files.

## Out-of-scope protections

The validation does not attempt to protect against:

- a compromised sender or recipient endpoint;
- a malicious intended recipient after opening;
- metadata collection by transports, networks, employers, or service providers;
- denial of service, transport blocking, account suspension, or censorship;
- compelled disclosure, coercion, shoulder surfing, or physical surveillance;
- guaranteed deletion, expiration, recall, or revocation of already delivered
  plaintext;
- recovery when the active key, encrypted file, or exact passphrase is lost; or
- long-term protection implied solely by an experiment's successful round trip.

## Stop conditions derived from this model

Validation should stop and the project should be archived or reframed if:

- target users need endpoint-compromise, metadata, recipient-control, deletion,
  expiration, or censorship guarantees;
- users routinely skip or misunderstand contact verification;
- recipient-local and transferable authentication cannot be explained without
  material false beliefs;
- a spike requires custom low-level cryptography or an unsafe composition;
- available browser or Node libraries cannot support the experiment with a
  reviewable dependency surface; or
- the fixed Argon2id profile cannot allocate consistently in Chromium or
  Firefox, or safe import would require attacker-controlled KDF cost; or
- the remaining benefit is already supplied by Signal, age, a password manager,
  or another established tool with less user and maintainer risk.
