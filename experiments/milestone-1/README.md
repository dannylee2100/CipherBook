> [!WARNING]
> **Experimental laboratory only. Do not use real secrets. Output formats will
> change.**

# Milestone 1: disposable construction comparison

This directory is a throwaway Node laboratory for collecting evidence about two
candidate constructions. It is not CipherBook protocol code, a package intended
for publication, or a command-line product. A passing test does not select a
construction or establish production readiness.

## Facts

- The laboratory uses only synthetic text and freshly generated disposable
  identities.
- It compares `libsodium-wrappers` `crypto_box_easy`/`open_easy` behavior with
  native age encryption through `age-encryption` (Typage).
- Official interoperability tests execute the real `age` program in both
  directions.
- The age path emits and accepts native age armor without a CipherBook wrapper.
- The sodium path needs a laboratory-only wrapper because the high-level call
  returns ciphertext while the recipient also needs the nonce and public
  contacts.
- Private identities are held in memory. The official-age decryption probe writes
  one generated age identity to a mode-`0600` temporary file and removes its
  temporary directory in a `finally` block.

## Experiment-only choices

The following choices exist solely to make the comparison executable:

- `CBLAB-SODIUM-A` identifies the unstable sodium JSON wrapper.
- `CBLAB-SODIUM-CONTACT-A` identifies an unstable public-contact string.
- `CBLAB-RELATIONSHIP-DIGEST` tags a full SHA-256 UX diagnostic.
- `UX EXPERIMENT ONLY` is included in the digest domain tag and displayed with
  its output.
- Public contacts are length-delimited and lexicographically ordered before
  hashing so Alice and Bob obtain the same diagnostic.

The relationship diagnostic is public. It is not a password, encryption key,
secret, selected fingerprint representation, or selected fingerprint length.
No emoji, word, QR, or truncation choice is made here.

None of these strings or encodings is stable, canonical, compatible, or protocol
version 1. Native age armor retains age's own interoperability; that fact does
not turn any CipherBook experiment into a protocol commitment.

## Dependencies

Package metadata and upstream documentation were inspected on 2026-07-20 before
selection.

| Dependency                 | Role                       | Why it is present                                                                                                                      |
| -------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `libsodium-wrappers` 0.8.4 | Runtime                    | Maintained high-level `crypto_box` operations for the relationship-envelope probe; no cryptographic primitives are implemented here.   |
| `age-encryption` 0.3.0     | Runtime                    | Official Typage package with native age identity, recipient, binary envelope, and armor APIs for Node and browser-oriented JavaScript. |
| `prettier` 3.9.5           | Development only           | One deterministic formatting check without adding a framework, compiler, or linter.                                                    |
| official `age` 1.3.1       | Test-time external program | Independent interoperability reference; it is not an npm runtime dependency.                                                           |

The root package is private and has an explicitly experimental version. There is
no package publication configuration, build system, TypeScript compiler, UI
framework, test framework, or custom cryptographic implementation. Node's
built-in test runner is sufficient for this spike.

## Commands

This experiment was tested with Node 26.4.0. Other Node versions are untested,
and this private laboratory does not declare a broader Node support range. npm
and official `age` 1.3.1 on `PATH` are also required. The committed CI workflow
obtains the official Linux binary from its pinned upstream release and verifies
its SHA-256 digest.

```text
npm ci
npm run lab -- sodium identity
npm run lab -- sodium fingerprint
npm run lab -- sodium probe
npm run lab -- age identity
npm run lab -- age fingerprint
npm run lab -- age probe
npm run lab -- compare measure
npm run check
```

Each CLI command prints the experimental warning. Identity commands print only
the disposable public contact. Probe payloads are fixed synthetic strings; the
CLI deliberately has no free-form seal/open input, so plaintext cannot be placed
in shell history through this harness.

## Construction semantics being tested

### Sodium relationship experiment

Alice encrypts with Bob's static public key and Alice's static private key using
the high-level `crypto_box_easy` operation. Bob opens with Alice's expected
public key and Bob's private key.

This gives Bob a recipient-local check against an outsider who possesses neither
static private key. It is deniable and recipient-forgeable: Bob can use Alice's
public key with Bob's private key to produce a ciphertext that Bob's normal
expected-Alice opener accepts. An opened transcript is therefore not a
transferable signature or proof that Alice authored it.

Disclosure of either Alice's or Bob's static private key later permits a holder
of that key, together with the other party's public contact, to open a captured
transcript. This experiment does not provide forward secrecy.

### Native age experiment

The age recipient flow provides encryption to Bob's native age recipient and
tamper detection, but no native sender-authentication claim. Anyone with Bob's
public recipient can create an envelope Bob opens. Every user-facing result must
retain this meaning:

> Encrypted for this recipient. The sender is not cryptographically verified by
> this envelope.

The experiment does not add detached signatures, sign-then-encrypt, a signed
wrapper, another sender key, or a CipherBook container. Those remain later
design questions. Disclosure of Bob's age identity later permits recorded age
envelopes for that identity to be opened; there is no sender private key in this
flow.

## Input boundaries

- Plaintext is limited to 65,536 bytes.
- Imported public contacts are limited to 4,096 bytes.
- Sodium wrapper and native age armor inputs are limited to 131,072 bytes.
- Sodium fields use strict type, field-set, label, base64url, and length checks
  before the high-level open operation.
- Age envelope parsing and cryptographic validation remain with Typage or the
  official age program; the harness adds only size and type guards.
- Failed decryption does not print plaintext or private key material.

These bounds make hostile-input tests finite. They do not make the experimental
parser production-hardened.

## Explicit exclusions

This milestone does not include persistent keys, recovery, a vault, a browser
application, QR, a camera, a service worker, offline installation, hosting,
deployment, GitHub Pages, telemetry, package publishing, stable serialization,
protocol bytes, or a construction decision. Milestone 2 has not begun.

See [RESULTS.md](RESULTS.md) for measured facts and observed behavior. All nine
project-level choices remain in
[Unresolved Decisions](../../docs/UNRESOLVED_DECISIONS.md).
