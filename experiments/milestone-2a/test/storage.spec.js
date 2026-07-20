import { expect, test } from "@playwright/test";

import {
  confirmComparison,
  connectPair,
  openEnvelope,
  openMode,
  sealText,
} from "./helpers.js";

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

for (const mode of ["sodium", "age"]) {
  test(`${mode} workflow leaves browser storage empty and makes no external request`, async ({
    context,
  }) => {
    const externalRequests = [];
    const observe = (page) => {
      page.on("request", (request) => {
        const url = new URL(request.url());
        if (url.origin !== "http://127.0.0.1:4173") {
          externalRequests.push(request.url());
        }
      });
    };

    const alice = await context.newPage();
    const bob = await context.newPage();
    observe(alice);
    observe(bob);
    await openMode(alice, mode);
    await openMode(bob, mode);
    await connectPair(alice, bob);
    await confirmComparison(alice);
    const envelope = await sealText(
      alice,
      `synthetic ${mode} storage inspection`,
    );
    await openEnvelope(bob, envelope);
    await expect(bob.locator("#opened-plaintext")).toContainText(
      "storage inspection",
    );

    expect(await inspectPersistence(alice)).toEqual({
      localStorageEntries: 0,
      sessionStorageEntries: 0,
      cookie: "",
      indexedDatabases: [],
      cacheKeys: [],
      serviceWorkerRegistrations: 0,
    });
    expect(await inspectPersistence(bob)).toEqual({
      localStorageEntries: 0,
      sessionStorageEntries: 0,
      cookie: "",
      indexedDatabases: [],
      cacheKeys: [],
      serviceWorkerRegistrations: 0,
    });
    expect(externalRequests).toEqual([]);
  });
}

test("Clear and reload both return the page to empty experimental state", async ({
  context,
}) => {
  const alice = await context.newPage();
  const bob = await context.newPage();
  await Promise.all([alice.goto("/"), bob.goto("/")]);
  await connectPair(alice, bob);
  await confirmComparison(alice);
  const envelope = await sealText(alice, "synthetic clear and reload text");
  await bob.locator("#open-envelope").fill(envelope);

  await alice.locator("#clear-all").click();
  for (const selector of [
    "#own-contact",
    "#contact-input",
    "#relationship-diagnostic",
    "#seal-plaintext",
    "#sealed-envelope",
    "#open-envelope",
  ]) {
    await expect(alice.locator(selector)).toHaveValue("");
  }
  await expect(alice.locator("#opened-plaintext")).toHaveText("");
  await expect(alice.locator("#comparison-confirmed")).not.toBeChecked();

  await bob.reload();
  for (const selector of [
    "#own-contact",
    "#contact-input",
    "#relationship-diagnostic",
    "#seal-plaintext",
    "#sealed-envelope",
    "#open-envelope",
  ]) {
    await expect(bob.locator(selector)).toHaveValue("");
  }
  await expect(bob.locator("#opened-plaintext")).toHaveText("");
  await expect(bob.locator("#identity-status")).toHaveText(
    "No temporary identity exists.",
  );
});
