# Contributing to CipherBook

CipherBook is an experimental verified-contact envelope project maintained by
one person. Small, reviewable changes with explicit evidence are more useful
than broad feature additions.

## Before changing code

- Use only generated identities and synthetic payloads.
- Read `AGENTS.md`, the threat model, limitations, unresolved decisions, and
  the decision record controlling the area.
- Open an issue before proposing a cryptographic composition, protocol byte,
  serialization profile, identity format, dependency, persistence mechanism,
  or hosted-runtime change.
- Do not present an experiment as protocol v1, compatible, independently
  reviewed, or appropriate for real secrets.
- Report suspected vulnerabilities privately as described in `SECURITY.md`.

## Local checks

The repository currently tests Node 26.4.0.

```sh
npm ci
npm run check
npm run test:v1-construction:browser
npm run test:alpha:unit
npm run test:alpha:chromium
npm run test:alpha:firefox
```

Changes to the hosted preview must also pass a Pages-path build:

```sh
CIPHERBOOK_BASE_PATH=/CipherBook/ \
CIPHERBOOK_BUILD_LABEL=development-preview \
CIPHERBOOK_BUILD_COMMIT=local-review \
npm run alpha:build

CIPHERBOOK_BASE_PATH=/CipherBook/ \
CIPHERBOOK_BUILD_COMMIT=local-review \
npm run check:alpha-build
```

## Pull requests

- Work on a feature branch and submit a pull request; do not commit directly to
  `main`.
- State the decision record and milestone in scope.
- List security consequences, tests run, exclusions, and unresolved risks.
- Keep generated build output, test identities, identity files, passphrases,
  credentials, and participant data out of commits.
- Add no dependency without explaining why the existing dependency set cannot
  provide the required experimental evidence.

Contributions are licensed under the repository's Apache License 2.0.
