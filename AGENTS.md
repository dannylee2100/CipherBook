# CipherBook Agent Instructions

> [!WARNING]
> CipherBook is a research hypothesis, not an established protocol or released
> application. Do not use real secrets or real sensitive information during the
> experimental milestones.

## Current project status

The repository is testing whether a verified-contact encrypted-envelope
workflow is useful and understandable enough to justify further development.
Technical feasibility alone is not a reason to continue. The project may be
narrowed or archived after evaluation.

CipherBook is not a chat application. It is not production-ready or
independently reviewed. No protocol, artifact format, production architecture,
or compatibility guarantee exists yet.

The only currently authorized plan consists of Milestones 0 through 3 in
`docs/LEAN_VALIDATION_PLAN.md`. Further architecture, protocol, product, release,
or deployment work is forbidden until Milestone 3 is complete and continuation
is explicitly approved by a human.

## Required reading

Before planning, reviewing, or changing this repository, read these files in
full:

- `README.md`
- `docs/THREAT_MODEL.md`
- `docs/LIMITATIONS.md`
- `docs/UNRESOLVED_DECISIONS.md`
- `docs/LEAN_VALIDATION_PLAN.md`

Treat the lean validation plan and unresolved-decision log as authoritative for
the current phase. Stop and report any contradiction instead of silently
choosing an architecture.

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

## Current security and product boundaries

- Use only synthetic payloads and disposable identities during experimental
  milestones.
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
- A compromised endpoint, browser, extension, operating system, or recipient is
  outside the protections being tested.
- Existing transports can expose participants, timing, length, frequency, and
  other communication metadata.

## Agent workflow rules

- Work only on the explicitly authorized milestone and keep the change narrow.
- Preserve unresolved decisions unless a later approved evaluation resolves
  them.
- Prefer disposable experiments over stable architecture or protocol work.
- Never invent cryptographic primitives or compose low-level cryptography.
- Use maintained high-level libraries only within an authorized experimental
  spike.
- Clearly label every executable spike and all of its output as experimental and
  unstable.
- Never add persistent storage, recovery, PWA installation, service workers,
  hosting, CI/CD, release engineering, or production claims unless the approved
  milestone explicitly authorizes that exact work.
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
