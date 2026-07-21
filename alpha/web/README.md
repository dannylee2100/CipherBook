> [!WARNING]
> **CipherBook Alpha 1 is an experimental engineering preview. It has not been
> independently reviewed or human-validated. Do not use real secrets.**

# CipherBook Alpha 1 browser envelope utility

## Purpose and evidence status

Alpha 1 adds one manual identity-continuity experiment to the Alpha 0 browser
workflow: a person may explicitly download the active sodium identity as a
passphrase-encrypted local file and later restore the same public contact. It is
an envelope utility, not a chat interface, online account, production vault,
backup service, or released product.

The Milestone 2B human pilot was deferred before recruitment. No participants
were recruited, no observations were collected, and no usability evidence
supports the envelope, verification, passphrase, download, or restore flows.
Engineering continued by maintainer decision. The alpha may be redesigned or
discarded.

## Run locally

The repository tests Node 26.4.0. Other Node versions are not claimed.

```text
npm ci
npm run alpha:dev
```

Open `http://127.0.0.1:4175/`. This is local development tooling, not a hosting
or deployment design. Chromium and Firefox are the automated browser targets.
Safari, WebKit, mobile browsers, browser extensions, screen readers, and real
assistive technology have not been validated.

## Unchanged envelope behavior

Alpha 1 retains the Alpha 0 sodium `crypto_box` relationship construction and
the exact unstable `CBLAB-SODIUM-A` envelope and `CBLAB-SODIUM-CONTACT-A`
public-contact encodings. The encrypted identity-file work does not change
those bytes.

Opening remains a recipient-local expected-counterparty check. It is deniable
and recipient-forgeable, not a signature or transferable proof of authorship.
Later disclosure of either party's static private key, together with the other
party's public contact, can expose captured relationship envelopes. Restoring a
static identity can extend that exposure period. Alpha 1 has no forward
secrecy.

The full 256-bit lowercase hexadecimal relationship diagnostic remains the
Alpha interface's required comparison. The existing 16-emoji view still shows
only the first 96 bits as unvalidated convenience UX. Neither representation is
a secret, key, password, final fingerprint, or protocol-version-1 choice.

## Manual encrypted identity file

The active identity consists of private identity material and its public
contact. People use the public contact to address envelopes; it cannot decrypt
messages or restore the identity. Closing or reloading the page loses the
active identity unless an encrypted identity file was downloaded and remains
available with its passphrase.

The encrypted identity file is not a complete CipherBook backup. It restores
the local private identity and reconstructs the same local public contact. It
does not restore counterparty contacts, previous verification, trust decisions,
messages, message history, the passphrase, or account information.

After a successful restore, the counterparty does not need a new public contact
from the user solely because of that restore. The user must still paste the
counterparty's public contact locally, compare the full hexadecimal relationship
value through a separate trusted interaction, and explicitly confirm it before
sealing or opening. If the identity was not exported or cannot be restored, a
new identity has a new public contact that must be exchanged and verified.

After generating or restoring an identity, the page presents the encrypted-file
download directly after the public contact. The steps are to enter and confirm
a passphrase, explicitly download the file, and retain the file and passphrase
separately. Exporting creates a passphrase-encrypted file containing the private
material needed to restore the same public contact. The file does not contain
counterparty contacts, previous verification, aliases, trust decisions, message
plaintext or message history, the passphrase, or online account information. It
must not be shared as a public contact or published.

This is a conservative current-Alpha choice, not a demonstrated usability or
security result. A remembered contact may be stale, restoring old verification
could silently preserve an outdated trust decision, and a decrypted file would
reveal more relationship information if those fields were included. Contact
persistence, key changes, and revocation require a separate reviewed design.

Export requires an active identity, a matching passphrase and confirmation, and
an explicit acknowledgment of offline guessing and unrecoverable passphrase
loss. Restore requires one manually selected file and its passphrase. The page
does not remember either value, and it clears the relevant password and file
inputs after an attempted operation. All three passphrase controls request
`autocomplete="off"`, which is only a browser hint and not a guarantee that a
browser, extension, password manager, operating system, or crash data will not
retain or offer to fill a value.

The filename is always `cipherbook-alpha1-identity.cbidentity`, with media type
`application/octet-stream`. The browser chooses the actual download location.
CipherBook does not copy the file to the clipboard, send it to native sharing,
upload it, automatically re-import it, or delete downloaded copies.

The page records only a non-sensitive, in-memory indication that an encrypted
identity-file download was started for the active identity during the current
page session. This is not proof that the browser saved the file or that the
person retained it. CipherBook cannot inspect the browser's download location.
The indication uses no browser storage and resets on reload, replacement
generation, successful restoration, Clear, page exit, and persisted
back/forward-cache restoration.

### Unstable fixed binary layout

The Alpha 1 file is exactly 107 bytes. It is disposable experiment machinery,
not a stable, canonical, compatible, or version-1 format.

| Offset | Length | Field                                                                            | Cleartext | Authenticated                |
| -----: | -----: | -------------------------------------------------------------------------------- | --------- | ---------------------------- |
|      0 |     18 | ASCII magic `CBALPHA-IDENTITY-A`                                                 | Yes       | Yes, as AEAD additional data |
|     18 |      1 | Fixed KDF-profile identifier `1`                                                 | Yes       | Yes                          |
|     19 |     16 | Random Argon2id salt                                                             | Yes       | Yes                          |
|     35 |     24 | Random XChaCha20-Poly1305 nonce                                                  | Yes       | Yes                          |
|     59 |     48 | Ciphertext: encrypted 32-byte `crypto_box` secret key plus 16-byte authenticator | No        | AEAD ciphertext              |

There are no optional fields, lengths, timestamps, names, hints, labels, public
contacts, or arbitrary KDF parameters. The cleartext header identifies the file
as a CipherBook Alpha identity artifact, but it does not contain the public
contact.

Profile `1` has these literal Alpha-only semantics:

- algorithm ID `2` (`crypto_pwhash_ALG_ARGON2ID13`);
- operations limit `2`;
- memory limit `67,108,864` bytes;
- derived-key length `32` bytes; and
- salt length `16` bytes.

Runtime initialization compares the loaded sodium constants with every literal
value above. A mismatch fails closed before any identity-file derivation or
decryption; it does not reinterpret profile `1`, substitute dependency defaults,
add another profile, or fall back. Supporting a changed dependency or migrating
files would require a separate reviewed decision. This Alpha format promises no
migration path or future compatibility.

Every export uses a fresh random salt and 24-byte nonce. Combined-mode
`crypto_aead_xchacha20poly1305_ietf_encrypt` authenticates the complete 59-byte
header. Import rejects the wrong magic, exact length, or unknown profile before
password-based key derivation. It never guesses a format, accepts trailing
data, uses file-supplied KDF cost, or falls back to weaker parameters.

The encrypted plaintext contains only the 32-byte private key. After successful
authentication, import reconstructs the public key with libsodium's
`crypto_scalarmult_base`, exports it through the unchanged contact encoder, and
builds a complete candidate. A failed import leaves the current identity,
contact, verification, and synthetic content intact. A successful import then
disposes the old identity on a best-effort basis and clears all counterparty,
verification, draft, ciphertext, and opened-plaintext state—even if the public
contact is unchanged. Successful identity restoration is not successful
counterparty verification.

### Passphrase behavior

Export accepts the passphrase as an exact JavaScript Unicode string encoded to
UTF-8. It does not trim, case-fold, or normalize. Leading and trailing spaces,
case, and Unicode form are significant. Export requires at least 12 Unicode
code points and at most 1,024 UTF-8 bytes; this minimum does not make a weak
passphrase strong. Anyone who obtains the file can attempt guesses offline.
There is no password reset, hint, recovery email, security question, or
remember-passphrase option.

Temporary passphrase bytes, derived keys, and private-key work buffers are
overwritten with libsodium's memory-zero helper in `finally` paths where the
JavaScript API exposes them. This is best-effort cleanup, not guaranteed memory
erasure. JavaScript engines, WebAssembly, browsers, extensions, operating
systems, swap, crash data, screens, downloads, and backups may retain copies.

## Local dependency and browser evidence

The required `crypto_pwhash` API was absent from the previous standard wrapper.
Alpha 1 replaces it with the official `libsodium-wrappers-sumo` 0.8.4 package
from `jedisct1/libsodium.js`, locked with registry integrity metadata and bundled
locally. No CDN or remote runtime script is used. This is one libsodium
implementation, not an additional cryptographic system.

In the 2026-07-20 local run, the fixed 64 MiB profile allocated successfully in
Chromium 149.0.7827.55 and Firefox 151.0. The observed single-operation timings
were approximately 155.21 ms export / 110.37 ms import in Chromium and 960.35
ms / 850.15 ms in Firefox. These measurements include browser workflow overhead
and are observations, not timing guarantees or thresholds.

The pre-change Alpha JavaScript bundle was 454.09 kB raw / 161.03 kB gzip. The
current build is approximately 565.98 kB / 200.32 kB, an increase of 111.89 kB
raw / 39.29 kB gzip. The size increase is a maintenance and delivery cost; it is
not evidence of product value.

## Storage and clear behavior

Alpha 1 still uses no local storage, session storage, IndexedDB, cookies, Cache
Storage, File System Access API persistence, service worker, or URL state.
Reload starts with no active identity. Continuity occurs only when a person
manually downloads a file and manually selects it later.

Clear overwrites the active private-key array on a best-effort basis and drops
page-controlled references, passphrase inputs, and the selected file. It cannot
delete downloaded files, browser download history, clipboard-manager data,
operating-system backups, crash records, or memory copies. Page exit performs
the same state reset and renders the empty state before the document may enter
the browser back/forward cache. A persisted page restoration resets and renders
again defensively; it never restores an encrypted identity automatically or
preserves relationship verification. These lifecycle operations clear the
page-controlled DOM but do not guarantee erasure from JavaScript, WebAssembly,
browser, extension, operating-system, swap, or crash memory.

## Explicit exclusions

Alpha 1 excludes age as a user-facing mode, multiple identities, multiple
contacts, contact persistence, automatic key storage, a persistent vault,
password recovery, managed backup, cloud sync, hardware-backed keys, rotation,
revocation, contact aliases, trust-state persistence, chat, history, groups,
attachments, QR camera flows, PWA
installation, service workers, telemetry, remote runtime assets, deployment,
GitHub Pages, a stable identity-file or envelope format, protocol version 1,
production claims, independent-review claims, and human-validation claims.

See [KNOWN_LIMITATIONS.md](KNOWN_LIMITATIONS.md),
[`ALPHA-0001`](../../docs/decisions/ALPHA-0001-sodium-browser-alpha.md),
[`ALPHA-0002`](../../docs/decisions/ALPHA-0002-encrypted-identity-file.md), and
[`ALPHA-0003`](../../docs/decisions/ALPHA-0003-identity-only-restore.md).
