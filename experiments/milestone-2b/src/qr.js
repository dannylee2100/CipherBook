import {
  binarize,
  BitMatrix,
  Byte,
  Decoder,
  Detector,
  Encoder,
  grayscale,
} from "@nuintun/qrcode";

import {
  bytesToHex,
  hexToBytes,
  validateStudyDigest,
} from "./representations.js";

export const QR_EXPERIMENT_PREFIX =
  "CIPHERBOOK-M2B-SYNTHETIC-STUDY-VALUE-UNSTABLE:";

export function qrPayloadForDigest(digest) {
  validateStudyDigest(digest);
  return `${QR_EXPERIMENT_PREFIX}${bytesToHex(digest)}`;
}

export function digestFromQrPayload(payload) {
  if (
    typeof payload !== "string" ||
    !payload.startsWith(QR_EXPERIMENT_PREFIX)
  ) {
    throw new Error("QR payload is not a Milestone 2B synthetic study value");
  }
  const hex = payload.slice(QR_EXPERIMENT_PREFIX.length);
  if (!/^[0-9a-f]{64}$/u.test(hex)) {
    throw new Error("QR synthetic study value must contain exactly 256 bits");
  }
  return hexToBytes(hex);
}

export function encodeQrDigest(digest) {
  const payload = qrPayloadForDigest(digest);
  const encoded = new Encoder({ level: "M" }).encode(new Byte(payload));
  return Object.freeze({
    payload,
    size: encoded.size,
    dataUrl: encoded.toDataURL(5, { margin: 4 }),
    encoded,
  });
}

export function decodeEncodedQr(encoded) {
  const matrix = new BitMatrix(encoded.size);
  for (let y = 0; y < encoded.size; y += 1) {
    for (let x = 0; x < encoded.size; x += 1) {
      if (encoded.get(x, y)) {
        matrix.set(x, y);
      }
    }
  }
  return digestFromQrPayload(new Decoder().decode(matrix).content);
}

export function decodeQrImageData(imageData) {
  if (!(imageData instanceof ImageData)) {
    throw new Error("QR image decoder requires ImageData");
  }
  const luminances = grayscale(imageData);
  const binarized = binarize(luminances, imageData.width, imageData.height);
  const detected = new Detector().detect(binarized);
  const decoder = new Decoder();
  let current = detected.next();

  while (!current.done) {
    try {
      const decoded = decoder.decode(current.value.matrix);
      return digestFromQrPayload(decoded.content);
    } catch {
      current = detected.next(false);
    }
  }

  throw new Error("no experimental QR value could be decoded from the image");
}
