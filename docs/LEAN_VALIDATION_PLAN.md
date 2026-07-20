# CipherBook Lean Pre-MVP Validation Plan

> [!WARNING]
> CipherBook is an experimental research prototype. Do not use it for real
> secrets. This plan validates a hypothesis; it does not approve a protocol or
> product.

## 1. Objective

Determine whether a verified-contact encrypted-envelope workflow is useful and
understandable enough to justify a separate open-source project and possibly a
new wire format.

The immediate goal is not to release a security product. The default outcome is
allowed to be archival. Four milestones are authorized: a documentation-only
charter, disposable CLI comparison, memory-only browser UX spike, and evidence-
based go/no-go evaluation. A revised plan is produced only after a positive
decision.

## 2. Evidence categories

### Facts

- Existing messengers, age, password managers, encrypted email, and other tools
  already solve important parts of the proposed problem.
- Recipient confidentiality, sender authentication, human contact verification,
  transport metadata, endpoint behavior, and recipient behavior are separate
  concerns.
- Milestone 1 provides disposable Node implementation evidence, Milestone 2A
  provides disposable browser feasibility evidence, and Milestone 2B provides
  a synthetic verification-study harness and unexecuted human-study protocol.
  No verification-method user-observation evidence exists yet.
- No cryptographic construction, wire format, fingerprint choice, storage model,
  host, or protocol bytes are approved.

### Assumptions to test

- A small group of target users has a recurring but occasional need to transfer
  short confidential text through an existing untrusted channel.
- They can verify public contacts through a genuinely separate trusted
  interaction.
- A copy-and-paste envelope has enough contextual advantage to offset contact
  exchange, verification, and key management friction.
- Maintained high-level libraries can support a solo-maintainer experiment in
  both Node and a browser.

### Hypotheses

- Users will prefer the verified-envelope workflow for at least one concrete
  occasional use case over Signal, direct age use, or password-manager sharing.
- Users can accurately understand the authentication semantics presented by at
  least one candidate construction.
- At least one verification method can achieve acceptable full-comparison
  behavior without exclusionary rendering, language, or accessibility costs.
- Either an existing interoperable envelope is sufficient, or the experiment
  will identify a specific, evidence-backed requirement for custom protocol
  work.

### Decisions approved by this plan

- Perform exactly four milestones, numbered 0 through 3.
- Use one minimal CLI harness to compare both constructions.
- Treat all identities, payloads, encodings, and outputs as disposable test
  artifacts.
- Use only synthetic payloads; never solicit or process real secrets.
- Do not call any experiment output protocol version 1.
- Keep all nine choices in
  [Unresolved Decisions](UNRESOLVED_DECISIONS.md) unresolved until comparative
  prototypes and observations exist.

## 3. Decisions deliberately not made

This plan does not select:

1. libsodium `crypto_box`, age/Typage, or another maintained construction;
2. recipient-local authentication or transferable signatures;
3. a custom CipherBook envelope or an existing interoperable format;
4. a fingerprint representation or length;
5. QR-first or spoken/manual-first verification;
6. CBOR or any other serialization;
7. a persistent vault or recovery design;
8. GitHub Pages or any other production host or deployment design; or
9. protocol version 1 bytes.

Choices made solely to run a spike are test-fixture details. They remain
explicitly unstable and confer no protocol status.

## 4. Comparative technical spikes

Milestone 1 implements two throwaway modes behind one test harness. Milestone 2
uses those same modes to expose the workflow for observation. The comparison
must keep raw construction output size separate from any harness-only diagnostic
wrapper.

### Spike A: libsodium relationship envelope

Evaluate a maintained high-level libsodium `crypto_box` interface with a static
sender test key and static recipient test key. Do not assemble a replacement
construction from low-level primitives.

The spike must measure and demonstrate:

- recipient confidentiality and tamper detection;
- sender authentication as seen locally by the recipient;
- rejection with the wrong recipient key and with an outsider's sender key;
- recipient forgeability: the recipient must attempt to create an envelope that
  the same recipient-facing check attributes to the sender;
- envelope size for fixed payload sizes, reporting crypto output separately from
  diagnostic framing;
- browser and Node support through the maintained library distribution;
- consequences of later sender-key, recipient-key, and combined-key compromise
  for recorded experimental envelopes; and
- dependency surface, custom code, error-handling complexity, and concepts the
  UI must explain.

Any wrapper should carry an unmistakable marker such as
`CIPHERBOOK-EXPERIMENT-A-UNSTABLE`. Its syntax is a harness detail, not an
interchange format.

### Spike B: age/Typage-based envelope

Evaluate native age recipient encryption through a maintained TypeScript/browser
implementation such as Typage, plus the official age CLI as the interoperability
reference. Preserve native age armor for interoperation rather than renaming it
a CipherBook format.

The spike must measure and demonstrate:

- official age CLI to harness and harness to official age CLI interoperation;
- browser and Node behavior;
- recipient confidentiality, tamper detection, wrong-recipient failure, and
  envelope size;
- the absence of native sender authentication in the recipient-encryption flow;
- the fact that any party with the public recipient can create an envelope the
  recipient can open;
- whether verified-contact UX plus transport context is sufficient when the UI
  says the sender is unverified;
- whether adding authentication would require a detached signature, a
  sign-then-encrypt profile, a custom wrapper, new key types, or other protocol
  work; and
- whether such composition creates confusing failure order, transferable-
  signature consequences, downgrade choices, or interoperability loss.

Do not add a signature composition during the initial spike. Analyze possible
compositions only after native age behavior is working and measured.

### Shared relationship-digest fixture

Both spikes need a deterministic way to show the same verification candidates
during the study. A test-only relationship digest may be computed from a tagged,
length-delimited encoding of the two public test contacts ordered by their raw
bytes. A maintained hash function may be used. The tag, ordering, encoding, hash,
and displayed truncations are all disposable fixture choices, not an approved
contact identifier, fingerprint protocol, serialization, or version.

The UI and CLI must label every representation **public verification data** and
**not a password or encryption key**.

## 5. Fingerprint experiment

The experiment compares methods; it does not approve a 32-emoji fingerprint or
any other final representation or length.

### Candidate tasks

Use the same test-only relationship digest to compare:

- in-person QR verification carrying the full experimental digest and enough
  context to prevent scanning it as an identity secret;
- visual emoji comparison at several candidate lengths;
- spoken comparison using unambiguous public labels for emoji;
- word-based comparison using an established, documented test word list; and
- grouped hexadecimal as the universal text fallback.

Candidate lengths may include, for study purposes only, emoji displays based on
a 64-symbol test alphabet at 8, 16, and 24 symbols (48, 96, and 144 displayed
bits), alongside equal-bit spoken, word, and hexadecimal comparisons where
practical. These are experimental conditions, not recommendations. QR may carry
the full 256-bit fixture digest so the study can compare automation with manual
truncation.

### Security model for shortening

Showing only `n` digest bits discards all but `n` bits of collision resistance.
If an attacker can generate both substituted public contacts and search two sets
for any pair with the same displayed value, generic birthday or meet-in-the-
middle work is approximately `2^(n/2)`, not `2^n`. Under that active two-key
model, example work factors are roughly:

| Displayed bits | Generic active two-key work |
| --- | --- |
| 48 | 2^24 |
| 96 | 2^48 |
| 144 | 2^72 |
| 256 | 2^128 |

If one honest relationship value is fixed and only one substitute can be chosen,
the generic preimage target is closer to `2^n`; that stronger model must not be
used to hide the two-key substitution case. Real security is also capped by key
generation, hash behavior, endpoint integrity, and whether humans actually
compare what is displayed.

### Human risks to test

- **Omission:** a participant fails to compare one or more groups.
- **Skimming:** a participant checks only the beginning, end, colors, or overall
  shape.
- **Transposition:** two correct symbols or groups appear in the wrong order.
- **Rendering:** fonts, platform glyphs, skin-tone or variation selectors, and
  visually similar symbols change interpretation.
- **Accessibility:** a screen reader announces confusing names, a QR task cannot
  be completed, or a visual-only state is inaccessible.
- **Language:** emoji labels or words are unknown, hard to pronounce, culturally
  ambiguous, or confused by non-native speakers.
- **Coordination:** participants compare the wrong screens, verify only one
  direction, or let one device assert success for both.
- **Meaning:** participants mistake a public fingerprint for a secret, password,
  capability, or encryption key.

### Observation design

Use at least six participants for directional evidence, preferably eight. When
the intended audience includes them, include screen-reader users and non-native
speakers; absence of such participants is a recorded evidence gap, not a passed
accessibility result.

Randomize exact-match and mismatch tasks. Place differences at the beginning,
middle, and end, and include transposition, omission, and visually similar cases.
Do not tell participants which cases differ. Record:

- false accepts and false rejects;
- completion time and requests for help;
- which groups were actually compared, using observation and a short immediate
  recall question rather than self-report alone;
- early confirmation before the complete value was available;
- rendering, pronunciation, language, camera, and accessibility failures; and
- whether the participant can explain that the representation is public and
  what successful comparison does and does not establish.

No manual representation should be recommended if any participant falsely
accepts a seeded mismatch in this small study. Passing this gate is necessary,
not sufficient. Final length cannot be selected from cryptographic strength
alone: longer displays may increase theoretical work while causing more
skipping, and a shorter value that people fully compare may still be inadequate
against active collision search.

## 6. Milestone 0: Project charter

### Exact purpose

Define the research question, threat boundaries, limitations, unresolved choices,
and stop conditions before application work begins.

### Deliverables

- `README.md` with the experimental warning, hypothesis, project status, example
  fit and poor fit, validation path, and archival possibility.
- `docs/THREAT_MODEL.md` covering untrusted transports, substitution, human
  error, endpoint and browser compromise, metadata, malicious recipients, key
  loss and compromise, and supply chain.
- `docs/LIMITATIONS.md` rejecting unsupported protection and readiness claims.
- `docs/UNRESOLVED_DECISIONS.md` preserving all nine open decisions.
- This lean validation plan, stored because no approved copy previously existed
  in the repository.

### Objective acceptance criteria

- The README's first content is a warning not to use CipherBook for real secrets.
- CipherBook is described as a hypothesis, not an approved protocol or product.
- All nine unresolved decisions remain visibly unresolved.
- Facts, assumptions, hypotheses, and approved decisions are separately labeled.
- The threat model covers every threat named in the deliverables and states what
  is outside the protection boundary.
- The limitations reject production readiness, independent review, anonymity,
  metadata hiding, enforced deletion and expiration, forward secrecy, endpoint
  protection, recipient restraint, and censorship resistance claims.
- No application, manifest, dependency, source, protocol, test, CI, deployment,
  or PWA file exists.

### Tests and reviews

- Walk one intended occasional-envelope scenario through the stated boundaries.
- Walk one poor-fit scenario to an existing tool.
- Search for unsupported security marketing and classify every occurrence as a
  warning, rejected claim, or defect.
- Search for language that selects a construction, serialization, fingerprint,
  persistence design, deployment, or protocol bytes.
- Inspect the complete diff and repository file list.

### Explicit exclusions

All executable code, dependencies, technical fixtures, schemas, protocol files,
test suites, browser UI, package management, CI, deployment, persistence,
recovery, and visual polish.

### Security questions being answered

- What narrow assets and attacker actions matter to the hypothesis?
- Which protections are impossible under the proposed serverless workflow?
- Which user beliefs would make the concept unsafe or misleading?
- Which needs should immediately route users to established tools?

### Stop conditions

- The concept depends on endpoint, metadata, deletion, expiration, recipient-
  control, or censorship guarantees.
- No credible occasional use remains after comparison with established tools.
- The project cannot be described without readers mistaking the charter for a
  usable product.

## 7. Milestone 1: Disposable CLI comparison

### Exact purpose

Produce the smallest comparable technical evidence for Spike A and Spike B,
without establishing durable keys, a product architecture, or a wire format.

### Deliverables

One minimal Node CLI test harness with explicit `sodium` and `age` experiment
modes. Each mode supports only:

- generating a disposable identity;
- exporting a public test contact;
- deriving the shared study-only relationship fingerprint fixture;
- sealing one text payload;
- opening one text payload; and
- running tamper and wrong-key probes.

Temporary identity files, if required by process boundaries, are plaintext test
artifacts in a newly created temporary directory, deleted after the run, and
accompanied by a no-real-secrets warning. The milestone also produces a concise
comparison record with dependency inventory, custom implementation size,
required framing fields, payload-to-envelope sizes for 32-, 256-, and 2,048-byte
payloads, authentication semantics, forgeability, and later-key-compromise
observations.

### Objective acceptance criteria

For Spike A:

- Node round trips succeed for synthetic Unicode text.
- One changed byte, truncation, the wrong recipient, and an outsider's sender
  key do not yield accepted plaintext.
- A controlled recipient-forgeability test documents whether Bob can create an
  envelope Bob's own recipient-local check attributes to Alice.
- Later sender-key and recipient-key compromise cases are exercised or, where a
  library interface prevents direct replay, analyzed against reproducible test
  artifacts.
- Only a maintained high-level construction interface is used.

For Spike B:

- Typage or the selected maintained age implementation round trips in Node.
- Harness output opens with the official age CLI, and official age CLI output
  opens with the harness, for the selected supported recipient type.
- Tampering, truncation, and wrong-recipient inputs do not yield accepted
  plaintext.
- A third party given only the public recipient can create an accepted native
  age envelope, and the result is presented as sender-unverified.
- Native age armor remains native age armor; any harness metadata is measured
  separately.

For both modes:

- The same synthetic fixtures and size points are used.
- Every output is visibly marked experimental and unstable without using a
  protocol-version label.
- The relationship representation is labeled public and not a password or key.
- Unsupported, malformed, and oversized harness input fails without ambiguous
  partial output.

### Tests

- Deterministic fixture metadata test, without treating generated key bytes as a
  stable vector.
- Round-trip tests for empty, ASCII, multiline, and Unicode payloads within the
  chosen experiment cap.
- Tamper tests against header, body, and final bytes where the native format
  permits those distinctions.
- Truncation at several offsets.
- Wrong-recipient and wrong-sender-context tests.
- Recipient-forgeability test for Spike A.
- Unauthenticated-origin demonstration for Spike B.
- Official age interoperability in both directions.
- Envelope-size report at fixed payload sizes.
- Invalid public contact and malformed envelope handling.
- A check that test output contains the experimental warning and no stable or
  version-1 claim.

### Explicit exclusions

Persistent vaults, passphrases, recovery, device migration, PWA work, QR camera,
service workers, GitHub Pages, production claims, stable formats, production
hardening, transferable signatures, a custom signing composition, and protocol
version 1.

### Security questions being answered

- What confidentiality, tamper, and sender-authentication properties does each
  construction actually expose?
- Can the recipient forge sender attribution under Spike A?
- Is absent sender authentication under Spike B acceptable when stated plainly?
- What happens to recorded envelopes after later key compromise?
- How much custom parsing, framing, and dependency surface does each option add?
- Does age interoperability survive the browser/Node adapter?

### Stop conditions

- A spike requires inventing low-level cryptography, forking age, or masking a
  library failure.
- The harness cannot state authentication semantics accurately and consistently.
- Browser-capable maintained libraries are unavailable or introduce a dependency
  surface unreasonable for a solo-maintained experiment.
- Adding comparable behavior requires so much custom protocol that the comparison
  no longer isolates the constructions.
- Pressure arises to add persistence, recovery, polish, deployment, or real-user
  data before evaluation.

## 8. Milestone 2: Memory-only browser UX spike

### Exact purpose

Observe whether users understand and value the verified-contact envelope flow in
a browser before any persistence, installation, deployment, or protocol choice.

### Deliverables

A locally run browser spike exposing both construction modes and only these
operations:

- create temporary identities;
- export and import public contacts;
- compare the study-only relationship fingerprint using assigned experiment
  variants;
- seal and open one synthetic text payload;
- copy the experimental envelope; and
- clear all visible and in-memory state.

The study surface includes candidate QR display/scan, visual emoji, spoken emoji
labels, words, and hexadecimal. QR support is study instrumentation, not a
production camera design. Reload and Clear reset the application interface and
drop its temporary identity and payload references; browser, operating-system,
clipboard, extension, crash, or memory layers may still retain copies.

### Objective acceptance criteria

- Both construction modes complete the same temporary contact, seal, copy, and
  open workflow in current Chromium and Firefox test environments.
- Node-to-browser and browser-to-Node experimental artifacts interoperate within
  each spike; the age mode also preserves native age CLI interoperation.
- The libsodium mode describes recipient-local authentication and recipient
  forgeability; the age mode never labels an open envelope as sender-authenticated.
- All verification variants derive from the same test-only relationship fixture,
  and the interface states that the representation is public.
- No IndexedDB, local storage, Cache API, service worker, passphrase, recovery,
  analytics, network dependency, or remote runtime asset is used.
- Reload and explicit Clear make all prototype state unavailable to the UI; the
  documentation states that browser memory and clipboards cannot be guaranteed
  erased.
- At least one mobile-device QR round trip is attempted and any platform gaps are
  recorded rather than hidden.

### Tests

- Temporary identity creation and public-contact import/export in both modes.
- Browser/Node round trips for ASCII, multiline, and Unicode synthetic payloads.
- Tamper, corrupt input, unknown sender context, and wrong-recipient states.
- Copy behavior and clear/reload behavior.
- Automated inspection confirming absence of persistence APIs and service-worker
  registration.
- Controlled exact-match and mismatch tasks for each assigned fingerprint
  representation.
- QR displays the full assigned experimental relationship data and rejects a
  different relationship fixture.
- Screen-reader reading order and spoken-label output check.
- Cross-platform rendering notes and a multilingual label/word-list check where
  participants are available.

### Explicit exclusions

IndexedDB, local storage, passphrase protection, recovery, offline installation,
service workers, native packaging, production QR/camera engineering, public
hosting, deployment, a stable protocol, production data, UI polish, chat
features, and persistent contacts.

### Security questions being answered

- Do users complete verification or merely click through it?
- Do users know which party, if any, the construction authenticates?
- Does copying through an untrusted transport feel useful or needlessly awkward?
- Which verification method causes false acceptance, exclusion, or false
  confidence?
- Does the browser environment add warnings and failure modes that overwhelm the
  narrow workflow?

### Stop conditions

- Either construction needs an unsafe browser fallback or remote runtime code.
- Users repeatedly infer authenticated sender identity in the age mode or third-
  party proof in the recipient-local mode.
- Any candidate representation produces false acceptance, systematic skimming,
  or inaccessible operation that cannot be tested without expanding scope.
- QR camera behavior consumes the experiment; replace it with controlled study
  instrumentation rather than building camera infrastructure.
- Participants prefer existing tools for their concrete scenarios or reject the
  verification overhead.
- Persistence, recovery, installation, or deployment is treated as necessary to
  answer the immediate usability question.

## 9. Milestone 3: Evaluation and go/no-go

### Exact purpose

Compare the technical and observational evidence, decide whether a custom
project or protocol is justified, and stop unless explicit continuation gates
are met.

### Deliverables

- A decision matrix comparing both constructions.
- De-identified raw observation notes separated from interpretation.
- Fingerprint-method results with false accepts, false rejects, completion time,
  comparison coverage, rendering, accessibility, and language gaps.
- A recommended construction or a finding that neither is appropriate.
- A recommended verification method or a finding that none passed.
- A decision to use an existing envelope, justify further custom-format research,
  or abandon the envelope work.
- A project-level decision to continue, narrow, or archive.
- A revised implementation plan only if the result is positive and explicitly
  approved.

The decision matrix must cover confidentiality, tamper behavior, sender semantics,
recipient forgeability, later key compromise, browser and Node support, official
interoperability, envelope size, custom protocol surface, authentication work,
user comprehension, solo-maintainer burden, and exit path to an existing tool.

Observe at least six representative participants. For each, record task
completion, time, critical mistakes, seeded-mismatch results, concrete intended
use, current alternative, preference after completing the task, and explanation
of limitations.

### Objective acceptance criteria

- Every matrix rating links to a reproducible test result, primary library
  documentation, size result, or observation; unsupported cells remain unknown.
- Raw observations and maintainer interpretation are visibly separate.
- The report states precisely whether sender authentication is absent,
  recipient-local and recipient-forgeable, or transferable.
- Any recommendation for a custom format names a concrete requirement that
  native age or another existing format cannot meet without unsafe composition.
- Any continuation recommendation identifies a user advantage over existing
  tools, not merely technical feasibility.
- No experimental encoding is promoted to stable or protocol version 1.
- Unresolved decisions that are unnecessary for the next task remain unresolved.

Directional continuation gates are all of the following:

- at least four of six participants identify a concrete recurring use and prefer
  the tested workflow to their current alternative for that use;
- at least five of six complete contact verification, seal, transport, and open
  without a critical mistake;
- every participant can explain that the fingerprint is public and is not a
  password or encryption key;
- participants understand the selected candidate's sender-authentication limits;
- a maintained high-level library works in both Node and the browser without
  custom low-level cryptography; and
- the observed dependency, interoperability, documentation, and support burden
  is credible for one maintainer.

These small-sample gates permit further validation; they do not establish market
demand, accessibility, or production fitness.

### Tests and reviews

- Rerun both spike suites from a clean checkout using only synthetic fixtures.
- Verify both directions of official age interoperability again.
- Trace every decision-matrix claim to evidence.
- Check observation totals and seeded-mismatch outcomes against raw notes.
- Conduct an adversarial review from three perspectives: an age interoperability
  maintainer, a cryptographic reviewer, and a user confused about sender identity.
- Search the report for stable-format, protocol-version, production, anonymity,
  deletion, metadata, and audit claims.

### Explicit exclusions

Persistent vaults, recovery, a stable protocol, production dependencies,
application architecture, governance expansion, CI, service workers, deployment,
GitHub Pages, production security claims, and new product features.

### Security questions being answered

- Which construction's actual properties best match the observed user need?
- Can participants act correctly under its sender-authentication semantics?
- Does any manual or QR verification method survive active substitution and
  human-error testing well enough to justify further study?
- Is custom protocol work necessary, or would it reduce interoperability without
  compensating value?
- Can one maintainer responsibly carry the remaining attack and support surface?

### Stop conditions

Archive or sharply narrow the project if any of the following holds:

- participants prefer Signal, direct age use, a password manager, or another
  established tool for the concrete scenario;
- the verification step is routinely skipped, rejected, or misunderstood;
- sender-authentication semantics create persistent false beliefs;
- fingerprint methods create false confidence or fail seeded mismatch tasks;
- a custom format adds no demonstrated user value;
- maintained high-level libraries cannot support the required Node and browser
  behavior without custom cryptography or fragile composition; or
- dependency, interoperability, documentation, and user-support burden is
  disproportionate for a solo maintainer.

If age is sufficient and the UX hypothesis survives, the narrow continuation is
an age-compatible interface unless evidence identifies a specific need for more.

## 10. Smallest recommended first execution task

Complete Milestone 0 as a documentation-only change. Do not begin either
technical spike in the same branch or worktree.

### Exact files to create

- `README.md`
- `docs/THREAT_MODEL.md`
- `docs/LIMITATIONS.md`
- `docs/UNRESOLVED_DECISIONS.md`
- `docs/LEAN_VALIDATION_PLAN.md` when the approved plan is not already stored

Do not create a package manifest, source directory, protocol directory, tests,
CI configuration, deployment configuration, or application assets.

### Exact reviews and tests

1. Confirm the README begins with the experimental/no-real-secrets warning.
2. Confirm all nine open decisions appear and remain unresolved.
3. Check the threat model for each required attacker and limitation.
4. Check the limitations document for every explicitly rejected claim.
5. Search for unsupported marketing terms and classify each result.
6. Search for an accidental construction, serialization, fingerprint, storage,
   hosting, or protocol-byte decision.
7. Walk one valid occasional-envelope scenario and one existing-tool scenario.
8. Review the complete diff and repository file list to confirm only the five
   allowed documentation files were added or changed.

### Decisions this task must not make

- cryptographic construction;
- sender-authentication model;
- custom or existing envelope format;
- serialization or schema;
- fingerprint representation, alphabet, or length;
- QR-first or spoken/manual-first verification;
- key persistence, recovery, or passphrase design;
- browser framework, PWA design, hosting, or deployment; or
- protocol version 1 fields or bytes.

### Conditions for archival rather than expansion

Archive CipherBook if no representative user has a concrete occasional-envelope
problem; ordinary messaging becomes the primary use; users will not perform a
separate verification step; authentication limits remain misunderstood;
fingerprint experiments create false confidence; an existing tool already meets
the observed need; safe experimentation requires custom low-level cryptography;
or the likely maintenance burden exceeds the narrow benefit.
