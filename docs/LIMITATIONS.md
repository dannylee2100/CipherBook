# Limitations

> [!WARNING]
> CipherBook is an experimental research prototype. Do not use it for real
> secrets. This repository currently contains no encryption application.

## Evidence categories

### Facts

- Milestone 0 is documentation only.
- No cryptographic construction, envelope, serialization, fingerprint,
  persistence model, deployment, or protocol bytes have been selected.
- The project has not undergone independent security review.
- Any later spikes are intended to use disposable keys and synthetic payloads.

### Assumptions to test

- Users have an occasional-envelope need that existing tools do not serve well.
- Users can complete a separate trusted contact-verification interaction.
- A browser and Node experiment can be run without users mistaking it for a
  finished product.

### Hypotheses

- The workflow may provide a useful boundary between occasional envelopes and
  ongoing messaging.
- Comparative prototypes may reveal whether an existing interoperable format is
  enough, avoiding a new wire format.

### Decisions approved so far

- Make no positive security or production claim during validation.
- Use no real secrets in the experiments.
- Keep all outputs disposable and explicitly unstable.
- Archive the project if the evaluation does not meet the continuation criteria
  in the lean validation plan.

## Claims explicitly rejected

| Rejected claim | Actual limitation |
| --- | --- |
| Production readiness | There is no production implementation. Passing a research spike would not establish operational readiness. |
| Independent review | No independent review has occurred. Maintainer self-review and tests are not substitutes for external cryptographic and product review. |
| Anonymity | The concept does not make participants anonymous. Accounts, networks, devices, and transports can identify them. |
| Metadata hiding | An envelope does not hide sender, recipient, timing, frequency, message length, IP data, account data, or transport retention. |
| Enforced deletion | A sender cannot make delivered ciphertext, plaintext, screenshots, copies, or backups disappear. |
| Enforced expiration | A timestamp or interface timer cannot force a recipient or modified open-source client to stop opening retained data. |
| Forward secrecy | Static-key experiments must not claim forward secrecy. Later compromise may affect recorded envelopes; the exact consequences must be measured per spike. |
| Endpoint protection | CipherBook cannot protect plaintext or keys from a compromised browser, extension, operating system, device, keyboard, clipboard, or display path. |
| Recipient restraint | An intended recipient can copy, retain, publish, or alter plaintext. Some authentication models may also let the recipient create convincing sender-attributed envelopes. |
| Censorship resistance | Existing transports and hosts can block, remove, throttle, flag, or refuse envelope text or the prototype itself. |

The project also rejects claims that it is untraceable, self-destructing,
independently audited, or appropriate for evading employer monitoring.

## Current functional limitations

- There is no executable tool.
- There is no key generation, contact exchange, fingerprint comparison, seal,
  or open operation.
- There is no stable, canonical, compatible, or version-1 encoding.
- There is no persistent vault, recovery flow, device migration, or revocation
  mechanism.
- There is no installable PWA, service worker, deployment, or verified offline
  behavior.
- There is no delivery, notification, conversation history, group, attachment,
  or account feature.

## Limits that experiments cannot remove

Even a successful usability study and technically correct spike would leave
important limits:

- Human verification can be skipped or performed incorrectly.
- A trusted verification channel can itself be impersonated or compromised.
- Browser memory is not a protected enclave and cannot guarantee prompt erasure.
- Clipboard contents can be retained by operating systems, applications, or
  clipboard managers.
- Unicode symbols can render differently or be inaccessible.
- Dependency review cannot prove that a supply chain will remain trustworthy.
- Open-source recipients can modify client behavior, ignore warnings, and retain
  data.
- Static identity designs may expose old messages after later key compromise;
  the spikes exist partly to document that behavior.

## Appropriate interpretation of results

Milestone results can support narrow statements such as "all specified tamper
tests failed closed in these environments" or "five of six study participants
completed this comparison task." They cannot establish a broad claim that the
project is secure, fit for sensitive data, or safe under conditions that were
not tested.

If validation is positive, a separate reviewed plan is required before any
product work. If validation is negative or ambiguous, the expected outcome is
to archive the project rather than add features or documentation to compensate.
