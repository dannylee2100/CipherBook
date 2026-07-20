const encoder = new TextEncoder();
const strictDecoder = new TextDecoder("utf-8", { fatal: true });

function bytesToBinary(value) {
  const bytes = requireBytes(value);
  const chunks = [];
  const chunkSize = 16 * 1024;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    chunks.push(
      String.fromCharCode(...bytes.subarray(offset, offset + chunkSize)),
    );
  }
  return chunks.join("");
}

export function utf8(value, name = "value") {
  if (typeof value !== "string") {
    throw new TypeError(`${name} must be a string`);
  }

  return encoder.encode(value);
}

export function decodeUtf8(value, name = "value") {
  try {
    return strictDecoder.decode(requireBytes(value, name));
  } catch (error) {
    throw new Error(`${name} is not valid UTF-8`, { cause: error });
  }
}

export function requireBytes(value, name = "value") {
  if (!(value instanceof Uint8Array)) {
    throw new TypeError(`${name} must be a Uint8Array`);
  }

  return value;
}

export function boundedBytes(value, maximum, name = "value") {
  const bytes = requireBytes(value, name);
  if (bytes.length > maximum) {
    throw new RangeError(
      `${name} exceeds the ${maximum}-byte laboratory limit`,
    );
  }

  return bytes;
}

export function base64urlEncode(value) {
  return btoa(bytesToBinary(value))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/u, "");
}

export function base64urlDecode(value, expectedLength, name = "value") {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    !/^[A-Za-z0-9_-]+$/.test(value)
  ) {
    throw new Error(`${name} is not strict unpadded base64url text`);
  }

  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const binary = atob(
    `${value.replaceAll("-", "+").replaceAll("_", "/")}${padding}`,
  );
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  if (base64urlEncode(bytes) !== value) {
    throw new Error(`${name} is not strict unpadded base64url text`);
  }
  if (expectedLength !== undefined && bytes.length !== expectedLength) {
    throw new Error(`${name} must decode to ${expectedLength} bytes`);
  }

  return bytes;
}

export function compareBytes(left, right) {
  const a = requireBytes(left, "left");
  const b = requireBytes(right, "right");
  const commonLength = Math.min(a.length, b.length);

  for (let index = 0; index < commonLength; index += 1) {
    if (a[index] !== b[index]) {
      return a[index] - b[index];
    }
  }

  return a.length - b.length;
}

export function concatBytes(...parts) {
  const byteParts = parts.map((part, index) =>
    requireBytes(part, `part ${index}`),
  );
  const output = new Uint8Array(
    byteParts.reduce((length, part) => length + part.length, 0),
  );
  let offset = 0;
  for (const part of byteParts) {
    output.set(part, offset);
    offset += part.length;
  }

  return output;
}

export function uint32be(value) {
  if (!Number.isSafeInteger(value) || value < 0 || value > 0xffffffff) {
    throw new RangeError("length does not fit in an unsigned 32-bit integer");
  }

  const output = new Uint8Array(4);
  new DataView(output.buffer).setUint32(0, value, false);
  return output;
}
