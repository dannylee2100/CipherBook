# ALPHA-0002: Manual encrypted identity-file continuity

- Status: accepted for Alpha 1 only
- Date: 2026-07-20
- Scope: provisional Alpha browser engineering preview

## Context

Alpha 0 intentionally kept a sodium identity only in page memory. The
maintainer has authorized one narrower experiment: determine whether a user can
explicitly export that identity as a passphrase-encrypted local file and restore
the same public contact after a reload. This is continuity testing, not approval
of a production vault or a final recovery model.

Alpha 0 remains historical context. Its contact and envelope encodings, static
identity construction, relationship diagnostic, recipient-local authentication
semantics, and other limitations remain unchanged.

## Alpha 1 decision

Alpha 1 may add manual export and import of one encrypted identity file. The
file is a fixed-size, disposable binary artifact with:

- the exact ASCII magic `CBALPHA-IDENTITY-A`;
- one fixed profile byte;
- a random 16-byte Argon2id salt;
- a random 24-byte XChaCha20-Poly1305 nonce; and
- 48 bytes of authenticated ciphertext containing only one 32-byte sodium
  `crypto_box` secret key and the 16-byte authenticator.

The 59-byte cleartext header—magic, profile, salt, and nonce—is authenticated as
additional data. The fixed profile byte maps locally to
`crypto_pwhash_ALG_ARGON2ID13`,
`crypto_pwhash_OPSLIMIT_INTERACTIVE` (2 operations), and
`crypto_pwhash_MEMLIMIT_INTERACTIVE` (67,108,864 bytes). The derived key is 32
bytes, as required by XChaCha20-Poly1305. No numeric KDF parameters are accepted
from a file.

The encrypted plaintext contains no public key. After authenticated decryption,
Alpha 1 reconstructs the public key with libsodium's official
`crypto_scalarmult_base` operation and exports the public contact through the
unchanged Alpha contact encoder. Unknown magic, profile values, lengths, or
trailing data are rejected before password-based key derivation.

This decision is deliberately local to Alpha 1. The file format is unstable and
disposable. The alpha may be redesigned or discarded.

## Consequences and principal risks

- Anyone who obtains the file can perform offline passphrase guesses.
- Argon2id increases guessing cost but cannot make a weak passphrase strong.
- Loss of the passphrase makes the file unusable; there is no password reset.
- Loss of both the active identity and encrypted file loses the identity.
- Exported copies remain outside CipherBook's control.
- Browsers, extensions, operating systems, downloads, crash data, swap, and
  backups may retain passphrases, keys, or file copies despite best-effort
  buffer clearing.
- Restoring a static identity extends the period during which later key
  compromise can expose captured relationship envelopes. Alpha 1 still has no
  forward secrecy.
- A stolen and successfully decrypted identity file permits impersonation
  within the construction's existing recipient-local, recipient-forgeable
  semantics.
- The cleartext header identifies a CipherBook Alpha identity artifact. The
  public contact is not present in cleartext.

## Decisions not made

This Alpha-only authorization does not:

- resolve persistent vault or recovery design;
- resolve protocol-version-1 bytes;
- stabilize the existing contact or envelope formats;
- establish that passphrase files are the final identity model;
- select libsodium over age/Typage for a future envelope construction;
- select recipient-local authentication over transferable signatures;
- select a custom envelope over an existing interoperable format;
- select a fingerprint representation or length;
- select QR-first over spoken or manual verification;
- select a serialization format; or
- select hosting or deployment.

All nine project-level decisions recorded in
`docs/UNRESOLVED_DECISIONS.md` remain unresolved.
