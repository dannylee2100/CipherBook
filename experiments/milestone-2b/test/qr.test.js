import assert from "node:assert/strict";
import { test } from "node:test";

import {
  decodeEncodedQr,
  digestFromQrPayload,
  encodeQrDigest,
  QR_EXPERIMENT_PREFIX,
  qrPayloadForDigest,
} from "../src/qr.js";

const fixture = Uint8Array.from(
  { length: 32 },
  (_, index) => (index * 7) % 256,
);

test("QR payload carries all 32 bytes behind an experiment-only prefix", () => {
  const payload = qrPayloadForDigest(fixture);
  assert.ok(payload.startsWith(QR_EXPERIMENT_PREFIX));
  assert.match(payload, /UNSTABLE:/u);
  assert.equal(payload.slice(QR_EXPERIMENT_PREFIX.length).length, 64);
  assert.deepEqual(digestFromQrPayload(payload), fixture);
});

test("QR matrix encoding and decoding recovers the exact 256 bits", () => {
  const encoded = encodeQrDigest(fixture);
  assert.ok(encoded.size > 0);
  assert.match(encoded.dataUrl, /^data:image\/gif;base64,/u);
  assert.deepEqual(decodeEncodedQr(encoded.encoded), fixture);
});

test("QR parser rejects foreign, truncated, and oversized values", () => {
  assert.throws(() => digestFromQrPayload("not-this-experiment"));
  assert.throws(() => digestFromQrPayload(`${QR_EXPERIMENT_PREFIX}00`));
  assert.throws(() =>
    digestFromQrPayload(`${QR_EXPERIMENT_PREFIX}${"00".repeat(33)}`),
  );
});
