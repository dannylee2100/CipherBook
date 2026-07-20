// Deterministic study-fixture generation and local task ordering only. This is
// not cryptographic random generation and must never generate keys or secrets.
function fnv1a32(text) {
  let value = 0x811c9dc5;
  for (const character of text) {
    value ^= character.codePointAt(0);
    value = Math.imul(value, 0x01000193);
  }
  return value >>> 0;
}

export function createStudyPrng(seed) {
  if (typeof seed !== "string" || seed.length === 0) {
    throw new Error("a non-empty deterministic study seed is required");
  }
  let state = fnv1a32(seed) || 0x6d2b79f5;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 0x1_0000_0000;
  };
}

export function deterministicStudyBytes(seed, length) {
  if (!Number.isInteger(length) || length < 0) {
    throw new Error("study byte length must be a non-negative integer");
  }
  const random = createStudyPrng(seed);
  return Uint8Array.from({ length }, () => Math.floor(random() * 256));
}

export function shuffleStudyItems(items, seed) {
  const output = [...items];
  const random = createStudyPrng(seed);
  for (let index = output.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [output[index], output[target]] = [output[target], output[index]];
  }
  return output;
}
