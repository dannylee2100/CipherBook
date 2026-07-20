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
were reached. The maintainer chose to continue with **CipherBook Alpha 0** as a
hobby engineering exercise, not because the validation gates passed. The
project may still be redesigned or archived.

Alpha 0 is a locally run, sodium-only, memory-only browser envelope utility. It
reuses reviewed experimental components and unstable encodings, displays a full
hexadecimal relationship comparison, and offers an unvalidated 16-emoji
convenience view. Its interface requires each party to confirm the full
hexadecimal comparison before sealing or opening; importing a contact alone is
not verification, and the emoji view cannot authorize either action. That
confirmation is unvalidated and does not create a signature or transferable
proof of authorship. See [Alpha 0](alpha/web/README.md) and its
[known limitations](alpha/web/KNOWN_LIMITATIONS.md). No Alpha 0 behavior is
protocol version 1.

## What is fact, assumed, hypothesized, and decided

### Facts

- The repository contains a project charter, disposable research laboratories,
  and a provisional Alpha 0 engineering preview. None is appropriate for real
  secrets.
- Common message transports can observe, retain, reorder, alter, or replace text
  sent through them.
- Existing tools already cover substantial parts of the proposed use case.
- No cryptographic construction, serialization, fingerprint design, storage
  design, hosting provider, or protocol bytes have been approved.
- The deferred human pilot produced no participant evidence. Alpha 0 choices
  are maintainer-selected implementation constraints, not validation results.

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

## Example fit

Potentially valid scenario, if later evidence supports the concept: Alice and
Bob have already verified each other during an in-person meeting. Months later,
Alice needs to place one short confidential note into a ticketing system that
both already use. An envelope utility could let Bob detect tampering and recover
the note without turning the utility into a conversation service. The current
repository cannot perform this scenario.

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

The maintainer has paused that sequence and authorized Alpha 0 separately. The
alpha does not replace missing human evidence or settle the historical decision
log.

See the complete [Lean Validation Plan](docs/LEAN_VALIDATION_PLAN.md),
[Threat Model](docs/THREAT_MODEL.md), and
[Limitations](docs/LIMITATIONS.md).

## License

The repository is licensed under the Apache License 2.0. The license does not
change the experimental status or make the prototype appropriate for sensitive
data.
