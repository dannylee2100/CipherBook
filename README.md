> [!WARNING]
> **CipherBook is an experimental research prototype. Do not use it for real secrets.**

# CipherBook

CipherBook is a hypothesis about whether a verified-contact, encrypted-envelope
workflow is useful and understandable. It is not an approved protocol, a
production-ready application, or a secure product.

The proposed workflow is deliberately narrow: two people exchange public
contacts, verify the relationship through a separate trusted interaction, and
occasionally move one encrypted text payload through an untrusted text channel.
The immediate work is to test whether that workflow deserves a project at all.

## Current status

Milestone 0 is complete. Milestone 1 now contains a disposable command-line
laboratory that compares two construction candidates using synthetic data. It
is evidence-gathering code, not an application or production CLI. There is no
stable envelope, selected cryptographic construction, or protocol version. A
draft Milestone 2A branch contains a locally run, memory-only browser workflow
experiment for the same two study controls; it is not a released browser client
and uses only synthetic data. See the
[Milestone 1 laboratory](experiments/milestone-1/README.md) and its
[recorded results](experiments/milestone-1/RESULTS.md), plus the
[Milestone 2A laboratory](experiments/milestone-2a/README.md).

The project may be archived after the evaluation milestone. Continuing is not
the default outcome; it requires evidence that the workflow solves a real
problem better than existing tools without misleading users about its limits.

## What is fact, assumed, hypothesized, and decided

### Facts

- The repository contains a project charter and a disposable construction
  laboratory, not a usable encryption tool.
- Common message transports can observe, retain, reorder, alter, or replace text
  sent through them.
- Existing tools already cover substantial parts of the proposed use case.
- No cryptographic construction, serialization, fingerprint design, storage
  design, hosting provider, or protocol bytes have been approved.

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
2. Observe the workflow in a memory-only browser UX spike.
3. Evaluate the construction evidence and user observations, then continue,
   narrow the idea, or archive the project.

See the complete [Lean Validation Plan](docs/LEAN_VALIDATION_PLAN.md),
[Threat Model](docs/THREAT_MODEL.md), and
[Limitations](docs/LIMITATIONS.md).

## License

The repository is licensed under the Apache License 2.0. The license does not
change the experimental status or make the prototype appropriate for sensitive
data.
