> [!WARNING]
> **Experimental laboratory only. Do not use real secrets. Output formats will
> change.**

# Milestone 1 evidence record

This record reports facts and observations from a disposable comparison. It
does not recommend a winner, approve a new envelope, or resolve any item in the
project decision log.

## Test context

Measured locally on 2026-07-20:

| Component                         | Tested value                             |
| --------------------------------- | ---------------------------------------- |
| Platform                          | macOS on arm64                           |
| Node                              | 26.4.0                                   |
| npm                               | 11.17.0                                  |
| `libsodium-wrappers`              | 0.8.4                                    |
| Typage package (`age-encryption`) | 0.3.0                                    |
| Official age executable           | 1.3.1 (`age --version` reports `v1.3.1`) |

The workflow is configured to repeat the suite on `ubuntu-24.04` with Node
26.4.0 and the pinned official age 1.3.1 Linux release. Browser behavior is not
executed in Milestone 1.

Node 26.4.0 is the only Node version tested by this repository. Other Node
versions are untested, and the private laboratory does not declare a broader
support range.

Local `npm run check` result: 30 tests passed, 0 failed. A separate
`npm run test:interop` rerun passed all 3 official-age interoperability tests.
`npm audit --omit=dev` reported 0 known vulnerabilities at the time of this run;
that is a point-in-time package-registry result, not an independent review.

## Measured facts

All payloads are deterministic synthetic ASCII text. Byte counts were produced
by `npm run measure` and were consistent across repeated local runs. The runs
regenerate identities, nonces, and ciphertext, so cryptographic contents change;
the observed lengths did not change for these fixed package versions, recipient
type, wrapper, and payload sizes.

| Construction                              | Plaintext | Raw cryptographic | Separate nonce | Native serialized | Copied text | Public contact | Custom framing fields |
| ----------------------------------------- | --------: | ----------------: | -------------: | ----------------: | ----------: | -------------: | --------------------: |
| libsodium `crypto_box` laboratory wrapper |        32 |                48 |             24 |               n/a |         360 |             66 |                     6 |
| native age via Typage                     |        32 |               232 |              0 |               232 |         385 |             62 |                     0 |
| libsodium `crypto_box` laboratory wrapper |       256 |               272 |             24 |               n/a |         659 |             66 |                     6 |
| native age via Typage                     |       256 |               456 |              0 |               456 |         686 |             62 |                     0 |
| libsodium `crypto_box` laboratory wrapper |     2,048 |             2,064 |             24 |               n/a |       3,048 |             66 |                     6 |
| native age via Typage                     |     2,048 |             2,248 |              0 |             2,248 |       3,115 |             62 |                     0 |

Definitions:

- **Raw cryptographic** is the byte array returned by the high-level encryption
  call. Sodium's value is ciphertext plus its 16-byte authenticator; its required
  random 24-byte nonce is reported separately. Typage returns the complete
  native age binary envelope.
- **Native serialized** is `n/a` for sodium because `crypto_box_easy` does not
  define an envelope serialization. It equals raw output for age.
- **Copied text** is UTF-8 byte length of the unstable sodium JSON wrapper or
  unmodified native age armor.
- **Public contact** is the copied laboratory sodium contact including its label,
  or a native age X25519 recipient.
- **Custom framing fields** counts six JSON fields for sodium (`lab`, `warning`,
  `sender`, `recipient`, `nonce`, `ciphertext`) and zero for native age.

### Dependency and custom-code surface

| Category                                 | Source lines | Test lines | Files                                                                               | Why the custom code exists                                                                                                    |
| ---------------------------------------- | -----------: | ---------: | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Shared utilities and relationship digest |          177 |         41 | `bytes.js`, `constants.js`, `relationship-digest.js`; `relationship-digest.test.js` | Byte validation, experiment limits, tagged and length-delimited relationship diagnostic                                       |
| Sodium-specific                          |          315 |        196 | `sodium.js`; `sodium.test.js`                                                       | Contact and six-field wrapper framing/parsing, expected-sender checks, recipient-forgeability and later-key-disclosure probes |
| Native-age-specific                      |          146 |        148 | `age.js`; `age.test.js`                                                             | Typage identity/contact handling, native binary envelope and armor handling, sender-unverified and later-recipient-key probes |
| Official-age subprocess interoperability |          136 |         34 | `age-cli.js`; `interoperability.test.js`                                            | Bounded official CLI invocation, temporary identity-file handling, and both interoperability directions                       |
| CLI harness                              |          175 |         59 | `cli.js`; `cli.test.js`                                                             | Shared warning, disposable command dispatch, and non-secret probe output                                                      |
| Measurement harness                      |           78 |         61 | `measurements.js`; `measurements.test.js`                                           | Common synthetic payload generation and byte-count reporting at the three required sizes                                      |
| **Total**                                |    **1,027** |    **539** | All Milestone 1 source and test files                                               | Cross-check only; not a construction score                                                                                    |

Counting method: physical lines reported by `wc -l` after formatting. Every
source and test file is assigned to exactly one category. Counts include imports,
comments, blanks, validation, and error handling; they exclude documentation,
package metadata, the lockfile, CI, dependencies, and generated output. They are
maintenance-surface evidence, not a quality or security score.

Excluding shared CLI, measurement, and relationship infrastructure, the sodium
spike owns 315 source and 196 test lines. Native age handling owns 146 source and
148 test lines; its separately reported official-age interoperability adapter
adds 136 source and 34 test lines. The adapter is test-time evidence cost, not a
native age runtime wrapper.

Direct runtime dependencies remain `libsodium-wrappers` 0.8.4 for the sodium
spike and `age-encryption` 0.3.0 for the native-age spike. The official age
executable is test-time only. Sodium has one custom envelope parser and six
custom framing fields; native age uses its existing envelope parser and has no
custom CipherBook framing.

The sodium rejection categories asserted are invalid or oversized input,
malformed wrapper/contact, byte mutation, truncation, wrong recipient, wrong
expected sender, and outsider relabeling. The age categories asserted are
invalid or oversized input/contact, malformed armor, byte mutation, truncation,
and wrong recipient. Typage and official age own their native parser states; this
experiment does not enumerate their internals.

## Observed behavior

| Question                        | Sodium relationship experiment                                              | Native age experiment                                                       |
| ------------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Node round trip                 | Passed for ASCII, multilingual UTF-8, and empty text                        | Passed for ASCII, multilingual UTF-8, and empty text                        |
| Recipient confidentiality probe | A generated wrong-recipient identity did not open the envelope              | A generated wrong-recipient identity did not open the envelope              |
| One-byte mutation               | Open failed                                                                 | Open failed                                                                 |
| Truncation                      | Open failed                                                                 | Open failed                                                                 |
| Wrong recipient                 | Open failed                                                                 | Open failed                                                                 |
| Sender meaning                  | Expected-sender check resists an outsider with the wrong static sender key  | No native sender authentication                                             |
| Recipient behavior              | Bob constructed a transcript Bob's expected-Alice opener accepted           | Any outsider with Bob's public recipient constructed an envelope Bob opened |
| Later sender-key disclosure     | Alice's disclosed static private key plus Bob's public key opened a capture | Not applicable; this flow has no sender private key                         |
| Later recipient-key disclosure  | Bob's disclosed static private key plus Alice's public key opened a capture | Bob's disclosed age identity opened a capture                               |
| Official interoperability       | Not applicable                                                              | Typage to official age passed; official age to Typage passed                |

The sodium authentication meaning observed here is **recipient-local, deniable,
recipient-forgeable, and not a transferable signature**. Successful opening must
not be described as proof that Alice authored a transcript.

The native age result must be phrased as: **Encrypted for this recipient. The
sender is not cryptographically verified by this envelope.** Transport context
or a verified-contact interface might help a user form a practical belief about
where text came from, but this spike provides no evidence that users understand
or accept that distinction.

### Official age interoperability record

| Direction                                          | Material handling                                                                                   | Result                                                                    |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Typage 0.3.0 encrypt -> official age 1.3.1 decrypt | Generated identity held in memory, copied to a mode-`0600` temporary file for the CLI, then removed | Passed; exact synthetic UTF-8 plaintext recovered                         |
| Official age 1.3.1 encrypt -> Typage 0.3.0 decrypt | Public recipient passed to the CLI; synthetic plaintext passed on stdin                             | Passed; native armor opened and exact synthetic UTF-8 plaintext recovered |

No JavaScript substitute was used for the official executable. No private key or
plaintext was placed in a process argument.

## Library-support facts and untested expectations

- `libsodium-wrappers` distributes the maintained libsodium.js wrapper for Node
  and browsers. This run tested Node only.
- Typage documents recent-browser and Node 20-or-later support. This run tested
  Node and official-age interoperability only.
- A browser build, bundler behavior, CSP interaction, memory lifecycle, and
  cross-browser operation remain untested. Expected support based on package
  documentation is not browser evidence.

## Interpretation

- Sodium's raw operation is compact, but a usable copied envelope needs custom
  framing and parsing. Its expected-sender check has a subtle recipient-
  forgeability property that the interface would have to explain accurately.
- Native age brings an existing serialized and armored envelope plus successful
  interoperability. It does not authenticate a sender, so a verified-contact
  workflow cannot honestly label the decrypted text as cryptographically sent by
  Alice without additional design.
- Adding a signature or wrapper to age was intentionally not tested. Doing so
  would change signature transferability, failure ordering, key management,
  framing, and interoperability; it is not a small conclusion from this result.
- Both static-recipient approaches permit past captures to be opened after later
  recipient-key disclosure. The sodium relationship also permits opening after
  later sender-key disclosure. Neither experiment supports a forward-secrecy
  claim.
- Envelope byte size alone does not decide the project. Authentication semantics,
  user comprehension, interoperability, browser behavior, and maintenance cost
  remain material.

No construction is recommended at Milestone 1.

## Experimental limitations

- Synthetic payloads and generated identities only; no real secrets or existing
  private keys were used.
- The suite demonstrates behavior for one sender and one recipient in one
  process. It does not model persistence, multiple devices, rotation, recovery,
  revocation, concurrency, or hostile endpoints.
- Randomized cryptographic outputs prevent fixed ciphertext fixtures; tests
  assert properties and exact recovered synthetic text instead.
- No browser execution, usability observation, dependency audit by an independent
  reviewer, performance benchmark, fuzzing, or denial-of-service analysis was
  performed.
- The sodium wrapper is deliberately small and bounded, but it is not a proposed
  wire format or production parser.
- Official age interoperability was tested with one release and X25519 recipients
  only.

## Unresolved questions

All nine project decisions remain unresolved:

1. libsodium `crypto_box` versus age/Typage or another maintained construction;
2. recipient-local authentication versus transferable signatures;
3. a custom envelope versus an existing format;
4. fingerprint representation and length;
5. QR-first versus spoken/manual verification;
6. serialization or no new serialization;
7. persistent vault and recovery;
8. hosting and deployment; and
9. protocol version 1 bytes.

Milestone 3, not this implementation, owns any comparative recommendation and
the project go/no-go decision. Milestone 2 has not begun.
