# V1 Direction and Unresolved Decisions

> [!IMPORTANT]
> The maintainer approved direction-level v1 choices on 2026-07-24. V1-0002
> selects a sodium construction direction and V1-0007 selects early
> hosted-preview controls. Serialization, contact, fingerprint, vault, protocol
> bytes, compatibility rules, and final-v1 release controls remain unresolved.
> Experimental output must not be described as stable, canonical, compatible,
> or protocol version 1.

## Evidence categories

### Facts

- Disposable Milestone 1 Node and Milestone 2A browser comparisons exist, and a
  Milestone 2B synthetic verification-study harness exists. No Milestone 2B
  human observation or Milestone 3 decision has been completed.
- The human pilot was deferred before recruitment. The maintainer authorized a
  provisional sodium-only Alpha 0 engineering preview and then a narrow Alpha 1
  encrypted identity-file experiment without treating either as a Milestone 3
  result.
- The repository contains no approved protocol bytes or final application
  design.
- Existing tools may make a new envelope format unnecessary.
- Current Alpha identity files restore only the local private identity and same
  local public contact. They do not restore counterparty, verification, trust,
  alias, or message state. This Alpha constraint is not a final persistence or
  trust-model decision.
- The v1 readiness roadmap and V1-0001 are accepted. The maintainer explicitly
  overrode sequential milestone approvals and authorized technically
  performable work plus an early Pages preview.
- The override does not establish representative human evidence, independent
  review, protocol bytes, or product fitness.
- V1-0002 selects sealed-box encryption around an inner transferable signature
  at the construction level; its disposable fixture does not define bytes.
- V1-0007 authorizes a Pages development preview of the existing browser
  utility; it is not a v1 release artifact.
- No v1 serialization profile, contact byte, relationship digest, emoji
  mapping, envelope byte, vault byte, vector set, product implementation,
  independent review, or release artifact exists.

### Assumptions to test

- The V1-1 sodium measurements transfer to the later strict-serialization and
  protocol models without hiding new composition costs.
- Representative users can compare verification methods without using real
  secrets.
- Compatibility, authentication semantics, user comprehension, and maintainer
  burden can be compared before any production architecture is proposed.
- A custom envelope remains justified after its strict-parser and compatibility
  costs are measured.
- A stable locked identity can be implemented without implying guaranteed
  memory erasure or hardware-backed protection.

### Hypotheses

- One strict serialization candidate may produce deterministic bytes and reject
  ambiguous input consistently in the browser, CLI, and an independent
  verifier.
- Representative users may understand layered verification and transferable
  signatures without false acceptance or physical-identity overclaim.

### Decisions approved so far

- Use maintained high-level libsodium operations for v1 construction research.
- Use sealed-box encryption around an inner transferable signature as the
  construction direction recorded in V1-0002.
- Use a separate transferable signing identity whose signature is inside the
  encrypted content and binds the domain, version, sender, recipient, and
  payload.
- Include separate encryption and signing public keys in a v1 public contact.
- Pursue a compact custom CipherBook envelope only while later evidence
  continues to justify it.
- Pursue layered verification using complete QR data, full grouped hexadecimal,
  and 16 numbered emojis with spoken labels.
- Keep imported contacts unverified until a separate trusted interaction; pin
  verified contacts and stop sealing after an unexpected key change.
- Pursue stable and temporary identities with immediate and inactivity locking.
- Use GitHub Pages for an honestly labeled development preview under V1-0007;
  final v1 publication remains gated.
- Treat `v1.0.0` as a compatibility promise rather than evidence that all
  security limitations have been removed.
- Keep every Alpha artifact separate from v1 and do not relabel or migrate it.

## Alpha 0 history and Alpha 1 provisional extension

For the Alpha 0 branch only, the maintainer chose to:

1. use the libsodium relationship-envelope experiment;
2. retain the existing unstable sodium contact and envelope encodings;
3. display the full 256-bit hexadecimal relationship diagnostic as the
   authoritative Alpha 0 comparison;
4. also display a 16-emoji, 96-bit convenience representation using the
   existing Matrix-derived experiment table;
5. label the emoji representation as unvalidated convenience UX;
6. use temporary memory-only identities;
7. provide no private-identity persistence or export; and
8. provide no deployment or stable-format claim.

These choices make one alpha executable. The later v1 direction does not promote
the Alpha construction, recipient-local semantics, envelope, fingerprint,
persistence, hosting state, or bytes. See
[`ALPHA-0001`](decisions/ALPHA-0001-sodium-browser-alpha.md).

For Alpha 1 only, the maintainer additionally authorized manual export and
import of one fixed-size, passphrase-encrypted local identity file. The file
uses a fixed Argon2id13 interactive profile and XChaCha20-Poly1305 to encrypt the
existing sodium private key; it is explicitly unstable and disposable. This
local experiment does not approve passphrase files as the final identity model,
select a persistent vault or recovery design, alter the contact or envelope
encodings, or define protocol version 1. See
[`ALPHA-0002`](decisions/ALPHA-0002-encrypted-identity-file.md).

For the current Alpha only, the maintainer additionally decided that restore is
identity-only. The encrypted identity file is not a complete CipherBook backup:
after restore, the user must import the counterparty contact and explicitly
confirm the full hexadecimal comparison again. This avoids silently restoring a
stale contact or outdated trust decision and keeps relationship information out
of the decrypted file. It does not select a final contact database, trust,
revocation, persistence, or recovery design. See
[`ALPHA-0003`](decisions/ALPHA-0003-identity-only-restore.md).

## Direction and unresolved-detail log

| #   | Direction-level status                                                                            | Evidence and details still required                                                                                                                                                        | What must not be inferred                                                                               |
| --- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| 1   | **Selected direction:** `crypto_box_seal` around an inner transferable signature                  | Exact protocol context, signature input bytes, verification/failure order, identifiers, rotation, and fixed valid/invalid vectors                                                          | V1-0002 does not promote its disposable fixture or the Alpha relationship box to protocol v1            |
| 2   | **Approved semantics:** separate transferable signing identity                                    | Exact signature API, input bytes, domain separation, verification order, transcript disclosure, signing-key compromise, rotation, and human understanding                                  | A valid signature is not proof of physical identity, truth, intent, authority, or exclusive key control |
| 3   | **Approved direction with stop gate:** compact custom CipherBook envelope                         | Continued justification, strict parser surface, field model, text marker, armor, size, extensions, compatibility, and independent interoperation                                           | Branding, compact appearance, or a successful round trip does not justify custom protocol bytes         |
| 4   | **Approved layered display:** complete QR data, full grouped hex, and 16 numbered emojis          | Contact/digest inputs, active-collision analysis, ordering, emoji alphabet and mapping, authorization flow, false accepts, skimming, rendering, accessibility, and language evidence       | Sixteen emojis are not approved as the sole authoritative verification method                           |
| 5   | **Approved capabilities:** QR and copy/paste exchange with separate verification                  | QR reciprocity, manual/spoken fallback, pinning UI, verification date, reminders, key-change behavior, and representative observations                                                     | Fast QR decoding does not show that people verified the correct person or both directions               |
| 6   | **Unresolved:** deterministic CBOR versus canonical JSON                                          | Size, browser/CLI equality, dependency and parser surface, duplicate/malformed rejection, signing determinism, readable vectors, and an independent verifier                               | A spike's convenient encoding is not a wire-format decision                                             |
| 7   | **Approved behavior direction:** stable and temporary identities, immediate lock, inactivity lock | IndexedDB versus file-mediated stability, two-key vault bytes, KDF/AEAD, recovery, timeout, lifecycle, multi-tab, rollback, loss, rotation, and Alpha non-migration                        | The Alpha identity file does not define a v1 vault, and automatic lock is not guaranteed erasure        |
| 8   | **Selected preview host:** GitHub Pages under V1-0007                                             | Confirm environment protection, deployed commit display, runtime network behavior, rollback, and final-v1 release provenance                                                               | A live preview is not v1, independent review, human validation, immutability, or product fitness        |
| 9   | **Unresolved:** protocol v1 bytes                                                                 | Accepted construction and serialization, normative schema, deterministic vectors, independent verifier, replay, errors, rotation, compatibility, and exact human approval by manifest hash | No Alpha byte, spike marker, JSON object, fingerprint, QR payload, or fixture is protocol v1            |

## Experiment-only choices

Historical Milestones 1 and 2, the provisional Alpha work, and any later
authorized v1 comparison may need local reversible choices so an experiment can
run. Each such choice must:

1. be labeled experiment-only and unstable in output and documentation;
2. be isolated so the alternative spike can be compared fairly;
3. avoid the names `v1`, `version 1`, `stable`, `canonical`, and `compatible`;
4. use synthetic data and disposable identities;
5. record why it was necessary and how much custom protocol surface it added;
6. be discarded or reconsidered at its controlling v1 decision checkpoint; and
7. leave every byte-level detail unresolved until the evidence is reviewed.

## Milestone 3 outcomes

Milestone 3 can produce one of four outcomes for each question:

- **Recommend:** comparative evidence favors a choice and its residual risks are
  explicit.
- **Defer:** evidence is insufficient and the choice is not needed for the next
  narrowly approved task.
- **Narrow:** use an existing interoperable tool or format and remove the custom
  feature from CipherBook.
- **Reject:** the choice creates more risk or maintenance cost than the observed
  benefit justifies.

Milestone 3 was not performed. The maintainer later approved direction-level v1
work without treating that missing evaluation as completed. The v1 readiness
roadmap now supplies staged evidence and stop gates. The maintainer's procedural
override authorizes technically performable work, but every completed choice
still requires a recorded decision and evidence. Missing human observations and
independent review cannot be supplied by implementation work.
