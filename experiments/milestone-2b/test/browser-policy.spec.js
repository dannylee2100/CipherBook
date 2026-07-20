import { expect, test } from "@playwright/test";

import { createFixedSession, startParticipantTask } from "./helpers.js";

async function inspectPersistence(page) {
  return page.evaluate(async () => ({
    localStorageEntries: localStorage.length,
    sessionStorageEntries: sessionStorage.length,
    cookie: document.cookie,
    indexedDatabases:
      typeof indexedDB.databases === "function"
        ? (await indexedDB.databases()).map((database) => database.name)
        : [],
    cacheKeys: await caches.keys(),
    serviceWorkerRegistrations:
      "serviceWorker" in navigator
        ? (await navigator.serviceWorker.getRegistrations()).length
        : 0,
  }));
}

test("study workflow leaves storage empty and makes no external request", async ({
  page,
}) => {
  const externalRequests = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.origin !== "http://127.0.0.1:4174") {
      externalRequests.push(request.url());
    }
  });

  await createFixedSession(page, "emoji-96");
  await startParticipantTask(page);
  await page.locator('[data-response="match"]').click();
  await page.locator("#save-advance").click();

  expect(await inspectPersistence(page)).toEqual({
    localStorageEntries: 0,
    sessionStorageEntries: 0,
    cookie: "",
    indexedDatabases: [],
    cacheKeys: [],
    serviceWorkerRegistrations: 0,
  });
  expect(externalRequests).toEqual([]);
});

test("runtime never asks for camera or microphone and controls remain keyboard accessible", async ({
  page,
}) => {
  await page.addInitScript(() => {
    globalThis.__mediaRequestCount = 0;
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        async getUserMedia() {
          globalThis.__mediaRequestCount += 1;
          throw new Error("study harness must not request media");
        },
      },
    });
  });
  await createFixedSession(page, "hex-96");
  await startParticipantTask(page);
  expect(await page.evaluate(() => globalThis.__mediaRequestCount)).toBe(0);

  const mismatch = page.locator('[data-response="mismatch"]');
  await mismatch.focus();
  await expect(mismatch).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.locator('[data-response="unsure"]')).toBeFocused();
});
