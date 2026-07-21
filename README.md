> [!WARNING]
> **CipherBook is an experimental research prototype. Do not use it for real secrets.**

# CipherBook

CipherBook is a hypothesis about whether a verified-contact, encrypted-envelope
workflow is useful and understandable. It now also contains an explicitly
provisional engineering alpha for developers and curious testers. It is not an
approved protocol, a production-ready application, or a secure product.

The proposed workflow is deliberately narrow: two people exchange public
contacts, verify the relationship through a separate trusted interaction, and
occasionally move one encrypted text payload through an untrusted text channel.
The immediate work is to test whether that workflow deserves a project at all.

## Current status

Milestone 0 is complete. Milestone 1 now contains a disposable command-line
laboratory that compares two construction candidates using synthetic data. It
is evidence-gathering code, not an application or production CLI. Milestone 2A
contains a locally run, memory-only browser workflow experiment for the same two
construction study controls. It is experimental evidence, not a released
browser client, selected construction, stable envelope, or protocol version,
and it uses only synthetic data. See the
[Milestone 1 laboratory](experiments/milestone-1/README.md) and its
[recorded results](experiments/milestone-1/RESULTS.md), plus the
[Milestone 2A laboratory](experiments/milestone-2a/README.md). The
[Milestone 2B verification study harness](experiments/milestone-2b/README.md)
now contains local synthetic tasks and an unexecuted human-study protocol. It
has technical test evidence only; no human study has been run and no
verification method or length has been selected.

The Milestone 2B human pilot was deferred before recruitment. No participants
were recruited, no observations were collected, and no usability conclusions
were reached. The maintainer chose to continue with **CipherBook Alpha 0**, and
then the narrow **Alpha 1 encrypted identity-file continuity experiment**, as
hobby engineering work—not because the validation gates passed. The project may
still be redesigned or archived.

Alpha 1 is a locally run, sodium-only browser envelope utility. It retains the
Alpha 0 contact, verification, seal, and open behavior and adds an optional
manual download/restore path for one passphrase-encrypted identity file. It
does not automatically persist state. The encrypted identity file is not a
complete CipherBook backup. It restores only the local private identity and the
same local public contact. It does not restore counterparty contacts, previous
verification, trust decisions, messages, message history, the passphrase, or
account information. After a successful restore, the user must paste the
counterparty contact again, compare the full hexadecimal relationship value,
and explicitly confirm it before sealing or opening. If the identity was not
exported or cannot be restored, a new identity has a new public contact that
must be exchanged and verified.

This identity-only restore behavior is a conservative current-Alpha choice. It
avoids silently reusing a stale contact or outdated verification decision and
limits the relationship information exposed if a file is decrypted. It has not
been shown to be secure or user-friendly through human observation. The page
reports only that a download was started during the current session; it cannot
verify where the browser stored the file or whether the person retained it.
That session-only status resets with the identity or page state.

The fixed binary file is disposable Alpha machinery, not a stable vault,
backup, recovery design, envelope format, or protocol version. Anyone holding
the file can attempt passphrase guesses offline, and there is no password
reset. Page exit and back/forward-cache restoration clear and re-render
page-controlled state, but this does not guarantee memory erasure. Passphrase
fields request `autocomplete="off"`; that does not prevent browsers,
extensions, or password managers from retaining or offering to fill values.
Profile `1` has literal Alpha-only numeric semantics, and dependency-constant
drift stops initialization instead of reinterpreting existing files. No
migration or future compatibility is promised. See
[Alpha 1](alpha/web/README.md), its
[known limitations](alpha/web/KNOWN_LIMITATIONS.md), and the provisional
[Alpha 1 file decision](docs/decisions/ALPHA-0002-encrypted-identity-file.md)
and [identity-only restore decision](docs/decisions/ALPHA-0003-identity-only-restore.md).

## What is fact, assumed, hypothesized, and decided

### Facts

- The repository contains a project charter, disposable research laboratories,
  and a provisional Alpha 1 engineering preview. None is appropriate for real
  secrets.
- Common message transports can observe, retain, reorder, alter, or replace text
  sent through them.
- Existing tools already cover substantial parts of the proposed use case.
- No final project cryptographic construction, serialization, fingerprint
  design, storage design, hosting provider, or protocol bytes have been
  approved. Alpha-only engineering choices do not resolve them.
- The deferred human pilot produced no participant evidence. Alpha 0 and Alpha
  1 choices are maintainer-selected implementation constraints, not validation
  results.

### Assumptions to test

- Some people need to send sensitive text only occasionally and do not want to
  establish another conversation channel.
- Those people can perform a separate trusted verification step with the
  intended recipient.
- Copying an envelope through an existing transport may be less burdensome than
  changing tools.

### Hypotheses

- Users can understand the distinction between contact verification, payload
  confidentiality, sender authentication, and transport metadata.
- A verified-contact envelope flow provides enough benefit over existing tools
  to justify its verification overhead.
- A maintained high-level construction can support a small browser and Node
  experiment without creating a large custom protocol surface.

### Decisions approved so far

- Run only the four-stage lean validation plan.
- Use no real secrets during the experiments.
- Treat all spike keys, encodings, fingerprints, and envelopes as disposable.
- Keep the decisions in
  [Unresolved Decisions](docs/UNRESOLVED_DECISIONS.md) open until comparative
  evidence exists.
- Defer the human pilot without treating it as completed.
- Build the narrowly scoped Alpha 0 using provisional choices recorded in
  [ALPHA-0001](docs/decisions/ALPHA-0001-sodium-browser-alpha.md).
- Add manual passphrase-encrypted identity-file continuity for Alpha 1 only,
  under [ALPHA-0002](docs/decisions/ALPHA-0002-encrypted-identity-file.md),
  without resolving persistent vault, recovery, envelope, or protocol design.
- Restore only the local identity in the current Alpha under
  [ALPHA-0003](docs/decisions/ALPHA-0003-identity-only-restore.md), requiring
  manual counterparty re-import and full hexadecimal reverification without
  resolving the final contact, trust, persistence, or recovery design.

## Example fit

Potentially valid scenario, if later evidence supports the concept: Alice and
Bob have already verified each other during an in-person meeting. Months later,
Alice needs to place one short confidential note into a ticketing system that
both already use. An envelope utility could let Bob detect tampering and recover
the note without turning the utility into a conversation service. The Alpha can
exercise only a synthetic local approximation of this scenario; it is not
appropriate for the real note.

Poor-fit scenarios:

- For ongoing private conversation, use Signal or another established
  end-to-end encrypted messenger.
- To encrypt a file for an age recipient, use age rather than a new envelope
  format.
- To share and rotate team credentials, use a password manager with managed
  sharing and access revocation.

CipherBook is also a poor fit when users cannot verify contacts separately,
need metadata protection, expect deletion or expiration to be enforced, or
operate on a compromised endpoint.

## Validation path

The approved plan has four milestones:

0. Publish the charter, threat model, limitations, unresolved-decision log, and
   experimental warning. No application code.
1. Compare disposable libsodium and age/Typage command-line spikes through one
   minimal test harness.
2. Observe the workflow in memory-only browser experiments, including the
   separately approved verification-method study protocol.
3. Evaluate the construction evidence and user observations, then continue,
   narrow the idea, or archive the project. This evaluation has not occurred.

The maintainer has paused that sequence and authorized Alpha 0 and the narrow
Alpha 1 identity-file experiment separately. The alpha does not replace missing
human evidence or settle the historical decision log.

See the complete [Lean Validation Plan](docs/LEAN_VALIDATION_PLAN.md),
[Threat Model](docs/THREAT_MODEL.md), and
[Limitations](docs/LIMITATIONS.md).

## License

The repository is licensed under the Apache License 2.0. The license does not
change the experimental status or make the prototype appropriate for sensitive
data.
