import assert from "node:assert/strict";
import { test } from "node:test";

import { REQUIRED_MEASUREMENT_SIZES } from "../src/constants.js";
import {
  collectMeasurements,
  formatMeasurementTable,
  syntheticPayload,
} from "../src/measurements.js";

test("synthetic measurement payloads have the exact requested byte sizes", () => {
  for (const size of REQUIRED_MEASUREMENT_SIZES) {
    assert.equal(syntheticPayload(size).length, size);
  }
  assert.throws(() => syntheticPayload(-1));
  assert.throws(() => syntheticPayload(1.5));
});

test("both constructions are measured at 32, 256, and 2,048 bytes", async () => {
  const rows = await collectMeasurements();

  assert.equal(rows.length, REQUIRED_MEASUREMENT_SIZES.length * 2);
  for (const size of REQUIRED_MEASUREMENT_SIZES) {
    const matchingRows = rows.filter((row) => row.plaintextBytes === size);
    assert.equal(matchingRows.length, 2);
    assert.deepEqual(
      new Set(matchingRows.map((row) => row.construction)),
      new Set([
        "libsodium crypto_box laboratory wrapper",
        "native age via Typage",
      ]),
    );
    for (const row of matchingRows) {
      assert.ok(row.rawCryptographicBytes > size);
      assert.ok(row.copiedTextBytes > row.rawCryptographicBytes);
      assert.ok(row.publicContactBytes > 0);
    }
  }

  const sodiumRows = rows.filter((row) =>
    row.construction.startsWith("libsodium"),
  );
  assert.ok(
    sodiumRows.every(
      (row) => row.rawCryptographicBytes - row.plaintextBytes === 16,
    ),
  );
  assert.ok(sodiumRows.every((row) => row.nativeSerializedBytes === null));
  assert.ok(sodiumRows.every((row) => row.separateNonceBytes === 24));

  const ageRows = rows.filter((row) =>
    row.construction.startsWith("native age"),
  );
  assert.ok(
    ageRows.every(
      (row) => row.nativeSerializedBytes === row.rawCryptographicBytes,
    ),
  );
  assert.ok(ageRows.every((row) => row.separateNonceBytes === 0));
  assert.match(formatMeasurementTable(rows), /\| 2048 \|/);
});
