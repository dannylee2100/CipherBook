# CipherBook Agent Instructions

> [!WARNING]
> CipherBook is a research hypothesis, not an established protocol or released
> application. Do not use real secrets or real sensitive information during the
> experimental milestones.

## Current project status

The repository began by testing whether a verified-contact encrypted-envelope
workflow is useful and understandable enough to justify further development.
The planned Milestone 2B human pilot was deferred before recruitment; no human
observations or Milestone 3 analysis exist. The maintainer has separately
authorized CipherBook Alpha 0 as a small engineering exercise and then Alpha 1
as a narrow manual encrypted identity-file continuity experiment despite that
missing usability evidence. The project may still be narrowed, redesigned, or
archived.

CipherBook is not a chat application. It is not production-ready,
independently reviewed, or appropriate for real secrets. No protocol,
production architecture, or CipherBook compatibility guarantee exists. Alpha 1
temporarily reuses the experimental sodium formats and adds one disposable
identity-file format without promoting any artifact to a stable format.

The historical validation plan remains in `docs/LEAN_VALIDATION_PLAN.md`.
Existing executable engineering work remains limited to the narrow Alpha 0
scope recorded in `docs/decisions/ALPHA-0001-sodium-browser-alpha.md` and issue
#9, plus manual encrypted identity-file continuity recorded in
`docs/decisions/ALPHA-0002-encrypted-identity-file.md` and issue #11. Those
approvals do not complete Milestone 3, resolve a final project decision, or
authorize automatic persistence, a production vault, recovery service,
deployment, release engineering, or protocol design.

The current Alpha identity-only restore behavior is recorded in
`docs/decisions/ALPHA-0003-identity-only-restore.md` and issue #15. It narrows
what the existing Alpha 1 file may restore; it does not authorize another file
format, relationship persistence, contact storage, or a final trust model.

On 2026-07-24, the maintainer approved the product directions in the
"CipherBook v1 Direction Handoff" and the milestone roadmap in
`docs/V1_READINESS_PLAN.md`. The maintainer then explicitly overrode the
sequential approval procedure and authorized all technically performable v1
work, including a GitHub Pages preview. That override is recorded in accepted
`docs/decisions/V1-0001-direction-and-supersession.md`.

The override does not establish representative human evidence or independent
review. Until those actually occur, a hosted build must disclose their absence,
remain inappropriate for real secrets, and avoid claims of product fitness.

## Required reading

Before planning, reviewing, or changing this repository, read these files in
full:

- `README.md`
- `docs/THREAT_MODEL.md`
- `docs/LIMITATIONS.md`
- `docs/UNRESOLVED_DECISIONS.md`
- `docs/LEAN_VALIDATION_PLAN.md`
- `docs/V1_READINESS_PLAN.md` when planning or reviewing v1 work
- `docs/decisions/V1-0001-direction-and-supersession.md` when working on v1
  authority or Milestone V1-1
- `docs/decisions/V1-0002-sodium-construction.md` when working on the selected
  v1 construction direction
- `docs/decisions/V1-0007-hosted-preview.md` when working on GitHub Pages or
  public-preview behavior
- `docs/decisions/ALPHA-0001-sodium-browser-alpha.md` when working on Alpha 0
- `docs/decisions/ALPHA-0002-encrypted-identity-file.md` when working on Alpha 1
- `docs/decisions/ALPHA-0003-identity-only-restore.md` when working on Alpha 1
  identity restore behavior

Treat the unresolved-decision log, the historical validation record, the v1
readiness roadmap, and the narrow Alpha decisions as authoritative for their
respective scopes. Stop and report any contradiction instead of silently
expanding an authorization, choosing protocol details, or skipping a review
checkpoint.

## Approved v1 directions and unresolved details

The original v1 handoff approved these direction-level product decisions. The
later procedural override authorizes their technical implementation subject to
the recorded evidence and limitation requirements:

1. maintained high-level libsodium operations are the v1 cryptographic family;
2. v1 uses a logically separate transferable signing identity;
3. v1 may use a compact custom CipherBook envelope only if later evidence
   continues to justify it;
4. v1 verification is layered across complete QR data, full grouped
   hexadecimal, and a 16-emoji public convenience view;
5. contacts imported through QR or text remain unverified until a separate
   trusted interaction, then are pinned and require reverification after a key
   change;
6. v1 targets stable and explicitly temporary identities plus immediate and
   inactivity locking; and
7. GitHub Pages is the intended final-v1 host after every release gate passes;
   V1-0007 separately permits an earlier development preview.

V1-0002 selects sealed-box encryption plus an inner transferable signature as
the construction direction. V1-0007 selects the controls for an early GitHub
Pages development preview. Neither decision defines protocol v1 bytes or
establishes missing review evidence.

These details remain unresolved and must not be described as preferred,
approved, or final:

1. exact signature input bytes, verification order, and protocol failure order;
2. every custom contact and envelope field or byte;
3. contact identifiers, relationship-digest bytes and ordering, emoji mapping,
   and the final verification authorization flow;
4. QR reciprocity, spoken comparison, and manual fallback behavior;
5. deterministic CBOR versus canonical JSON and the strict-decoding profile;
6. persistent vault, recovery, KDF, lock timeout, rotation, and old-envelope
   behavior;
7. final v1 release provenance and update policy beyond the accepted preview
   deployment controls; and
8. all protocol v1 bytes and compatibility rules.

Experimental choices do not resolve these details. Never convert Alpha output,
spike output, test fixtures, or study encodings into protocol v1 without the
accepted decision and vector-manifest hash required by the readiness roadmap.

Alpha 0 provisionally chose sodium, the existing unstable sodium encodings, a
full hexadecimal comparison, and a 16-emoji convenience view. Alpha 1 locally
adds one fixed, unstable Argon2id/XChaCha20-Poly1305 identity file. The v1
direction does not promote, migrate, or relabel any of them.

## Current security and product boundaries

- Use only synthetic payloads and disposable identities during experimental
  milestones and Alpha testing. Alpha 1 files must contain test identities only.
- Do not claim anonymity, metadata hiding, endpoint protection, forward secrecy,
  enforced deletion, enforced expiration, recipient restraint, or censorship
  resistance.
- Do not imply production readiness, independent review, or suitability for real
  sensitive information.
- Alpha emojis, words, QR, and hexadecimal remain experimental public
  representations. The v1 direction approves a layered full-QR/full-hex/
  16-emoji design, but its digest bytes, mapping, authorization flow, and human
  usability remain unresolved.
- A verification representation is never an encryption key, password, secret,
  or recovery mechanism.
- A transferable signature can be shown to third parties. It proves control of
  a verified signing key over specified bytes, not physical identity,
  truthfulness, intent, authority, or exclusive key control.
- Treat contacts, envelopes, QR input, and all other imported data as untrusted.
- Treat encrypted identity files as hostile. Reject size, exact length, magic,
  and fixed profile before KDF work; never accept file-selected KDF cost.
- A compromised endpoint, browser, extension, operating system, or recipient is
  outside the protections being tested.
- Existing transports can expose participants, timing, length, frequency, and
  other communication metadata.
- GitHub Pages may observe normal hosting metadata. Intended hosting does not
  make served code immutable or independently reviewed.

## Agent workflow rules

- Work only on the explicitly authorized milestone and keep the change narrow.
- For v1, follow `docs/V1_READINESS_PLAN.md` and record the decision and evidence
  that controls each technical milestone. The maintainer's procedural override
  permits implementation and Pages work without a new message at every
  checkpoint, but it does not permit inventing evidence or hiding failed gates.
- For Alpha 0, work only within issue #9 and ALPHA-0001. For Alpha 1 core
  cryptographic and identity-file behavior, work only within issue #11 and
  ALPHA-0002. Issue #13 separately authorizes a presentation and documentation
  follow-up limited to explanatory copy, accessibility wiring, session-only
  download-started state, and focused tests. It does not authorize changes to
  cryptography, the identity-file format, persistence, recovery, deployment, or
  protocol design. Issue #15 and ALPHA-0003 separately authorize documentation,
  UI clarification, and guardrail tests for the current identity-only restore
  decision. They do not authorize relationship persistence or file-byte changes.
- Preserve unresolved decisions unless a later approved evaluation resolves
  them.
- Prefer disposable experiments over stable architecture or protocol work.
- Never invent cryptographic primitives or compose low-level cryptography.
- Use maintained high-level libraries only within an authorized experimental
  spike.
- Clearly label every executable spike and all of its output as experimental and
  unstable.
- Never add automatic persistent storage, a production vault, recovery service,
  PWA installation, service workers, hosting, deployment, release engineering,
  or production claims unless an approved milestone explicitly authorizes that
  exact work. Alpha 1 authorizes only manual encrypted-file download/import and
  its focused CI check.
- Never log or commit real private keys, plaintext secrets, tokens, credentials,
  passphrases, environment files, or recovery data.
- Avoid unnecessary dependencies and document why any authorized experimental
  dependency is needed.
- Treat malformed input as hostile and make experimental failure states explicit.
- Review the complete diff, secret exposure, unsupported claims, and milestone
  scope before committing.
- Work on a feature branch or isolated worktree. Do not commit directly to
  `main`.
- Stop and report contradictions, unsafe composition, scope expansion, or
  pressure to make production claims.

## Milestone-specific authorization

### Milestone V1-0: authority reconciliation

Completed as part of the accepted procedural override. Its maximum scope was:

- record the approved v1 direction and remaining unresolved details;
- propose V1-0001 for maintainer review;
- reconcile `AGENTS.md`, the threat model, limitations, and unresolved-decision
  log;
- retain Alpha artifacts as historical and unstable; and
- make documentation changes only.

It must not add application code, dependencies, protocol files or bytes, test
suites, CI, release labels, GitHub settings, hosting, or deployment.

### Milestone V1-1: sodium construction comparison

Completed under accepted V1-0001 and recorded in V1-0002. Its scope was the
disposable synthetic comparison specified by the readiness roadmap:

- inner transferable signature encrypted with `crypto_box_seal`;
- the same signed inner model encrypted with static `crypto_box_easy`;
- Node, Chromium, and Firefox evidence;
- tamper, wrong-key, forgery, replay, re-encryption, size, and compromise
  probes; and
- proposed V1-0002 with no final bytes or production integration.

Its experiment did not create product packages, select serialization, define
protocol v1, or add a vault. The later Pages-preview work is separately
controlled by V1-0007 rather than inferred from V1-1.

### Milestones V1-2 through V1-9

Technically performable work is authorized by the maintainer's procedural
override. Each milestone must still record its evidence, failed gates, and
unresolved risks. Representative human observations and independent review
cannot be marked complete by the implementation agent.

GitHub Pages publication is authorized only as an honestly labeled preview
until the human-pilot and independent-review requirements actually pass. Such a
preview must retain the no-real-secrets warning, disclose GitHub hosting
metadata, and must not claim that `v1.0.0` proves product fitness.

### Milestone 0: project charter

Documentation only. Application code, package manifests, dependencies, protocol
files, test suites, CI, deployment, hosting, and PWA artifacts are not authorized.

### Milestone 1: disposable CLI comparison

Requires separate human approval. Its maximum scope is:

- one disposable CLI harness comparing libsodium and age/Typage experiments;
- synthetic payloads and disposable identities only;
- visibly unstable experimental output;
- no persistent vault or recovery;
- no stable serialization or protocol commitment; and
- no production claims.

The comparison must not be treated as approval of either construction.

### Milestone 2: memory-only browser experiment

Requires separate human approval. Its maximum scope is:

- temporary identities and memory-only state;
- the authorized contact, verification, seal, open, copy, and clear UX study;
- no persistent storage or recovery;
- no service worker or PWA installation;
- no production deployment, including no GitHub Pages deployment; and
- no stable format or protocol commitment.

### Milestone 3: evaluation and go/no-go

Compare technical evidence and user observations, then make an explicit decision
to continue, narrow, or archive. A positive evaluation permits only preparation
of a revised plan. It does not itself authorize architecture, protocol,
persistence, deployment, release, or implementation work.

### Alpha 0: temporary sodium browser envelope utility

The maintainer authorized this track after deferring, not completing, the human
pilot. Its maximum scope is:

- a sodium-only, locally run browser utility for developers and curious testers;
- temporary in-memory identities and one counterparty;
- the existing unstable sodium contact and envelope encodings;
- a full hexadecimal relationship comparison plus an explicitly unvalidated
  16-emoji convenience view;
- text seal/open, explicit copy/share, and complete application-state reset;
- Chromium and Firefox automation; and
- local static build inspection without publication or deployment.

It must not add age as a user-facing mode, persistent storage, recovery, PWA
installation, service workers, deployment, a stable protocol, production
claims, or usability claims. It must not alter the historical experiment
directories or frozen Milestone 2B tag.

### Alpha 1: manual encrypted identity-file continuity

The maintainer authorized this track in issue #11 and ALPHA-0002. Its maximum
scope is:

- retain the Alpha 0 envelope/contact bytes and recipient-local semantics;
- manually download and manually import one fixed 107-byte encrypted identity
  file using the exact Alpha 1 profile;
- use official bundled libsodium Argon2id13 interactive password derivation and
  XChaCha20-Poly1305 combined-mode authenticated encryption;
- encrypt only the 32-byte `crypto_box` private key and reconstruct the public
  key with an official sodium operation;
- keep passphrases and selected files out of long-lived application state;
- perform best-effort secret-buffer clearing and atomic identity replacement;
- restore only the local identity and reconstruct the same local public contact;
- require manual counterparty contact re-import and full hexadecimal
  reverification after every successful restore;
- keep counterparty contacts, relationship diagnostics, verification
  confirmation, aliases, trust state, and messages out of the identity file and
  out of restored application state;
- do not treat successful identity restoration as successful counterparty
  verification;
- test Chromium and Firefox, including real-profile allocation and observations;
  and
- add the focused `Alpha 1 encrypted identity file` CI check without weakening
  existing checks or branch protection.

Issue #11 and ALPHA-0002 remain the authority for Alpha 1 cryptographic and
identity-file behavior. Issue #13 authorizes one post-implementation
presentation and documentation follow-up limited to explanatory copy,
accessibility wiring, a session-only boolean recording whether this page started
a download for the active identity, and focused tests. It does not change the
107-byte identity-file format, authorize automatic persistence or managed
backup, establish usability evidence, or resolve any of the nine final project
decisions.

Issue #15 and ALPHA-0003 record the identity-only restore decision for the
current Alpha. Current Alpha identity files may restore only the local identity.
Counterparty contacts, relationship diagnostics, verification confirmations,
aliases, trust state, and messages must not be added to the identity file or
restored across sessions without a new explicit authorization and decision
review. Successful restore must require manual counterparty re-import and full
hexadecimal reverification; it is not successful counterparty verification.

Alpha 1 must not add automatic storage, a persistent vault, managed backup,
password recovery, accounts, sync, multiple identities, contact persistence,
hardware-backed-key claims, deployment, PWA installation, service workers,
stable-format claims, protocol version 1, production claims, or usability
claims. The one approved historical-source maintenance change is replacing the
standard sodium wrapper import with the official sumo wrapper required for
`crypto_pwhash`; no experiment behavior or encoding may change.

## Review requirements

For every milestone, verify that:

- its objective acceptance criteria are met;
- facts, assumptions, hypotheses, and decisions remain distinguishable;
- no experimental artifact is called stable, canonical, compatible, audited, or
  protocol version 1;
- no unsupported positive security or privacy claim was introduced;
- no real secret, credential, key, recovery file, or personal information was
  added; and
- excluded files and features were not introduced indirectly.

When evidence is missing or ambiguous, record the uncertainty or stop. Do not
compensate by adding architecture, features, infrastructure, or marketing.
