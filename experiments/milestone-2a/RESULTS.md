> [!WARNING]
> **Experimental laboratory only. Do not use real secrets. Results apply only
> to the exact synthetic workflows and environments recorded here.**

# Milestone 2A evidence record

This document records a disposable browser experiment. It does not recommend a
construction or verification method and does not approve a browser client,
format, protocol, persistence design, or deployment.

## Measured facts

Measured locally on 2026-07-20:

| Component                       | Tested value                             |
| ------------------------------- | ---------------------------------------- |
| Platform                        | macOS on arm64                           |
| Node                            | 26.4.0                                   |
| npm                             | 11.17.0                                  |
| Playwright Test                 | 1.61.1                                   |
| Chromium supplied by Playwright | 149.0.7827.55                            |
| Firefox supplied by Playwright  | 151.0                                    |
| Official age executable         | 1.3.1 (`age --version` reports `v1.3.1`) |

- Direct runtime dependencies remain `libsodium-wrappers` 0.8.4 and
  `age-encryption` 0.3.0.
- Direct development dependencies added for this experiment are Vite 8.1.5 and
  Playwright Test 1.61.1.
- The browser reuses Milestone 1 sodium and age construction modules after a
  browser-neutral byte-helper refactor.
- The libsodium WebAssembly distribution requires the CSP source
  `'wasm-unsafe-eval'`; general JavaScript `'unsafe-eval'` remains disabled.
- The relationship display is the complete 64-character hexadecimal SHA-256
  diagnostic. It is study instrumentation, not a selected representation.
- The disposable build produced one local HTML file, one local CSS asset, and
  one local JavaScript asset. The JavaScript bundle is approximately 592 kB
  before compression, primarily reflecting the two construction libraries; no
  code-splitting or size optimization was added to this feasibility spike.
- `npm audit` and `npm audit --omit=dev` each reported zero known
  vulnerabilities at the time of this run. This registry result is not an
  independent review or a prediction about future dependency state.
- npm 11 reported unapproved install scripts for optional development-only
  `fsevents` packages reached through Playwright and Vite. The experiment did
  not approve or execute those scripts; both toolchains passed on the tested
  platform without them.

## Observed browser behavior

- Chromium passed 13 of 13 workflow, semantics, hostile-input, clipboard,
  clear/reload, storage, and network tests.
- Firefox passed the same 13 of 13 tests.
- Both modes generated temporary identities, exchanged only public contacts,
  derived the same full relationship diagnostic in two pages, required explicit
  comparison confirmation before sealing, and round-tripped synthetic Unicode
  text.
- Both modes rejected malformed and oversized contacts, wrong recipients,
  mutated envelopes, and truncated envelopes. Sodium also rejected an expected-
  sender mismatch and outsider relabeling.
- A controlled sodium probe produced a recipient-forged transcript that the
  recipient's normal expected-sender opener accepted.
- A controlled age probe showed that a party holding only the public recipient
  can create a native envelope that the recipient opens.
- Hostile HTML-like plaintext was rendered as text. Ciphertext copying did not
  copy plaintext, and plaintext was copied only through its separate explicit
  control.
- Both construction workflows left local storage, session storage, cookies,
  IndexedDB, Cache Storage, and service-worker registrations empty. Clear and
  reload returned the interface to empty state.
- Automated request observation found no request outside the local test origin.
- The first Chromium run was blocked by CSP before workflow execution because
  libsodium instantiates WebAssembly. Adding only `'wasm-unsafe-eval'` allowed
  the maintained distribution to run; general JavaScript `'unsafe-eval'`
  remained disabled. The corrected behavior then passed in both browsers.

## Cross-runtime evidence

- Six of six cross-runtime tests passed: three directions/groups in Chromium and
  the same three in Firefox.
- Node-created unstable sodium envelopes opened in the browser, and
  browser-created unstable sodium envelopes opened through the Node laboratory.
- Node/Typage native age armor opened in the browser, and browser-created native
  age armor opened through Node/Typage.
- Browser-created native age armor opened with the real official age 1.3.1
  executable, and official age 1.3.1 armor opened in both browser engines.
- Native age armor remained unwrapped.

The browser and Node paths share the same JavaScript construction libraries.
These results are cross-runtime compatibility evidence, not independent
implementation interoperability.

## Security-language findings

The sodium mode states that authentication is recipient-local,
recipient-forgeable, and not third-party proof of authorship. The age mode states
that the envelope is encrypted for the recipient and does not cryptographically
verify a sender. The interface does not label either result as signed, proven,
or independently reviewed.

## Untested assumptions

- No user-observation study has tested whether people understand either sender
  statement or compare all 64 hexadecimal characters.
- Hexadecimal usability, QR, emoji, word, and spoken verification remain
  untested.
- Safari, WebKit, mobile browsers, assistive-technology behavior, compromised
  endpoints, extensions, and production hosting are untested.
- Passing storage checks cannot prove that browser, operating-system, swap,
  crash, clipboard, or instrumentation layers retained no copies.
- A successful static build does not establish offline installation or approve
  a service worker.

## Remaining unresolved decisions

All nine project decisions remain unresolved:

1. libsodium `crypto_box` versus age/Typage or another maintained construction;
2. recipient-local authentication versus transferable signatures;
3. a custom envelope versus an existing format;
4. fingerprint representation and length;
5. QR-first versus spoken/manual verification;
6. serialization or no new serialization;
7. persistent vault and recovery;
8. hosting and deployment; and
9. protocol version 1 bytes.

Milestone 2B has not begun. Milestone 3 owns comparative recommendation and the
project go/no-go decision.
