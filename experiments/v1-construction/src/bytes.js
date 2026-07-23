const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8", { fatal: true });

export function utf8(value) {
  return encoder.encode(value);
}

export function text(value) {
  return decoder.decode(value);
}

export function concatBytes(...parts) {
  const length = parts.reduce((total, part) => total + part.length, 0);
  const output = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

export function encodeU32(value) {
  if (!Number.isSafeInteger(value) || value < 0 || value > 0xffffffff) {
    throw new Error("invalid unsigned length");
  }
  const output = new Uint8Array(4);
  new DataView(output.buffer).setUint32(0, value, false);
  return output;
}

export function decodeU32(bytes, offset) {
  if (offset + 4 > bytes.length) {
    throw new Error("truncated unsigned length");
  }
  return new DataView(
    bytes.buffer,
    bytes.byteOffset,
    bytes.byteLength,
  ).getUint32(offset, false);
}

export function encodeParts(parts) {
  return concatBytes(
    ...parts.flatMap((part) => [encodeU32(part.length), new Uint8Array(part)]),
  );
}

export function decodeParts(bytes, expectedCount) {
  const parts = [];
  let offset = 0;
  while (offset < bytes.length) {
    const length = decodeU32(bytes, offset);
    offset += 4;
    if (offset + length > bytes.length) {
      throw new Error("truncated length-delimited value");
    }
    parts.push(bytes.slice(offset, offset + length));
    offset += length;
  }
  if (parts.length !== expectedCount) {
    throw new Error("unexpected signed-context field count");
  }
  return parts;
}

export function equalBytes(left, right) {
  if (left.length !== right.length) {
    return false;
  }
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left[index] ^ right[index];
  }
  return difference === 0;
}

export function cloneBytes(value) {
  return new Uint8Array(value);
}
