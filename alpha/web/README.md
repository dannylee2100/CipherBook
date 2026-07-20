> [!WARNING]
> **CipherBook Alpha 0 is an experimental engineering preview. It has not been
> independently reviewed or human-validated. Do not use real secrets.**

# CipherBook Alpha 0 browser envelope utility

## Purpose

Alpha 0 turns the reviewed sodium experiment into one coherent, locally run
browser workflow for developers and curious testers. It supports one temporary
identity, one counterparty public contact, one text envelope at a time, explicit
copy/share actions, and complete application-state reset. It is an envelope
utility, not a chat interface or released product.

The Milestone 2B human pilot was deferred before recruitment. No participants
were recruited, no observations were collected, and no usability conclusion
supports this interface. Engineering continued by maintainer decision. The
alpha may be redesigned or discarded.

## Run locally

The repository tests Node 26.4.0. Other Node versions are not claimed.

```text
npm ci
npm run alpha:dev
```

Open `http://127.0.0.1:4175/`. This is local development tooling, not a hosting
or deployment design.

Build and validation commands are documented in the root `package.json` and the
Alpha 0 CI workflow. Chromium and Firefox are the only automated browser
targets. Safari, WebKit, mobile browsers, browser extensions, and assistive
technology have not been validated with users.

## Provisional sodium choice

Alpha 0 reuses the Milestone 1 `libsodium` `crypto_box` relationship-envelope
module and its exact unstable `CBLAB-SODIUM-A` envelope and
`CBLAB-SODIUM-CONTACT-A` public-contact encodings. It does not copy or alter the
cryptographic construction. This is an Alpha 0 implementation choice, not a
recommendation that sodium should become CipherBook's final construction or
that a custom envelope should exist.

Opening checks the expected counterparty public key from the recipient's local
perspective. This authentication is recipient-local, deniable, and
recipient-forgeable. The recipient can create a transcript that their own
client accepts under the other party's public contact. It is not a signature or
transferable proof of sender authorship.

Later disclosure of either party's static private key, together with the other
party's public contact, can expose captured relationship envelopes. Alpha 0 has
no forward secrecy.

## Contact exchange and comparison

Only the public contact can be displayed or copied. Private identity material
remains in application memory and has no display, copy, download, backup, or
recovery flow.

After importing one counterparty contact, both devices derive the same full
relationship digest from the same ordered pair of public contacts. Alpha 0
shows two public representations:

- **Authoritative Alpha 0 comparison:** all 256 bits as 64 lowercase
  hexadecimal digits, grouped for readability.
- **Experimental convenience view:** the first 96 bits as 16 numbered symbols
  from the existing Matrix-derived experiment emoji table, with visible English
  labels and assistive text.

The emoji display is public, not a key or password, and has not been tested with
human participants. It cannot authorize sealing. The user must explicitly
confirm comparison of the full hexadecimal value through a separate trusted
interaction.

Neither display is a final fingerprint format. The contact, envelope,
relationship digest, and emoji choices are not protocol version 1.

## Memory-only behavior

Alpha 0 intentionally uses no local storage, session storage, IndexedDB,
cookies, Cache Storage, file-system persistence, service worker, or URL state.
Reload starts with no identity or content. Clear drops application references
and overwrites the sodium private-key byte array on a best-effort basis.

JavaScript cannot guarantee memory erasure. Browsers, operating systems,
extensions, crash data, swap, screens, clipboards, or other applications may
retain copies. Reloading or closing the page loses the temporary identity and
makes envelopes addressed to it unreadable; there is no recovery mechanism.

## Explicit exclusions

Alpha 0 excludes age as a user-facing mode, multiple contacts, chat, message
history, attachments, groups, persistent identities, passphrases, vaults,
recovery, QR camera flows, PWA installation, service workers, telemetry, remote
runtime assets, deployment, GitHub Pages, a stable protocol, production claims,
and usability claims.

See [KNOWN_LIMITATIONS.md](KNOWN_LIMITATIONS.md) and
[`ALPHA-0001`](../../docs/decisions/ALPHA-0001-sodium-browser-alpha.md).
