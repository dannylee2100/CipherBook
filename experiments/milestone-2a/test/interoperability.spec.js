import { expect, test } from "@playwright/test";

import { decodeUtf8, utf8 } from "../../milestone-1/src/bytes.js";
import {
  generateAgeIdentity,
  openAgeText,
  sealAgeText,
} from "../../milestone-1/src/age.js";
import {
  decryptWithOfficialAge,
  encryptWithOfficialAge,
  officialAgeVersion,
} from "../../milestone-1/src/age-cli.js";
import {
  exportSodiumContact,
  generateSodiumIdentity,
  importSodiumContact,
  openSodiumText,
  sealSodiumText,
} from "../../milestone-1/src/sodium.js";

test("Node and browser exchange sodium laboratory envelopes in both directions", async ({
  page,
}) => {
  await page.goto("/");
  const browserRecipientContact = await page.evaluate(async () => {
    const harness = await import("/src/runtime-test-harness.js");
    return harness.createSodiumRecipientForTest();
  });
  const nodeSender = generateSodiumIdentity();
  const nodeSenderContact = exportSodiumContact(nodeSender.publicKey);
  const nodeEnvelope = sealSodiumText(
    "synthetic Node-to-browser sodium payload",
    nodeSender,
    importSodiumContact(browserRecipientContact),
  );
  expect(
    await page.evaluate(
      async ({ envelope, senderContact }) => {
        const harness = await import("/src/runtime-test-harness.js");
        return harness.openSodiumForTest(envelope, senderContact);
      },
      { envelope: nodeEnvelope, senderContact: nodeSenderContact },
    ),
  ).toBe("synthetic Node-to-browser sodium payload");

  const nodeRecipient = generateSodiumIdentity();
  const browserResult = await page.evaluate(
    async ({ text, recipientContact }) => {
      const harness = await import("/src/runtime-test-harness.js");
      return harness.sealSodiumForTest(text, recipientContact);
    },
    {
      text: "synthetic browser-to-Node sodium payload",
      recipientContact: exportSodiumContact(nodeRecipient.publicKey),
    },
  );
  expect(
    openSodiumText(
      browserResult.envelope,
      nodeRecipient,
      importSodiumContact(browserResult.senderContact),
    ),
  ).toBe("synthetic browser-to-Node sodium payload");
});

test("Node and browser exchange native age armor in both directions", async ({
  page,
}) => {
  await page.goto("/");
  const browserRecipient = await page.evaluate(async () => {
    const harness = await import("/src/runtime-test-harness.js");
    return harness.createAgeRecipientForTest();
  });
  const nodeEnvelope = await sealAgeText(
    "synthetic Node-to-browser age payload",
    browserRecipient,
  );
  expect(
    await page.evaluate(async (envelope) => {
      const harness = await import("/src/runtime-test-harness.js");
      return harness.openAgeForTest(envelope);
    }, nodeEnvelope),
  ).toBe("synthetic Node-to-browser age payload");

  const nodeRecipient = await generateAgeIdentity();
  const browserEnvelope = await page.evaluate(
    async ({ text, recipient }) => {
      const harness = await import("/src/runtime-test-harness.js");
      return harness.sealAgeForTest(text, recipient);
    },
    {
      text: "synthetic browser-to-Node age payload",
      recipient: nodeRecipient.recipient,
    },
  );
  expect(browserEnvelope).toMatch(/^-----BEGIN AGE ENCRYPTED FILE-----\n/u);
  expect(browserEnvelope).not.toMatch(/CBLAB|CipherBook/u);
  expect(await openAgeText(browserEnvelope, nodeRecipient)).toBe(
    "synthetic browser-to-Node age payload",
  );
});

test("browser native age armor and official age 1.3.1 interoperate in both directions", async ({
  page,
}) => {
  await page.goto("/");
  expect(await officialAgeVersion()).toBe("v1.3.1");

  const officialRecipient = await generateAgeIdentity();
  const browserEnvelope = await page.evaluate(
    async ({ text, recipient }) => {
      const harness = await import("/src/runtime-test-harness.js");
      return harness.sealAgeForTest(text, recipient);
    },
    {
      text: "synthetic browser-to-official-age payload",
      recipient: officialRecipient.recipient,
    },
  );
  expect(
    decodeUtf8(
      await decryptWithOfficialAge(browserEnvelope, officialRecipient),
    ),
  ).toBe("synthetic browser-to-official-age payload");

  const browserRecipient = await page.evaluate(async () => {
    const harness = await import("/src/runtime-test-harness.js");
    return harness.createAgeRecipientForTest();
  });
  const officialEnvelope = await encryptWithOfficialAge(
    utf8("synthetic official-age-to-browser payload"),
    browserRecipient,
  );
  expect(
    await page.evaluate(async (envelope) => {
      const harness = await import("/src/runtime-test-harness.js");
      return harness.openAgeForTest(envelope);
    }, officialEnvelope),
  ).toBe("synthetic official-age-to-browser payload");
});
