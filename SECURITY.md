# Security policy

> [!WARNING]
> CipherBook is an experimental, unreviewed development preview. Do not use real
> secrets, real private keys, real recovery files, or sensitive personal
> information when reproducing a problem.

## Supported versions

CipherBook has no supported production version or protocol v1. The current
GitHub Pages build is a development preview of unstable Alpha-era formats.
Security fixes may change or discard those formats without migration.

## Report a vulnerability

Use GitHub's
[private vulnerability reporting](https://github.com/dannylee2100/CipherBook/security/advisories/new)
for a suspected vulnerability. Do not open a public issue containing an
exploit, private key, passphrase, plaintext, identity file, credential, token,
or personal information.

Include:

- the affected source commit shown by the page;
- the browser, Node, or CLI version and operating system;
- minimal reproduction steps using generated identities and synthetic data;
- the observed result and expected boundary; and
- whether public discussion would increase risk.

This solo-maintained project has no bug-bounty program or guaranteed response
time. The maintainer will try to acknowledge a complete report within seven
days, assess impact against the documented threat model, and coordinate public
disclosure when practical. That target is not a service-level agreement.

## Security boundaries

Reports are welcome even when a finding falls outside the intended model, but
the current preview does not claim anonymity, metadata hiding, endpoint
protection, forward secrecy, enforced deletion, enforced expiration, recipient
restraint, censorship resistance, guaranteed memory erasure, independent
review, or suitability for real secrets.

See [the threat model](docs/THREAT_MODEL.md) and
[known limitations](docs/LIMITATIONS.md) before assessing severity.
