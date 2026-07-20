# Alpha 0 known limitations

> [!WARNING]
> Alpha 0 is not independently reviewed, human-validated, production-ready, or
> suitable for real secrets.

- The human pilot was deferred. No participant evidence shows that users
  compare the full value, understand recipient forgeability, or benefit from
  this workflow.
- The sodium choice and existing contact/envelope encodings are provisional.
  The encodings are unstable and are not protocol version 1.
- Authentication is recipient-local, deniable, and recipient-forgeable. Opening
  is not a signature or third-party proof that the expected counterparty wrote
  the plaintext.
- Importing a public contact alone is not verification. The interface requires
  each person to confirm the full hexadecimal comparison independently before
  sealing or opening, and removing confirmation clears trust-dependent output.
  This self-reported confirmation has not been validated and does not create a
  signature or transferable proof.
- Static identities provide no forward secrecy. Later disclosure of either
  party's private key can expose captured relationship envelopes when the other
  public contact is available.
- The 16-emoji convenience view represents only the first 96 digest bits. It has
  not been tested for omission, skimming, rendering, accessibility, language,
  pronunciation, or transposition failures. Full hexadecimal comparison is
  required by the alpha but is also not human-validated. The emoji view cannot
  authorize sealing or opening.
- Compromised endpoints, browsers, extensions, operating systems, keyboards,
  displays, clipboards, or dependencies can expose or change private keys and
  plaintext.
- Memory-only state does not guarantee erasure. Clear and reload drop references
  controlled by the page, but other layers may retain copies.
- Reloading or closing loses the temporary identity permanently. There is no
  persistence, backup, recovery, migration, rotation, or revocation.
- Ciphertext does not hide participants, accounts, network identifiers, timing,
  frequency, approximate message size, or transport retention.
- A recipient can copy, retain, disclose, alter, or republish opened plaintext.
- The alpha does not prevent replay, denial of service, transport suppression,
  account suspension, or censorship.
- Only automated Chromium and Firefox desktop workflows are in scope. Safari,
  WebKit, mobile browsers, extensions, screen readers, and real assistive
  technology remain untested.
- Local Vite execution does not remove endpoint, browser, dependency, or supply-
  chain risk. The alpha is not deployed and has no hosted-update model.
