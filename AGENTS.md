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

The historical validation plan remains in `docs/LEAN_VALIDATION_PLAN.md`. The
only additional engineering work currently authorized is the narrow Alpha 0
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

## Required reading

Before planning, reviewing, or changing this repository, read these files in
full:

- `README.md`
- `docs/THREAT_MODEL.md`
- `docs/LIMITATIONS.md`
- `docs/UNRESOLVED_DECISIONS.md`
- `docs/LEAN_VALIDATION_PLAN.md`
- `docs/decisions/ALPHA-0001-sodium-browser-alpha.md` when working on Alpha 0
- `docs/decisions/ALPHA-0002-encrypted-identity-file.md` when working on Alpha 1
- `docs/decisions/ALPHA-0003-identity-only-restore.md` when working on Alpha 1
  identity restore behavior

Treat the unresolved-decision log, the historical validation record, and the
narrow Alpha decisions as authoritative for their respective scopes. Stop and
report any contradiction instead of silently expanding the alpha or choosing a
final architecture.

## Decisions that remain unresolved

Do not describe any candidate below as planned, preferred, approved, or final:

1. libsodium `crypto_box` versus age/Typage or another maintained high-level
   construction;
2. recipient-local authentication versus transferable signatures;
3. a custom CipherBook envelope versus an existing envelope format;
4. fingerprint representation and length;
5. QR-first versus spoken or manual verification;
6. serialization format, including whether CBOR, JSON, another format, or no new
   serialization is appropriate;
7. persistent vault and recovery design;
8. hosting and deployment, including GitHub Pages or another approach; and
9. protocol version 1 bytes.

Experimental convenience choices do not resolve these questions. Never convert
spike output, test fixtures, or study encodings into protocol v1 without explicit
human approval following a positive Milestone 3 decision.

Alpha 0 provisionally chose sodium, the existing unstable sodium encodings, a
full hexadecimal comparison, and a 16-emoji convenience view. Alpha 1 locally
adds one fixed, unstable Argon2id/XChaCha20-Poly1305 identity file. These are not
project-wide recommendations or final decisions.

## Current security and product boundaries

- Use only synthetic payloads and disposable identities during experimental
  milestones and Alpha testing. Alpha 1 files must contain test identities only.
- Do not claim anonymity, metadata hiding, endpoint protection, forward secrecy,
  enforced deletion, enforced expiration, recipient restraint, or censorship
  resistance.
- Do not imply production readiness, independent review, or suitability for real
  sensitive information.
- Emojis, words, QR, and hexadecimal are only candidate public verification
  representations for experiments. No representation or fixed emoji length is
  selected.
- A verification representation is never an encryption key, password, secret,
  or recovery mechanism.
- Treat contacts, envelopes, QR input, and all other imported data as untrusted.
- Treat encrypted identity files as hostile. Reject size, exact length, magic,
  and fixed profile before KDF work; never accept file-selected KDF cost.
- A compromised endpoint, browser, extension, operating system, or recipient is
  outside the protections being tested.
- Existing transports can expose participants, timing, length, frequency, and
  other communication metadata.

## Agent workflow rules

- Work only on the explicitly authorized milestone and keep the change narrow.
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
