# ALPHA-0003: Restore identity only

- Status: accepted for the current Alpha
- Date: 2026-07-21
- Scope: Alpha identity-file restore behavior
- Related issue: #15

## Decision

CipherBook Alpha identity files restore only the local cryptographic identity.

They do not store or restore counterparty contacts, relationship verification,
trust state, aliases, or messages.

After restoring an identity, the user must:

1. Import the counterparty's public contact again.
2. Compare the full hexadecimal relationship value through a separate trusted
   interaction.
3. Explicitly confirm that comparison before sealing or opening.

## Rationale

Remembering only the local identity:

- keeps the encrypted file narrowly scoped;
- reveals less relationship information if the file is decrypted;
- avoids silently trusting a stale counterparty contact;
- avoids treating an old verification decision as permanently valid;
- avoids prematurely creating a contact database; and
- keeps multiple-contact and trust-management design deferred.

## Consequences

The user must repeat counterparty contact import and verification after every
successful identity restore.

This creates friction, but that friction is intentional for the current Alpha.
It has not been shown to be secure or user-friendly through human observation.

The encrypted identity file is not a complete CipherBook backup. It restores the
local private identity and reconstructs the same local public contact; it does
not restore counterparty contacts, previous verification, trust decisions,
messages, message history, the passphrase, or account information.

A failed restore remains atomic and leaves the existing active session intact. A
successful restore deliberately replaces the local identity and clears all
relationship and message state.

## Not decided

This does not determine the final CipherBook design.

A future reviewed milestone could reconsider relationship persistence, but it
would require:

- a new explicit authorization;
- a new threat-model review;
- a new file format or separate encrypted artifact;
- migration and compatibility analysis;
- revocation and stale-contact behavior; and
- clear user-visible trust semantics.

All final project-level decisions remain unresolved.
