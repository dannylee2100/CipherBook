# Alpha 1 known limitations

> [!WARNING]
> Alpha 1 is not independently reviewed, human-validated, production-ready, or
> suitable for real secrets.

- The human pilot was deferred. No participant evidence shows that users
  compare the full value, understand recipient forgeability, choose usable
  passphrases, retain a downloaded file, or benefit from this workflow.
- The sodium relationship construction and existing contact/envelope encodings
  remain provisional. Those encodings are unchanged, unstable, and not protocol
  version 1.
- The 107-byte encrypted identity file is an Alpha-only disposable format. It
  is not stable, canonical, compatible, or a decision about future vault,
  migration, backup, or recovery design.
- Anyone who obtains an identity file can attempt passphrase guesses offline.
  Argon2id raises the cost of guessing but cannot make a weak passphrase strong.
- There is no password reset, hint, recovery service, or alternate unlock path.
  Losing the passphrase makes the file unusable. Losing both the active identity
  and usable file loses the identity.
- Exported copies are controlled by the browser, operating system, user, backup
  tools, and storage media—not CipherBook. Clear cannot locate or delete them.
- The session indicator reports only that a download action started. It cannot
  prove that the browser stored the file or that the person retained it, and it
  resets whenever the active identity or page-controlled state is replaced.
- The encrypted identity file is not a complete CipherBook backup. It restores
  the local private identity and reconstructs the same local public contact. It
  does not restore counterparty contacts, previous verification, trust
  decisions, aliases, message plaintext, message history, the passphrase, or
  online account information.
- After a successful restore, the user must paste the counterparty contact and
  compare and explicitly confirm the full hexadecimal relationship value again.
  The restored public contact is the one associated with that saved identity,
  so restoring that file alone does not require exchanging a new one. A failed
  or unavailable restore followed by new identity generation does produce a new
  public contact that must be exchanged and verified.
- Identity-only restore is a conservative current-Alpha choice, not a proven
  security or usability result. Persisting contacts could preserve stale or
  attacker-replaced relationship data, restoring prior confirmation could reuse
  an outdated trust decision, and including either would reveal more
  relationship information if the file were decrypted.
- The cleartext header identifies a CipherBook Alpha identity artifact. It does
  not contain the public contact, but it is still file-type metadata.
- Restoring a static identity can lengthen its lifetime. Later disclosure of
  either party's private key can expose retained relationship envelopes when
  the other public contact is available. Alpha 1 has no forward secrecy.
- A stolen file plus a successfully guessed passphrase yields the static
  private key and permits impersonation within the existing recipient-local,
  recipient-forgeable construction.
- Authentication is recipient-local, deniable, and recipient-forgeable. Opening
  is not a signature or third-party proof that the expected counterparty wrote
  the plaintext.
- Importing a public contact alone is not verification. Each person must confirm
  the full hexadecimal comparison independently. This self-reported step has
  not been validated and does not create transferable proof.
- The 16-emoji convenience view represents only the first 96 digest bits. It has
  not been tested for omission, skimming, rendering, accessibility, language,
  pronunciation, or transposition failures. It cannot authorize sealing or
  opening.
- Compromised endpoints, browsers, extensions, operating systems, keyboards,
  displays, clipboards, dependencies, or download paths can expose or change
  passphrases, private keys, files, and plaintext.
- Best-effort byte-array clearing does not guarantee erasure. JavaScript,
  WebAssembly, browsers, operating systems, crash data, swap, downloads, and
  backups may retain copies.
- Page exit and persisted back/forward-cache restoration reset and re-render
  page-controlled state. That removes visible values from the retained DOM but
  is not guaranteed memory erasure, and browser lifecycle behavior remains part
  of the trusted execution environment.
- Passphrase fields request `autocomplete="off"` and are cleared after attempts.
  The request cannot prevent a browser, extension, password manager, operating
  system, or crash data from retaining or offering to fill a passphrase.
- There is no automatic persistence. Reload begins empty, and continuity
  requires a manual file export followed by a later manual selection and
  passphrase entry.
- There is no managed backup, cloud sync, hardware-backed protection, multiple
  identity support, contact persistence, rotation, or revocation.
- Ciphertext does not hide participants, accounts, network identifiers, timing,
  frequency, approximate size, or transport retention.
- A recipient can copy, retain, disclose, alter, or republish opened plaintext.
- The alpha does not prevent replay, denial of service, transport suppression,
  account suspension, or censorship.
- Only automated Chromium and Firefox desktop workflows are in scope. Safari,
  WebKit, mobile browsers, extensions, screen readers, and real assistive
  technology remain untested.
- Local Vite execution and a bundled Pages artifact do not remove endpoint,
  browser, dependency, hosted-code replacement, or supply-chain risk. GitHub
  may observe ordinary hosting metadata, and HTTPS does not make the served code
  immutable or independently reviewed.
