# V1-0007: Hosted development preview

- Status: accepted under the maintainer's procedural override
- Date: 2026-07-24
- Initial URL: `https://dannylee2100.github.io/CipherBook/`
- Scope: GitHub Pages preview of the existing browser utility

> [!WARNING]
> This decision authorizes a public development preview, not protocol v1 or a
> claim that CipherBook is appropriate for real secrets.

## Facts

- The published browser utility still uses the existing unstable Alpha-era
  contact, relationship, envelope, and encrypted identity-file bytes.
- The representative human pilot was not run.
- The implementation has not received independent security review.
- GitHub Pages is operated by GitHub and can observe normal hosting metadata,
  including IP addresses and access times.
- The browser utility includes no application telemetry, remote runtime
  scripts, remote fonts, service worker, or automatic persistent storage.

## Decision

The repository may publish the existing browser utility as **CipherBook
development preview** through GitHub Pages, subject to all of these controls:

1. Deploy only a commit on `main` through the checked-in GitHub Actions
   workflow.
2. Require approval in the `github-pages` environment before deployment.
3. Pin every deployment action to a full commit SHA and record its release in
   the workflow.
4. Build with the repository base path `/CipherBook/`.
5. Display the build label and exact source commit in the artifact.
6. Keep the no-real-secrets, missing-independent-review, and
   missing-representative-testing warnings visible on first load.
7. State in the interface that current formats are unstable, experimental, and
   not protocol v1.
8. Bundle runtime code and styles locally and reject unexpected runtime network
   requests in automated browser tests.
9. Publish no service worker or installable-PWA manifest.

## Non-decisions

This record does not:

- approve protocol v1 bytes, compatibility, or a `v1.0.0` release;
- convert the existing construction to the accepted sealed-box-plus-signature
  direction;
- approve the existing identity-file bytes as the v1 vault;
- establish representative usability evidence or independent review;
- claim forward secrecy, anonymity, metadata hiding, endpoint protection,
  enforced deletion, enforced expiration, recipient restraint, or censorship
  resistance; or
- approve a custom domain, donation provider, or payment integration.

## Update and rollback

Merges to `main` produce a new artifact but still pass through the protected
`github-pages` environment. A rollback uses the same workflow against a reviewed
revert or previously reviewed commit; Pages settings are not a substitute for
source review. The deployed page must be checked after each publication for the
expected source commit, first-load warning, repository-path assets, absence of
cross-origin runtime requests, and a complete synthetic two-party workflow.

## Reopening conditions

Revisit this decision before:

- calling the deployment protocol v1;
- adding a service worker, installability, custom domain, remote runtime
  resource, telemetry, or third-party donation script;
- changing the hosting provider or source branch;
- removing the manual environment approval; or
- making any suitability claim for real sensitive information.
