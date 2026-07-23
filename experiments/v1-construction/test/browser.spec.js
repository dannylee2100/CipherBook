import { expect, test } from "@playwright/test";
import {
  disposeIdentity,
  generateDisposableIdentity,
  getPublicContact,
  openSyntheticText,
  sealSyntheticText,
} from "../src/construction.js";

function plainBytes(value) {
  return Array.from(value);
}

function plainIdentity(identity) {
  return Object.fromEntries(
    Object.entries(identity).map(([name, value]) => [name, plainBytes(value)]),
  );
}

function restoreEnvelope(envelope) {
  return {
    candidate: envelope.candidate,
    ciphertext: new Uint8Array(envelope.ciphertext),
    ...(envelope.nonce ? { nonce: new Uint8Array(envelope.nonce) } : undefined),
  };
}

for (const candidate of [
  "sealed-box-plus-signature",
  "static-box-plus-signature",
]) {
  test(`${candidate} runs in the browser`, async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#status")).toHaveText(
      "Both disposable candidates passed.",
    );
    const result = await page.evaluate(
      (name) =>
        window.__cipherBookConstructionSpike.results.find(
          (entry) => entry.candidate === name,
        ),
      candidate,
    );
    expect(result.opened).toBe("synthetic browser payload 안녕하세요");
  });
}

for (const candidate of [
  "sealed-box-plus-signature",
  "static-box-plus-signature",
]) {
  test(`${candidate} opens Node output in the browser and browser output in Node`, async ({
    page,
  }) => {
    const alice = await generateDisposableIdentity();
    const bob = await generateDisposableIdentity();
    try {
      await page.goto("/");
      const nodeEnvelope = await sealSyntheticText(
        candidate,
        alice,
        getPublicContact(bob),
        "synthetic Node to browser",
      );
      const transfer = {
        envelope: {
          candidate: nodeEnvelope.candidate,
          ciphertext: plainBytes(nodeEnvelope.ciphertext),
          ...(nodeEnvelope.nonce
            ? { nonce: plainBytes(nodeEnvelope.nonce) }
            : undefined),
        },
        alice: plainIdentity(alice),
        bob: plainIdentity(bob),
      };

      const browserOpened = await page.evaluate(async (fixture) => {
        const construction = await import("/src/construction.js");
        const bytes = (value) => new Uint8Array(value);
        const identity = (value) =>
          Object.fromEntries(
            Object.entries(value).map(([name, field]) => [name, bytes(field)]),
          );
        return construction.openSyntheticText(
          {
            candidate: fixture.envelope.candidate,
            ciphertext: bytes(fixture.envelope.ciphertext),
            ...(fixture.envelope.nonce
              ? { nonce: bytes(fixture.envelope.nonce) }
              : undefined),
          },
          identity(fixture.bob),
          construction.getPublicContact(identity(fixture.alice)),
        );
      }, transfer);
      expect(browserOpened).toBe("synthetic Node to browser");

      const browserEnvelope = await page.evaluate(
        async (fixture) => {
          const construction = await import("/src/construction.js");
          const bytes = (value) => new Uint8Array(value);
          const identity = (value) =>
            Object.fromEntries(
              Object.entries(value).map(([name, field]) => [
                name,
                bytes(field),
              ]),
            );
          const result = await construction.sealSyntheticText(
            fixture.candidate,
            identity(fixture.alice),
            construction.getPublicContact(identity(fixture.bob)),
            "synthetic browser to Node",
          );
          return {
            candidate: result.candidate,
            ciphertext: Array.from(result.ciphertext),
            ...(result.nonce ? { nonce: Array.from(result.nonce) } : undefined),
          };
        },
        {
          candidate,
          alice: plainIdentity(alice),
          bob: plainIdentity(bob),
        },
      );
      expect(
        await openSyntheticText(
          restoreEnvelope(browserEnvelope),
          bob,
          getPublicContact(alice),
        ),
      ).toBe("synthetic browser to Node");
    } finally {
      disposeIdentity(alice);
      disposeIdentity(bob);
    }
  });
}

test("the spike makes no cross-origin request", async ({ page }) => {
  const foreign = [];
  page.on("request", (request) => {
    if (new URL(request.url()).origin !== "http://127.0.0.1:4186") {
      foreign.push(request.url());
    }
  });
  await page.goto("/");
  await expect(page.locator("#status")).toHaveText(
    "Both disposable candidates passed.",
  );
  expect(foreign).toEqual([]);
});
