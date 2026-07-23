> [!WARNING]
> **Disposable synthetic-data evidence. No output is protocol v1 or suitable
> for real secrets.**

# V1-1 sodium construction results

## Environment

- Date: 2026-07-24
- Node: 26.4.0
- `libsodium-wrappers-sumo`: 0.8.4
- Browser automation: Playwright Chromium and Firefox

## Common signed inner fixture

Both candidates used identical unstable signed inner bytes. An Ed25519 detached
signature covered:

- an experiment-only domain;
- an experiment model marker;
- sender encryption and signing public keys;
- recipient encryption and signing public keys; and
- the synthetic UTF-8 payload.

The fixture is a length-delimited experiment representation, not a proposed
serialization or protocol.

## Observed tests

- Twenty Node tests passed.
- Ten browser tests passed across Chromium and Firefox.
- Both candidates round-tripped empty, ASCII, multiline, Unicode, randomized,
  and exact-65,536-byte synthetic payloads.
- Both rejected ciphertext mutation, truncation, trailing ciphertext, oversized
  ciphertext, unknown candidates, wrong recipients, and wrong expected signing
  contacts.
- Static nonce mutation and an unexpected sealed-box nonce were rejected.
- Mutating each of the seven signed context fields or the detached signature was
  rejected.
- A fixed pair of synthetic encryption/signing seeds reproduced the expected
  detached-signature fixture and opened successfully.
- Signed sender or recipient contact disagreement was rejected even when the
  signature itself was valid.
- Replacing the payload and Alice's signature with either Bob's or an outsider's
  signature was rejected.
- Replaying an unchanged valid envelope remained possible.
- Decrypting and re-encrypting the same signed packet to another recipient was
  rejected because the signed recipient contact remained Bob.
- The static candidate's captured packet was opened using Alice's disclosed
  static encryption private key and Bob's public key.
- Alice's disclosed encryption private key did not open an old sealed-box
  capture addressed to Bob.
- Bob's disclosed recipient encryption identity opened retained captures from
  both candidates.
- Alice's disclosed signing private key permitted new accepted forgeries.
- Node output opened in both browsers, and output created in both browsers
  opened in Node for each candidate.
- Neither browser made a cross-origin request.

The fixed test signature is:

```text
9f70a9b766279fdf23879aca760ce9aaa4351285f0ea63f05a6dbf4f55f93fd81eeca63084e0aeba1cafa796da9f466cf3c32bf9c1785dcfbeb2ecf7e2ec1f0e
```

Its keys and payload are synthetic fixtures committed in the test. It is not a
protocol vector.

## Size measurements

The test armor is a disposable JSON measurement wrapper containing the literal
warning `UNSTABLE`, candidate label, Base64url ciphertext, and a Base64url nonce
for the static candidate. It is not a format proposal.

| Candidate                 | Payload bytes | Ciphertext bytes | Separate nonce | Test armor bytes |
| ------------------------- | ------------: | ---------------: | -------------: | ---------------: |
| Sealed box plus signature |            32 |              359 |              0 |              557 |
| Static box plus signature |            32 |              327 |             24 |              557 |
| Sealed box plus signature |           256 |              583 |              0 |              856 |
| Static box plus signature |           256 |              551 |             24 |              856 |
| Sealed box plus signature |         2,048 |            2,375 |              0 |            3,245 |
| Static box plus signature |         2,048 |            2,343 |             24 |            3,245 |

The sealed ciphertext is 32 bytes larger, while the static candidate requires a
separate 24-byte nonce. Before any final serialization, the sealed candidate's
net binary overhead is therefore eight bytes larger. The disposable armor sizes
were equal because its candidate labels and optional nonce field happened to
offset one another.

Relative to the shared signed packet, sealed-box encryption adds 48 ciphertext
bytes. Static `crypto_box_easy` adds 16 ciphertext bytes and carries a separate
24-byte nonce, for 40 bytes total.

## Browser bundle, source, and dependency surface

The standalone Vite spike build measured:

| Artifact           | Raw bytes | Gzip bytes |
| ------------------ | --------: | ---------: |
| Browser JavaScript |   540,873 |    190,495 |
| HTML               |       776 |        456 |

The three spike source modules contain 510 lines / 13,210 bytes before
minification. The three test modules contain 848 lines / 23,864 bytes.

These numbers are a standalone spike measurement, not an incremental product
bundle estimate. The bundled `libsodium-wrappers-sumo` runtime dominates the
JavaScript artifact. The spike added no dependency and made no lockfile change;
it reused the repository's pinned `libsodium-wrappers-sumo` 0.8.4 package.

## Open failure order

The tested experiment performs:

1. candidate, ciphertext bound, nonce, and key-shape checks;
2. outer decryption;
3. exact inner packet-length parsing;
4. experiment-domain, model, field-count, key-length, and payload-bound checks;
5. expected sender and actual recipient contact comparison;
6. detached-signature verification under the expected signing key; and
7. fatal UTF-8 decoding.

For the static candidate, the expected sender encryption key participates in
step 2. For the sealed candidate, sender identity comes only from steps 5 and 6.
These experiment errors are not a proposed public error taxonomy.

## Compromise and authentication comparison

| Question                                                               | Sealed box plus signature | Static box plus signature      |
| ---------------------------------------------------------------------- | ------------------------- | ------------------------------ |
| Transferable sender authentication                                     | Inner signature           | Inner signature                |
| Additional recipient-local sender authentication                       | None                      | Static `crypto_box` check      |
| Sender encryption private key needed to send                           | No                        | Yes                            |
| Sender encryption-key disclosure opens old outgoing captures           | Not by itself             | Yes, with recipient public key |
| Sender signing-key disclosure permits new signed forgeries             | Yes                       | Yes                            |
| Recipient encryption-key disclosure opens old captures                 | Yes                       | Yes                            |
| Recipient can reveal or replay a valid signature                       | Yes                       | Yes                            |
| Recipient can create a new sender signature without sender signing key | No in tested model        | No in tested model             |
| Forward secrecy after recipient-key compromise                         | No                        | No                             |

The sealed-box ephemeral sender key does not provide forward secrecy against
later compromise of the recipient's static encryption private key.

## Adversarial review checklist

- [x] The same signed inner model is used by both candidates.
- [x] Sender and intended-recipient encryption and signing keys are inside the
      signature context.
- [x] Experiment domain and model markers are inside the signature context.
- [x] All signed fields and the signature have mutation tests.
- [x] Outer truncation, trailing data, wrong keys, nonce changes, and bounds
      fail closed in the test harness.
- [x] Exact inner length rejects authenticated trailing packet bytes.
- [x] Recipient replay and signature disclosure remain explicitly possible.
- [x] Recipient re-encryption to another recipient fails inner recipient
      binding.
- [x] Recipient replacement of the sender signature fails.
- [x] Sender encryption, sender signing, and recipient encryption compromise
      consequences are separately exercised.
- [x] The sealed-box implementation uses only the high-level sodium operation;
      no custom sealed-box primitive is constructed.
- [x] Node, Chromium, and Firefox interoperation is exercised in both
      directions.
- [x] The spike adds no dependency and calls no third-party runtime origin.
- [x] All fixtures and payloads are explicitly synthetic.
- [x] No spike marker, length prefix, wrapper, or output is approved as
      protocol v1.

## Recommendation

Prefer **sealed box plus an inner transferable signature** for the next protocol
stage.

Reasons:

- The signature is the single sender-authentication mechanism.
- It avoids redundant recipient-local authentication that the v1 product does
  not intend to explain as a second trust result.
- Alice's long-term encryption private key is not used when Alice sends to Bob,
  so its later disclosure does not independently decrypt Alice-to-Bob captures.
- Libsodium owns ephemeral-key creation and nonce derivation through the
  high-level sealed-box operation.
- The measured binary cost is eight bytes over the static candidate after
  accounting for its separate nonce.

Residual risks:

- Bob's later encryption-key compromise opens retained Bob-addressed envelopes.
- Alice's signing-key compromise permits new signed forgeries.
- Valid signed content is transferable, revealable, and replayable.
- Sender and recipient binding still depends on exact protocol bytes that do
  not yet exist.

This recommendation does not approve a serialization, contact, identifier,
fingerprint, envelope, vault, or protocol byte.
