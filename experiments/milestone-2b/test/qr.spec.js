import { expect, test } from "@playwright/test";

import {
  answerAndSave,
  createFixedSession,
  startParticipantTask,
} from "./helpers.js";

test("browser-generated QR image decodes to the exact 32 synthetic bytes", async ({
  page,
}) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const { bytesToHex } = await import("/src/representations.js");
    const { decodeQrImageData, encodeQrDigest } = await import("/src/qr.js");
    const digest = Uint8Array.from(
      { length: 32 },
      (_, index) => (index * 11) % 256,
    );
    const encoded = encodeQrDigest(digest);
    const image = new Image();
    await new Promise((resolve, reject) => {
      image.addEventListener("load", resolve, { once: true });
      image.addEventListener("error", reject, { once: true });
      image.src = encoded.dataUrl;
    });
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0);
    const decoded = decodeQrImageData(
      context.getImageData(0, 0, canvas.width, canvas.height),
    );
    return {
      source: bytesToHex(digest),
      decoded: bytesToHex(decoded),
      payload: encoded.payload,
    };
  });
  expect(result.decoded).toBe(result.source);
  expect(result.payload).toMatch(/SYNTHETIC-STUDY-VALUE-UNSTABLE/u);
});

test("QR tasks display both complete values with text fallbacks", async ({
  page,
}) => {
  await createFixedSession(page, "qr-256");
  await startParticipantTask(page);
  await expect(page.locator("#participant-view .qr-image")).toHaveCount(2);
  await expect(
    page.locator("#participant-view .full-hex-fallback"),
  ).toHaveCount(2);
  const fallbacks = await page
    .locator("#participant-view .full-hex-fallback")
    .allTextContents();
  expect(fallbacks[0].replaceAll(" ", "")).toHaveLength(64);
  expect(fallbacks[0]).toBe(fallbacks[1]);
  await expect(page.locator('[data-response="match"]')).toBeDisabled();
  await expect(page.locator('[data-response="unsure"]')).toBeEnabled();
  await page.locator("#run-qr-comparison").click();
  await expect(page.locator("#qr-comparison-status")).toContainText("MATCH");
  await expect(page.locator('[data-response="match"]')).toBeEnabled();

  await page.locator('[data-response="match"]').click();
  await page.locator("#save-advance").click();
  await startParticipantTask(page);
  const mismatchFallbacks = await page
    .locator("#participant-view .full-hex-fallback")
    .allTextContents();
  expect(mismatchFallbacks[0]).not.toBe(mismatchFallbacks[1]);
  await page.locator("#run-qr-comparison").click();
  await expect(page.locator("#qr-comparison-status")).toContainText("MISMATCH");
  await expect(page.locator("body")).toContainText(
    "does not include a camera and is not evidence about camera usability",
  );
});
