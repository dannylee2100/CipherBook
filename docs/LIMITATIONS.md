# Limitations

> [!WARNING]
> CipherBook is experimental research and hobby engineering. Do not use it for
> real secrets. Alpha 0 is an engineering preview, not a production security
> application.

## Evidence categories

### Facts

- Milestone 0 is complete, Milestone 1 contains a disposable Node laboratory,
  Milestone 2A contains a disposable browser workflow laboratory, and Milestone
  2B contains a local synthetic verification-study harness. No Milestone 2B
  human study has been run; the pilot was deferred before recruitment.
- Alpha 0 provisionally uses the sodium experiment, its unstable encodings, a
  full hexadecimal comparison, and a 16-emoji convenience view. Those choices
  do not select a final construction, envelope, serialization, fingerprint,
  persistence model, deployment, or protocol bytes.
- The project has not undergone independent security review.
- Milestones 1 and 2A use disposable keys and synthetic payloads; any later
  approved spike must retain those experimental boundaries.

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

- The repository contains disposable Milestone laboratories and a sodium-only
  Alpha 0 browser preview. The alpha is intended only for local developer and
  curious-tester evaluation with synthetic text.
- The laboratories can generate temporary test identities and exercise contact,
  relationship-diagnostic, seal, and open operations using synthetic data only.
  The browser laboratory does not intentionally persist state, and it does not
  provide a workflow appropriate for real contacts or messages. The study
  harness accepts synthetic comparison values only and has no identity, contact,
  or message workflow.
- There is no stable, canonical, compatible, or version-1 encoding.
- Alpha 0 has no human-validation evidence. Its emoji convenience view has not
  been tested with participants and represents only the first 96 digest bits.
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

The maintainer chose to build Alpha 0 without completing the planned human
validation. That is an engineering decision, not positive validation evidence.
Any expansion beyond the alpha still requires a separate reviewed plan; the
project may instead be redesigned or archived.
