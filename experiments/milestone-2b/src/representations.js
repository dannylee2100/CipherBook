import { CONDITION_BY_ID, DIGEST_BYTES } from "./constants.js";
import { EMOJI_TABLE } from "./emoji-table.js";
import { WORD_LIST } from "./word-list.js";

export function validateStudyDigest(digest) {
  if (!(digest instanceof Uint8Array) || digest.length !== DIGEST_BYTES) {
    throw new Error("synthetic study value must be exactly 32 bytes");
  }
  return digest;
}

export function bytesToHex(bytes) {
  if (!(bytes instanceof Uint8Array)) {
    throw new Error("bytes must be a Uint8Array");
  }
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

export function hexToBytes(hex) {
  if (
    typeof hex !== "string" ||
    hex.length % 2 !== 0 ||
    !/^[0-9a-f]+$/u.test(hex)
  ) {
    throw new Error(
      "hexadecimal input must be non-empty, lowercase, and even-length",
    );
  }
  return Uint8Array.from(
    hex.match(/.{2}/gu).map((pair) => Number.parseInt(pair, 16)),
  );
}

export function sixBitIndices(digest, count) {
  validateStudyDigest(digest);
  if (!Number.isInteger(count) || count < 1 || count * 6 > digest.length * 8) {
    throw new Error("six-bit symbol count is outside the study value");
  }

  return Array.from({ length: count }, (_, symbolIndex) => {
    let value = 0;
    for (let offset = 0; offset < 6; offset += 1) {
      const bitIndex = symbolIndex * 6 + offset;
      const byte = digest[Math.floor(bitIndex / 8)];
      const bit = (byte >>> (7 - (bitIndex % 8))) & 1;
      value = (value << 1) | bit;
    }
    return value;
  });
}

function positioned(entry, position) {
  return Object.freeze({ ...entry, position });
}

export function emojiEntries(digest, count) {
  return sixBitIndices(digest, count).map((index, offset) => {
    const item = EMOJI_TABLE[index];
    return positioned(
      {
        index,
        symbol: item.symbol,
        label: item.label,
        codePoints: item.codePoints,
      },
      offset + 1,
    );
  });
}

export function spokenEntries(digest) {
  return emojiEntries(digest, 16).map((item) =>
    positioned(
      {
        index: item.index,
        label: item.label,
        codePoints: item.codePoints,
      },
      item.position,
    ),
  );
}

export function wordEntries(digest) {
  validateStudyDigest(digest);
  return Array.from(digest.slice(0, 12), (index, offset) =>
    positioned({ index, word: WORD_LIST[index] }, offset + 1),
  );
}

export function hexEntries(digest) {
  validateStudyDigest(digest);
  const text = bytesToHex(digest.slice(0, 12));
  return text
    .match(/.{4}/gu)
    .map((group, offset) => positioned({ group }, offset + 1));
}

export function groupFullDigestHex(digest) {
  validateStudyDigest(digest);
  return bytesToHex(digest).match(/.{8}/gu).join(" ");
}

export function representationFor(conditionId, digest) {
  const condition = CONDITION_BY_ID[conditionId];
  if (!condition) {
    throw new Error(`unknown study condition: ${conditionId}`);
  }
  validateStudyDigest(digest);

  let items = [];
  if (condition.kind === "emoji") {
    items = emojiEntries(digest, condition.bits / 6);
  } else if (condition.kind === "spoken") {
    items = spokenEntries(digest);
  } else if (condition.kind === "words") {
    items = wordEntries(digest);
  } else if (condition.kind === "hex") {
    items = hexEntries(digest);
  }

  return Object.freeze({
    conditionId,
    label: condition.label,
    kind: condition.kind,
    bits: condition.bits,
    digestHex: bytesToHex(digest),
    items: Object.freeze(items),
  });
}

export function representationSignature(representation) {
  if (representation.kind === "qr") {
    return representation.digestHex;
  }
  return representation.items
    .map((item) => item.index ?? item.group ?? item.label)
    .join("|");
}
