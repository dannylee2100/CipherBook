> [!WARNING]
> **Disposable construction spike. Use synthetic data only. No output is
> protocol v1 or suitable for real secrets.**

# V1-1 sodium construction comparison

This experiment compares two high-level libsodium compositions using the same
unstable, length-delimited signed inner fixture:

1. an inner Ed25519 signature encrypted to the recipient with
   `crypto_box_seal`; and
2. the same signed inner bytes encrypted with static `crypto_box_easy`.

The signature fixture binds an experiment-only domain, experiment model,
sender encryption and signing public keys, recipient encryption and signing
public keys, and the synthetic payload.

The spike exists to measure behavior. Its tags, ordering, length prefixes,
identities, and outputs are disposable and must not be reused as protocol bytes.

## Semantics under test

- The sealed-box candidate obtains sender attribution only from the inner
  signature. The outer sealed box is anonymous sender encryption.
- The static-box candidate supplies recipient-local authentication in addition
  to the transferable inner signature. The comparison must determine whether
  that redundancy is useful or confusing.
- A recipient can reveal or replay a valid signed packet but cannot create a new
  payload under the sender's signing key without that private signing key.
- Binding the intended recipient inside the signature causes re-encryption of a
  copied packet to another recipient to fail the recipient-context check.
- Neither static-recipient design currently supports a forward-secrecy claim.

Run:

```sh
npm run test:v1-construction
npm run test:v1-construction:browser
npm run build:v1-construction
```
