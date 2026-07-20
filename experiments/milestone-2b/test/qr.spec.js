import { expect, test } from "@playwright/test";

import { createStudySession } from "./helpers.js";

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

test("QR is a moderator-only technical demonstration without participant metrics", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByTestId("qr-technical-control")).toBeVisible();
  await page.locator("#run-qr-demo").click();
  await expect(page.locator("#qr-demo-representation .qr-image")).toHaveCount(
    1,
  );
  await expect(
    page.locator("#qr-demo-representation .full-hex-fallback"),
  ).toHaveText(/^(?:[0-9a-f]{8} ){7}[0-9a-f]{8}$/u);
  await expect(page.locator("#qr-demo-status")).toContainText(
    "exact 256 synthetic bits",
  );
  await expect(page.locator("#qr-demo-status")).toContainText(
    "No participant metric was recorded",
  );
  await expect(page.locator("#qr-demo-output [data-response]")).toHaveCount(0);

  await createStudySession(page, "C");
  await expect(page.locator("#task-summary")).not.toContainText("QR");
  await expect(page.locator("#participant-view .qr-image")).toHaveCount(0);
});
