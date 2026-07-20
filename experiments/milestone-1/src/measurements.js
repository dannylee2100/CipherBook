import { utf8 } from "./bytes.js";
import { REQUIRED_MEASUREMENT_SIZES } from "./constants.js";
import {
  armorAgeEnvelope,
  exportAgeContact,
  generateAgeIdentity,
  sealAgeBytes,
} from "./age.js";
import {
  exportSodiumContact,
  generateSodiumIdentity,
  sealSodiumBytes,
  sodiumExperiment,
} from "./sodium.js";

export function syntheticPayload(size) {
  if (!Number.isSafeInteger(size) || size < 0) {
    throw new RangeError(
      "synthetic payload size must be a non-negative integer",
    );
  }
  return utf8("x".repeat(size));
}

export async function collectMeasurements(sizes = REQUIRED_MEASUREMENT_SIZES) {
  const alice = generateSodiumIdentity();
  const sodiumBob = generateSodiumIdentity();
  const ageBob = await generateAgeIdentity();
  const sodiumContactBytes = Buffer.byteLength(
    exportSodiumContact(sodiumBob.publicKey),
  );
  const ageContactBytes = Buffer.byteLength(exportAgeContact(ageBob));
  const rows = [];

  for (const size of sizes) {
    const plaintext = syntheticPayload(size);
    const sodiumResult = sealSodiumBytes(plaintext, alice, sodiumBob.publicKey);
    rows.push({
      construction: "libsodium crypto_box laboratory wrapper",
      plaintextBytes: plaintext.length,
      rawCryptographicBytes: sodiumResult.ciphertext.length,
      separateNonceBytes: sodiumExperiment.nonceBytes,
      nativeSerializedBytes: null,
      copiedTextBytes: Buffer.byteLength(sodiumResult.serialized),
      publicContactBytes: sodiumContactBytes,
      customFramingFields: 6,
    });

    const ageBinary = await sealAgeBytes(plaintext, ageBob.recipient);
    const ageArmor = armorAgeEnvelope(ageBinary);
    rows.push({
      construction: "native age via Typage",
      plaintextBytes: plaintext.length,
      rawCryptographicBytes: ageBinary.length,
      separateNonceBytes: 0,
      nativeSerializedBytes: ageBinary.length,
      copiedTextBytes: Buffer.byteLength(ageArmor),
      publicContactBytes: ageContactBytes,
      customFramingFields: 0,
    });
  }

  return rows;
}

export function formatMeasurementTable(rows) {
  const lines = [
    "| Construction | Plaintext | Raw cryptographic | Separate nonce | Native serialized | Copied text | Public contact | Custom framing fields |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
  ];
  for (const row of rows) {
    lines.push(
      `| ${row.construction} | ${row.plaintextBytes} | ${row.rawCryptographicBytes} | ${row.separateNonceBytes} | ${row.nativeSerializedBytes ?? "n/a"} | ${row.copiedTextBytes} | ${row.publicContactBytes} | ${row.customFramingFields} |`,
    );
  }

  return lines.join("\n");
}
