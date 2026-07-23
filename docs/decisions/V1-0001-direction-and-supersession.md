# V1-0001: Direction, boundaries, and Alpha supersession

- Status: accepted with procedural override
- Proposed: 2026-07-24
- Accepted: 2026-07-24
- Scope: v1 readiness direction and milestone authority
- Governing plan: `docs/V1_READINESS_PLAN.md`

> [!CAUTION]
> This record does not define protocol bytes or establish missing human or
> independent-review evidence. The maintainer has separately overridden the
> sequential approval procedure as recorded below.

## Context

CipherBook began as a research hypothesis. The planned representative human
pilot was deferred, Milestone 3 was not performed, and the maintainer later
authorized narrow Alpha 0 and Alpha 1 engineering exercises. Those Alpha
decisions use one static sodium encryption identity, recipient-local
authentication, unstable contact and envelope encodings, a provisional
fingerprint display, and one manual encrypted identity-file format.

On 2026-07-24, the maintainer approved a new v1 product direction and the
readiness roadmap in `docs/V1_READINESS_PLAN.md`. That original approval
permitted documentation-only authority reconciliation. The later procedural
override authorizes technically performable work without creating evidence that
does not exist.

## Evidence categories

### Facts

- Existing Alpha artifacts are explicitly unstable and are not protocol v1.
- The existing Alpha public contact and encrypted identity file contain no
  separate signing identity.
- Existing Alpha sender authentication is recipient-local, deniable, and
  recipient-forgeable.
- V1-1 has compared both authorized sodium constructions; V1-0002 selects
  sealed-box encryption plus an inner transferable signature as the direction.
- No representative human pilot, independent implementation, protocol
  specification, v1 test-vector set, or independent review exists.
- GitHub Pages is configured for Actions under V1-0007. Any resulting
  deployment is a development preview, not a v1 release artifact.

### Approved product directions

The maintainer has approved these direction-level decisions:

1. CipherBook remains the project name.
2. New v1 construction research is limited to maintained high-level libsodium
   operations.
3. V1 sender authentication uses a logically separate transferable signing
   identity.
4. The signature is placed inside the encrypted content and binds the protocol
   domain, version, sender, intended recipient, and payload.
5. Public contacts contain logically separate encryption and signing public
   keys.
6. V1 research may define a compact custom CipherBook envelope if the evidence
   gates continue to justify its parser and compatibility cost.
7. Verification is layered: complete contact or relationship data in QR, full
   grouped hexadecimal as the exact manual and accessibility fallback, and 16
   numbered emojis with spoken labels as public convenience data.
8. Contacts imported from a messenger or QR remain unverified until a genuinely
   separate trusted interaction is completed. Verified contacts are pinned,
   and key changes stop sealing until complete reverification.
9. V1 targets stable and explicitly temporary identities, immediate locking,
   inactivity locking, and only encrypted retained identity material.
10. GitHub Pages is the intended initial host after all release gates pass.
11. `v1.0.0` is a compatibility promise, not proof that CipherBook has no
    security limitations.

### Assumptions to test

- Transferable signatures match a real occasional-envelope need despite their
  disclosure and dispute consequences.
- A custom envelope adds value that outweighs its new parser and compatibility
  surface.
- A two-key contact and layered verification flow remain understandable.
- A browser vault and automatic lock can be presented without implying
  guaranteed memory erasure or hardware-backed protection.
- One maintainer can support the protocol, CLI, browser, vault, dependencies,
  vulnerability process, and hosted releases.

### Hypotheses

- The selected sodium construction will remain the smallest clear composition
  after exact protocol fields and parsing rules are introduced.
- One serialization candidate will support deterministic signing and strict
  hostile-input rejection consistently across the browser, CLI, and an
  independent verifier.
- Representative participants can reject seeded contact mismatches and explain
  what a verified signing key proves and does not prove.

## Decision

This record supersedes the Alpha-only roadmap for **new v1 evidence work** while
preserving every Alpha artifact and decision as historical.

Before the later procedural override, it authorized Milestone V1-1 only:

- compare an inner transferable signature encrypted with
  `crypto_box_seal`; and
- compare the same signed inner model encrypted with static
  `crypto_box_easy`.

Milestone V1-1 is a disposable, synthetic-data comparison. It does not select
the final construction, define protocol bytes, alter Alpha application code,
create a product package, or authorize deployment.

The original review procedure required each later checkpoint in
`docs/V1_READINESS_PLAN.md`. The maintainer's override at the end of this record
now supplies authority to perform those technical tasks without another
message. The evidence each checkpoint calls for must still be recorded. In
particular:

- V1-0002 must select the sodium construction;
- V1-0003 must select the serialization and strict-decoding profile;
- V1-0004 must approve exact protocol bytes and vector-manifest hash before
  product implementation;
- V1-0005 must approve verification and contact-trust behavior;
- V1-0006 must approve vault, lock, and recovery behavior;
- V1-0007 must approve hosting and updates; and
- V1-0008 must approve the exact v1 release.

## Details that remain unresolved

Acceptance of this record does not decide:

- exact signature input bytes or verification order for the selected
  sealed-box-plus-signature direction;
- contact identifiers, key identifiers, relationship-digest bytes, ordering,
  domain tags, or emoji mapping;
- deterministic CBOR versus canonical JSON;
- any field, numeric identifier, length, marker, armor, or other protocol byte;
- replay-warning behavior;
- key rotation, revocation, or old-envelope access;
- persistent browser storage versus file-mediated stable identity;
- encrypted-vault bytes, KDF profile, recovery behavior, or inactivity timeout;
- supported mobile browser versions;
- PWA installation or service-worker behavior;
- independent reviewer, accepted residual findings, or suitability claims; or
- hosted-preview implementation details beyond the separately recorded
  `V1-0007` decision.

## Permanent security boundaries

The v1 direction does not authorize claims of:

- anonymity or transport-metadata hiding;
- protection from a compromised endpoint, browser, extension, operating system,
  keyboard, display, or clipboard;
- enforced deletion, expiration, recall, or recipient restraint;
- censorship resistance;
- guaranteed memory erasure;
- protection when both contact exchange and verification are controlled by an
  attacker; or
- forward secrecy unless a later accepted construction actually demonstrates
  it.

A transferable signature can be revealed to other people. It proves control of
the verified signing key over the specified signed bytes, not physical identity,
truthfulness, intent, authority, or exclusive key control.

## Consequences

- Alpha format bytes and historical documentation remain Alpha artifacts and
  are not migrated or renamed.
- New v1 work is isolated in new directories and governed by the readiness
  milestones.
- A hosted copy of the existing browser utility may use the user-facing label
  "development preview" only while it visibly states that its formats are
  unstable experimental artifacts and not protocol v1.
- Protocol bytes, a `v1.0.0` release label, and suitability claims remain
  prohibited until their evidence exists and their controlling decisions are
  recorded.
- Failure of a construction, serialization, pilot, independent-review, or
  hosted-artifact gate can narrow or archive the project.

## Acceptance checklist

The maintainer should accept this record only if all statements below are true:

- The approved product directions are represented accurately.
- The permanent limitations will remain visible in v1.
- Current Alpha artifacts will not be promoted or silently migrated.
- Milestone V1-1 will remain a disposable comparison using synthetic data.
- Any early GitHub Pages publication will be labeled as an unreviewed
  development preview rather than v1.
- Each completed technical decision will be recorded separately with its
  evidence and residual risks.

## Maintainer approval and procedural override

On 2026-07-24, the maintainer explicitly approved overriding the roadmap's
sequential approval procedure and instructed the implementation agent to
proceed with all technically performable work, including GitHub Pages.

This override:

- accepts V1-0001;
- authorizes technical work across V1-1 through V1-9 without a separate
  maintainer message at every checkpoint;
- authorizes a public GitHub Pages preview before representative human evidence
  or independent review exists;
- requires each technical decision, test result, unresolved risk, and deviation
  from the readiness roadmap to remain recorded; and
- does not authorize false claims that human validation or independent review
  occurred.

Until the representative pilot and independent review actually occur, a hosted
build must disclose those absences, remain unsuitable for real secrets, and
must not present `v1.0.0` as evidence of product fitness. The implementation
agent cannot perform an independent review of its own work or create
representative human observations.
