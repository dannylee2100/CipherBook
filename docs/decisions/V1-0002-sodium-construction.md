# V1-0002: Sodium sign-and-encrypt construction

- Status: accepted under the maintainer's procedural override
- Date: 2026-07-24
- Evidence: `experiments/v1-construction/RESULTS.md`

## Decision

The protocol-design stage will use:

1. a deterministic transferable signature over the approved protocol context;
2. the signature and signed content as the inner plaintext; and
3. high-level `crypto_box_seal` encryption of that inner plaintext to the
   recipient's encryption public key.

The sender's long-term encryption private key is not used to send. It remains
part of the sender's public contact because it is used when that person receives
an envelope.

The rejected candidate is the same signed inner plaintext encrypted with static
`crypto_box_easy`.

## Rationale

- Transferable sender authentication comes from one mechanism: the inner
  signature.
- Static `crypto_box` would add recipient-local sender authentication without
  removing the transferable signature, producing two different authentication
  semantics for the interface and threat model.
- Disclosure of a sender's static encryption private key can decrypt old
  outgoing static-box captures when the recipient public key is known. It does
  not independently decrypt old outgoing sealed-box captures.
- The sealed candidate's measured binary cost was eight bytes over the static
  candidate after accounting for the static nonce.
- `crypto_box_seal` keeps ephemeral-key and nonce construction inside
  libsodium's maintained high-level operation.

## Required protocol properties

This decision does not define bytes. The later specification must:

- bind the protocol domain and version;
- bind complete sender and intended-recipient identifiers;
- bind the payload and any authenticated metadata;
- reject disagreement between public routing data and signed inner data;
- verify the expected pinned signing key;
- define replay behavior accurately;
- define signing-key and encryption-key rotation separately; and
- publish fixed valid and invalid vectors.

## Security consequences

- The recipient can reveal the signed content and signature to third parties.
- A signature proves control of the verified signing key over specified bytes,
  not physical identity, truth, intent, or authority.
- Sender signing-key compromise permits new signed forgeries.
- Recipient encryption-key compromise can open retained envelopes addressed to
  that key.
- The construction does not provide forward secrecy against later recipient-key
  compromise.
- Replay of an unchanged valid envelope remains possible unless a later
  approved mechanism detects it.

## Rejected inference

Passing the disposable spike does not make its length prefixes, wrapper,
markers, identifiers, fields, or output protocol v1.
