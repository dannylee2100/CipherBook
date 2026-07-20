import { expect, test } from "@playwright/test";

import {
  confirmFullComparison,
  connectPair,
  exportIdentityFile,
  generateIdentity,
  importIdentityFile,
  openEnvelope,
  runtimeBrowserPassphrase,
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

test("complete Alpha 1 workflow leaves browser storage empty and makes no runtime request", async ({
  context,
}) => {
  const requests = [];
  const observe = (page) => {
    page.on("request", (request) => {
      requests.push({
        resourceType: request.resourceType(),
        url: request.url(),
      });
    });
  };

  const alice = await context.newPage();
  const bob = await context.newPage();
  observe(alice);
  observe(bob);
  await connectPair(alice, bob);

  const initialRequests = [...requests];
  expect(initialRequests.length).toBeGreaterThan(0);
  for (const request of initialRequests) {
    const url = new URL(request.url);
    expect(url.origin).toBe("http://127.0.0.1:4175");
    expect(
      url.pathname === "/" ||
        (/^\/assets\//u.test(url.pathname) &&
          /\.(?:css|js)$/u.test(url.pathname)),
    ).toBe(true);
  }

  await confirmFullComparison(alice);
  await confirmFullComparison(bob);
  const envelope = await sealText(alice, "synthetic storage inspection");
  await openEnvelope(bob, envelope);
  await expect(bob.locator("#opened-plaintext")).toHaveText(
    "synthetic storage inspection",
  );

  const expectedEmpty = {
    localStorageEntries: 0,
    sessionStorageEntries: 0,
    cookie: "",
    indexedDatabases: [],
    cacheKeys: [],
    serviceWorkerRegistrations: 0,
  };
  expect(await inspectPersistence(alice)).toEqual(expectedEmpty);
  expect(await inspectPersistence(bob)).toEqual(expectedEmpty);
  expect(requests).toEqual(initialRequests);
});

test("manual identity-file export and import add no browser persistence or runtime request", async ({
  page,
}) => {
  const requests = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.goto("/");
  const originalContact = await generateIdentity(page);
  const initialRequests = [...requests];
  const passphrase = runtimeBrowserPassphrase();
  const file = await exportIdentityFile(page, passphrase);
  await page.reload();
  const reloadRequests = requests.slice(initialRequests.length);
  await importIdentityFile(page, file, passphrase);

  await expect(page.locator("#own-contact")).toHaveValue(originalContact);
  expect(await inspectPersistence(page)).toEqual({
    localStorageEntries: 0,
    sessionStorageEntries: 0,
    cookie: "",
    indexedDatabases: [],
    cacheKeys: [],
    serviceWorkerRegistrations: 0,
  });
  for (const requestUrl of [...initialRequests, ...reloadRequests]) {
    const url = new URL(requestUrl);
    expect(url.origin).toBe("http://127.0.0.1:4175");
  }
  expect(requests).toEqual([...initialRequests, ...reloadRequests]);
});
