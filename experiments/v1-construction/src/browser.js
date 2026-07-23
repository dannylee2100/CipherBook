import {
  CANDIDATE_SEALED,
  CANDIDATE_STATIC,
  disposeIdentity,
  generateDisposableIdentity,
  getPublicContact,
  openSyntheticText,
  sealSyntheticText,
} from "./construction.js";

const status = document.querySelector("#status");

async function run() {
  const alice = await generateDisposableIdentity();
  const bob = await generateDisposableIdentity();
  try {
    const results = [];
    for (const candidate of [CANDIDATE_SEALED, CANDIDATE_STATIC]) {
      const envelope = await sealSyntheticText(
        candidate,
        alice,
        getPublicContact(bob),
        "synthetic browser payload 안녕하세요",
      );
      const opened = await openSyntheticText(
        envelope,
        bob,
        getPublicContact(alice),
      );
      results.push({ candidate, opened });
    }
    window.__cipherBookConstructionSpike = { ok: true, results };
    status.textContent = "Both disposable candidates passed.";
  } finally {
    disposeIdentity(alice);
    disposeIdentity(bob);
  }
}

run().catch((error) => {
  window.__cipherBookConstructionSpike = {
    ok: false,
    error: error instanceof Error ? error.message : "unknown error",
  };
  status.textContent = "Disposable candidate check failed.";
});
