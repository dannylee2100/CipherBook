import { randomBytes } from "node:crypto";

import { identityFileCrypto } from "../src/identity-file-crypto.js";

export function runtimePassphrase(suffix = "") {
  return `alpha-${randomBytes(18).toString("base64url")}${suffix}`;
}

export function runtimeIdentity() {
  const privateKey = new Uint8Array(
    randomBytes(identityFileCrypto.privateKeyBytes),
  );
  return {
    privateKey,
    publicKey: identityFileCrypto.derivePublicKey(privateKey),
  };
}

export function makeFastCrypto() {
  const fixedKey = new Uint8Array(randomBytes(identityFileCrypto.keyBytes));
  const observations = {
    deriveCalls: 0,
    decryptCalls: 0,
    passphraseInputs: [],
    zeroedInputs: [],
  };

  const crypto = {
    ...identityFileCrypto,
    deriveKey(passphraseBytes) {
      observations.deriveCalls += 1;
      observations.passphraseInputs.push(new Uint8Array(passphraseBytes));
      return new Uint8Array(fixedKey);
    },
    decrypt(...arguments_) {
      observations.decryptCalls += 1;
      return identityFileCrypto.decrypt(...arguments_);
    },
    zero(value) {
      if (value instanceof Uint8Array) {
        observations.zeroedInputs.push(value);
      }
      identityFileCrypto.zero(value);
    },
  };

  return { crypto, observations };
}

export function containsExactBytes(haystack, needle) {
  if (!(haystack instanceof Uint8Array) || !(needle instanceof Uint8Array)) {
    throw new TypeError("byte comparison requires Uint8Array values");
  }
  if (needle.length === 0 || needle.length > haystack.length) {
    return false;
  }
  for (let offset = 0; offset <= haystack.length - needle.length; offset += 1) {
    let equal = true;
    for (let index = 0; index < needle.length; index += 1) {
      if (haystack[offset + index] !== needle[index]) {
        equal = false;
        break;
      }
    }
    if (equal) {
      return true;
    }
  }
  return false;
}
