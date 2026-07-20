#!/usr/bin/env node

import { utf8 } from "./bytes.js";
import { LAB_WARNING, RELATIONSHIP_DIGEST_NOTICE } from "./constants.js";
import {
  AGE_SENDER_NOTICE,
  exportAgeContact,
  generateAgeIdentity,
  openAgeText,
  sealAgeText,
} from "./age.js";
import { decryptWithOfficialAge, officialAgeVersion } from "./age-cli.js";
import { collectMeasurements, formatMeasurementTable } from "./measurements.js";
import { relationshipDigestHex } from "./relationship-digest.js";
import {
  exportSodiumContact,
  forgeSodiumAsExpectedSender,
  generateSodiumIdentity,
  openSodiumAfterSenderKeyDisclosure,
  openSodiumText,
  sealSodiumText,
} from "./sodium.js";

const [mode, command] = process.argv.slice(2);

function printWarning() {
  console.error(`WARNING: ${LAB_WARNING}`);
}

function usage() {
  console.error(
    "Usage: npm run lab -- <sodium|age|compare> <identity|fingerprint|probe|measure>",
  );
  console.error("Only compare measure is supported in compare mode.");
}

function printPublicIdentity(label, publicContact) {
  console.log(`${label} disposable public contact:`);
  console.log(publicContact);
  console.log("Private key material was held in memory and was not printed.");
}

async function sodiumCommand() {
  if (command === "identity") {
    const identity = generateSodiumIdentity();
    printPublicIdentity(
      "libsodium laboratory",
      exportSodiumContact(identity.publicKey),
    );
    return;
  }

  if (command === "fingerprint") {
    const alice = generateSodiumIdentity();
    const bob = generateSodiumIdentity();
    console.log(RELATIONSHIP_DIGEST_NOTICE);
    console.log(
      relationshipDigestHex(
        utf8(exportSodiumContact(alice.publicKey)),
        utf8(exportSodiumContact(bob.publicKey)),
      ),
    );
    console.log(
      "Public diagnostic only; not a key, secret, length decision, or emoji design.",
    );
    return;
  }

  if (command === "probe") {
    const alice = generateSodiumIdentity();
    const bob = generateSodiumIdentity();
    const envelope = sealSodiumText(
      "synthetic sodium probe payload",
      alice,
      bob.publicKey,
    );
    const opened = openSodiumText(envelope, bob, alice.publicKey);
    const forged = forgeSodiumAsExpectedSender(
      utf8("synthetic recipient-forged probe"),
      bob,
      alice.publicKey,
    );
    const forgedOpened = openSodiumText(forged, bob, alice.publicKey);
    const disclosedOpened = openSodiumAfterSenderKeyDisclosure(
      envelope,
      alice,
      bob.publicKey,
    );

    console.log(
      `Synthetic round trip: ${opened === "synthetic sodium probe payload"}`,
    );
    console.log(
      `Recipient-forged transcript accepted: ${forgedOpened.length > 0}`,
    );
    console.log(
      `Later sender-key disclosure opens capture: ${disclosedOpened.length > 0}`,
    );
    console.log(
      "Authentication meaning: recipient-local, deniable, recipient-forgeable, and not a transferable signature.",
    );
    return;
  }

  throw new Error("unsupported sodium command");
}

async function ageCommand() {
  if (command === "identity") {
    const identity = await generateAgeIdentity();
    printPublicIdentity("native age", exportAgeContact(identity));
    return;
  }

  if (command === "fingerprint") {
    const alice = await generateAgeIdentity();
    const bob = await generateAgeIdentity();
    console.log(RELATIONSHIP_DIGEST_NOTICE);
    console.log(
      relationshipDigestHex(
        utf8(exportAgeContact(alice)),
        utf8(exportAgeContact(bob)),
      ),
    );
    console.log(
      "Public diagnostic only; not a key, secret, length decision, or emoji design.",
    );
    return;
  }

  if (command === "probe") {
    const bob = await generateAgeIdentity();
    const envelope = await sealAgeText(
      "synthetic age probe payload",
      bob.recipient,
    );
    const opened = await openAgeText(envelope, bob);
    const officialOpened = await decryptWithOfficialAge(envelope, bob);

    console.log(
      `Synthetic round trip: ${opened === "synthetic age probe payload"}`,
    );
    console.log(
      `Official age ${await officialAgeVersion()} opened Typage output: ${officialOpened.length > 0}`,
    );
    console.log(AGE_SENDER_NOTICE);
    return;
  }

  throw new Error("unsupported age command");
}

async function main() {
  printWarning();
  if (mode === "sodium") {
    await sodiumCommand();
    return;
  }
  if (mode === "age") {
    await ageCommand();
    return;
  }
  if (mode === "compare" && command === "measure") {
    console.log(formatMeasurementTable(await collectMeasurements()));
    return;
  }

  usage();
  process.exitCode = 2;
}

main().catch((error) => {
  console.error(`Laboratory command failed: ${error.message}`);
  process.exitCode = 1;
});
