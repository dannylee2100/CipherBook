# ALPHA-0001: sodium browser alpha

- Status: accepted for Alpha 0 only
- Date: 2026-07-20
- Scope: `alpha/web/`
- Related issue: #9

## Context

Milestones 1 and 2A produced technical evidence for sodium and age browser
experiments. Milestone 2B produced a verification-study harness, but the human
pilot was deferred before recruitment. No participant observations or
Milestone 3 recommendation exist.

The maintainer chose to continue with a small hobby engineering alpha to learn
from a coherent single-construction implementation. This is not a conclusion
that sodium is preferable to age, that a custom CipherBook envelope is
justified, or that users understand the workflow.

## Provisional Alpha 0 choice

Alpha 0 will:

- reuse the existing `libsodium` relationship-envelope experiment;
- retain the existing unstable sodium contact and envelope encodings unchanged;
- use temporary, application-memory-only identities;
- display the complete 256-bit lowercase hexadecimal relationship diagnostic as
  the authoritative Alpha 0 comparison;
- display the first 96 bits as 16 symbols from the existing Matrix-derived
  experiment emoji table, with numbered positions and English labels;
- require explicit confirmation that the full hexadecimal value was compared
  through a separate trusted interaction before sealing; and
- remain local-only, unpublished, and undeployed.

These are reversible implementation constraints for one alpha. They are not a
protocol selection, stable-format commitment, compatibility promise, final
fingerprint choice, or project-wide recommendation. No Alpha 0 bytes are
protocol version 1.

## Security semantics

The sodium construction uses static `crypto_box` keys. Opening performs a check
against the expected counterparty public key from the recipient's perspective.
That authentication is recipient-local, deniable, and recipient-forgeable. The
recipient can create a transcript that their own client accepts under the other
party's public contact. It is not a signature and is not transferable proof of
sender authorship.

Either party's later static-private-key disclosure, combined with the other
party's public contact, can expose captured relationship envelopes. Alpha 0 has
no forward secrecy. It also provides no endpoint protection, metadata hiding,
recipient restraint, enforced deletion, or enforced expiration.

The emoji representation is public, is not a key or password, uses only part of
the full comparison value, and has not been tested with human participants. It
cannot authorize sealing by itself.

## Consequences

Alpha 0 gains a smaller user-facing surface by removing the age study control
and reusing reviewed sodium modules. It retains a custom unstable JSON envelope,
recipient-forgeable authentication, static-key compromise exposure, browser
memory limits, and uncertain verification usability.

The alpha may be discarded. Any move toward persistence, recovery, deployment,
a changed envelope, another authentication model, or a stable protocol requires
a new explicit decision and review. All nine final project decisions remain
unresolved in `docs/UNRESOLVED_DECISIONS.md`.
