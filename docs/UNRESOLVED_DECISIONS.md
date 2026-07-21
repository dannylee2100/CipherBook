# Unresolved Decisions

> [!IMPORTANT]
> Every item in this document is unresolved. Mentioning a candidate does not
> approve it. Experimental output must not be described as stable, canonical,
> compatible, or protocol version 1.

## Evidence categories

### Facts

- Disposable Milestone 1 Node and Milestone 2A browser comparisons exist, and a
  Milestone 2B synthetic verification-study harness exists. No Milestone 2B
  human observation or Milestone 3 decision has been completed.
- The human pilot was deferred before recruitment. The maintainer authorized a
  provisional sodium-only Alpha 0 engineering preview and then a narrow Alpha 1
  encrypted identity-file experiment without treating either as a Milestone 3
  result.
- The repository contains no approved protocol bytes or final application
  design.
- Existing tools may make a new envelope format unnecessary.
- Current Alpha identity files restore only the local private identity and same
  local public contact. They do not restore counterparty, verification, trust,
  alias, or message state. This Alpha constraint is not a final persistence or
  trust-model decision.

### Assumptions to test

- Both construction candidates can be exercised through one disposable harness.
- Representative users can compare verification methods without using real
  secrets.
- Compatibility, authentication semantics, user comprehension, and maintainer
  burden can be compared before any production architecture is proposed.

### Hypotheses

- One construction may provide a materially smaller and clearer implementation
  than the other.
- Transport context plus verified-contact UX may or may not make age's lack of
  native sender authentication acceptable for the narrow use case.
- A new wire format is justified only if observed needs cannot be met safely by
  an existing format and a thin interface.

### Decisions approved so far

- Keep all nine questions below open through Milestones 0, 1, and 2.
- Use Milestone 3 evidence to recommend, defer, narrow, or reject each choice.
- Do not resolve a choice merely because a candidate is popular or appeared in
  an earlier plan.
- Do not proceed to protocol design solely because both spikes can round-trip a
  payload.
- Keep the Alpha 0 and Alpha 1 implementation choices separate from final
  project decisions.

## Alpha 0 history and Alpha 1 provisional extension

For the Alpha 0 branch only, the maintainer chose to:

1. use the libsodium relationship-envelope experiment;
2. retain the existing unstable sodium contact and envelope encodings;
3. display the full 256-bit hexadecimal relationship diagnostic as the
   authoritative Alpha 0 comparison;
4. also display a 16-emoji, 96-bit convenience representation using the
   existing Matrix-derived experiment table;
5. label the emoji representation as unvalidated convenience UX;
6. use temporary memory-only identities;
7. provide no private-identity persistence or export; and
8. provide no deployment or stable-format claim.

These choices make one alpha executable. They do not recommend sodium over age,
approve recipient-local authentication, approve the experimental envelope,
select a final fingerprint, choose serialization, approve persistence or
hosting, or define protocol version 1. See
[`ALPHA-0001`](decisions/ALPHA-0001-sodium-browser-alpha.md).

For Alpha 1 only, the maintainer additionally authorized manual export and
import of one fixed-size, passphrase-encrypted local identity file. The file
uses a fixed Argon2id13 interactive profile and XChaCha20-Poly1305 to encrypt the
existing sodium private key; it is explicitly unstable and disposable. This
local experiment does not approve passphrase files as the final identity model,
select a persistent vault or recovery design, alter the contact or envelope
encodings, or define protocol version 1. See
[`ALPHA-0002`](decisions/ALPHA-0002-encrypted-identity-file.md).

For the current Alpha only, the maintainer additionally decided that restore is
identity-only. The encrypted identity file is not a complete CipherBook backup:
after restore, the user must import the counterparty contact and explicitly
confirm the full hexadecimal comparison again. This avoids silently restoring a
stale contact or outdated trust decision and keeps relationship information out
of the decrypted file. It does not select a final contact database, trust,
revocation, persistence, or recovery design. See
[`ALPHA-0003`](decisions/ALPHA-0003-identity-only-restore.md).

## Decision log

| #   | Unresolved decision                                                                        | Evidence required before a recommendation                                                                                                                                                                                                               | What must not be inferred from a spike                                                                               |
| --- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| 1   | **libsodium `crypto_box` versus age/Typage or another maintained high-level construction** | Node and browser behavior, confidentiality and tamper tests, official age interoperability where applicable, envelope size, later-key-compromise behavior, dependency health, custom code surface, and maintainability                                  | A successful round trip does not make a construction suitable for a product                                          |
| 2   | **Recipient-local authentication versus transferable signatures**                          | Recipient-forgeability demonstration, outsider-impersonation tests, user understanding, actual attribution needs, dispute risks, and an analysis of any proposed composition                                                                            | "Authenticated" does not automatically mean third-party-verifiable, non-repudiable, or unforgeable by the recipient  |
| 3   | **Custom CipherBook envelope versus an existing interoperable envelope format**            | Evidence of requirements an existing format cannot represent, interoperation results, parsing surface, armor overhead, and the user value of any additional metadata                                                                                    | Custom wrapping is not justified by branding, aesthetics, or convenience alone                                       |
| 4   | **Fingerprint representation and length**                                                  | Active two-key collision analysis plus measured false accepts, false rejects, completion time, full-comparison behavior, rendering, accessibility, language, omission, skimming, and transposition results across candidate representations and lengths | Cryptographic bit counts alone do not select a usable display; no 32-emoji or other fixed choice is pre-approved     |
| 5   | **QR-first versus spoken/manual verification**                                             | In-person QR observations; emoji, spoken-label, word, and hexadecimal comparison results; device and camera constraints; remote verification needs; and accessibility feedback                                                                          | Faster completion does not justify a method if users skip reciprocal verification or misunderstand what was verified |
| 6   | **CBOR versus another serialization, or no new serialization**                             | Demonstrated field requirements, canonicalization need, parser behavior, interoperability, size, test-vector clarity, and whether native age output is sufficient                                                                                       | A test harness's convenient encoding is disposable and does not establish wire bytes                                 |
| 7   | **Persistent encrypted vault and recovery design**                                         | Positive go decision, user need for persistence, browser storage constraints, passphrase threat analysis, data-loss behavior, migration needs, and recovery tradeoffs                                                                                   | The manual Alpha 1 file does not imply how durable keys should be protected, backed up, migrated, or recovered       |
| 8   | **Hosting and deployment, including GitHub Pages**                                         | Positive go decision, hosted-code mutability analysis, update integrity, security headers, offline requirements, self-hosting needs, and maintainer capacity                                                                                            | Serving a browser spike locally does not approve a production host or deployment pipeline                            |
| 9   | **Protocol version 1 bytes**                                                               | Positive go decision, selected construction and envelope direction, reviewed schemas, deterministic vectors, independent implementation needs, compatibility policy, and explicit human approval                                                        | No spike identifier, JSON object, age armor, fingerprint encoding, or fixture is version 1                           |

## Experiment-only choices

Milestones 1 and 2 and the provisional Alpha 0/Alpha 1 work may need local,
reversible choices so an experiment can run. Each such choice must:

1. be labeled experiment-only and unstable in output and documentation;
2. be isolated so the alternative spike can be compared fairly;
3. avoid the names `v1`, `version 1`, `stable`, `canonical`, and `compatible`;
4. use synthetic data and disposable identities;
5. record why it was necessary and how much custom protocol surface it added;
6. be discarded or reconsidered at Milestone 3; and
7. leave this decision log unresolved until the evidence is reviewed.

## Milestone 3 outcomes

Milestone 3 can produce one of four outcomes for each question:

- **Recommend:** comparative evidence favors a choice and its residual risks are
  explicit.
- **Defer:** evidence is insufficient and the choice is not needed for the next
  narrowly approved task.
- **Narrow:** use an existing interoperable tool or format and remove the custom
  feature from CipherBook.
- **Reject:** the choice creates more risk or maintenance cost than the observed
  benefit justifies.

A recommendation is not self-executing. Any protocol, persistence, or
deployment work requires a revised plan and explicit human approval after a
positive project-level go decision.
