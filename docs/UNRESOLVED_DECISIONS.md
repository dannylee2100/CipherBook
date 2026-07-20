# Unresolved Decisions

> [!IMPORTANT]
> Every item in this document is unresolved. Mentioning a candidate does not
> approve it. Experimental output must not be described as stable, canonical,
> compatible, or protocol version 1.

## Evidence categories

### Facts

- No comparative implementation or user observation has been completed.
- The repository contains no approved protocol bytes or application design.
- Existing tools may make a new envelope format unnecessary.

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

## Decision log

| # | Unresolved decision | Evidence required before a recommendation | What must not be inferred from a spike |
| --- | --- | --- | --- |
| 1 | **libsodium `crypto_box` versus age/Typage or another maintained high-level construction** | Node and browser behavior, confidentiality and tamper tests, official age interoperability where applicable, envelope size, later-key-compromise behavior, dependency health, custom code surface, and maintainability | A successful round trip does not make a construction suitable for a product |
| 2 | **Recipient-local authentication versus transferable signatures** | Recipient-forgeability demonstration, outsider-impersonation tests, user understanding, actual attribution needs, dispute risks, and an analysis of any proposed composition | "Authenticated" does not automatically mean third-party-verifiable, non-repudiable, or unforgeable by the recipient |
| 3 | **Custom CipherBook envelope versus an existing interoperable envelope format** | Evidence of requirements an existing format cannot represent, interoperation results, parsing surface, armor overhead, and the user value of any additional metadata | Custom wrapping is not justified by branding, aesthetics, or convenience alone |
| 4 | **Fingerprint representation and length** | Active two-key collision analysis plus measured false accepts, false rejects, completion time, full-comparison behavior, rendering, accessibility, language, omission, skimming, and transposition results across candidate representations and lengths | Cryptographic bit counts alone do not select a usable display; no 32-emoji or other fixed choice is pre-approved |
| 5 | **QR-first versus spoken/manual verification** | In-person QR observations; emoji, spoken-label, word, and hexadecimal comparison results; device and camera constraints; remote verification needs; and accessibility feedback | Faster completion does not justify a method if users skip reciprocal verification or misunderstand what was verified |
| 6 | **CBOR versus another serialization, or no new serialization** | Demonstrated field requirements, canonicalization need, parser behavior, interoperability, size, test-vector clarity, and whether native age output is sufficient | A test harness's convenient encoding is disposable and does not establish wire bytes |
| 7 | **Persistent encrypted vault and recovery design** | Positive go decision, user need for persistence, browser storage constraints, passphrase threat analysis, data-loss behavior, migration needs, and recovery tradeoffs | Memory-only spike state does not imply how durable keys should be protected or recovered |
| 8 | **Hosting and deployment, including GitHub Pages** | Positive go decision, hosted-code mutability analysis, update integrity, security headers, offline requirements, self-hosting needs, and maintainer capacity | Serving a browser spike locally does not approve a production host or deployment pipeline |
| 9 | **Protocol version 1 bytes** | Positive go decision, selected construction and envelope direction, reviewed schemas, deterministic vectors, independent implementation needs, compatibility policy, and explicit human approval | No spike identifier, JSON object, age armor, fingerprint encoding, or fixture is version 1 |

## Experiment-only choices

Milestones 1 and 2 may need local, reversible choices so an experiment can run.
Each such choice must:

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
