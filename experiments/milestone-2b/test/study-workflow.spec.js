import { readFile } from "node:fs/promises";

import { expect, test } from "@playwright/test";

import {
  answerAndSave,
  createFixedSession,
  startParticipantTask,
} from "./helpers.js";

test("experimental warning, synthetic labels, and no-recommendation boundary are visible", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByTestId("experimental-warning")).toContainText(
    "Experimental study harness only. Do not use real secrets.",
  );
  for (const label of [
    "SYNTHETIC STUDY VALUE",
    "NOT A KEY",
    "NOT A PASSWORD",
    "NOT A REAL CONTACT FINGERPRINT",
  ]) {
    await expect(page.locator("body")).toContainText(label);
  }
  await expect(page.locator("body")).toContainText(
    "No verification method or displayed length is selected",
  );
});

test("moderator answer key is separated from participant response controls", async ({
  page,
}) => {
  await createFixedSession(page, "emoji-48");
  await expect(page.getByTestId("answer-key")).toBeVisible();
  await expect(page.locator("#ground-truth")).toContainText("MATCH");

  await startParticipantTask(page);
  await expect(page.getByTestId("answer-key")).toBeHidden();
  await expect(page.locator("#participant-task-summary")).toContainText(
    "48 displayed bits",
  );
  await expect(
    page.locator("#participant-reference .sequence-item"),
  ).toHaveCount(8);
  await expect(
    page.locator("#participant-comparison .sequence-item"),
  ).toHaveCount(8);
  await expect(
    page.locator("#participant-reference .item-label").first(),
  ).toBeVisible();

  const matchButton = page.locator('[data-response="match"]');
  await matchButton.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#pending-outcome")).toBeVisible();
  await expect(page.locator("#outcome-text")).toContainText(
    "matches the task ground truth",
  );
});

test("spoken condition separates moderator reading card and records repeats", async ({
  page,
}) => {
  await createFixedSession(page, "spoken-emoji-96");
  await expect(page.locator("#spoken-instruction")).toBeVisible();
  await expect(page.locator("#moderator-reference .sequence-item")).toHaveCount(
    16,
  );

  await startParticipantTask(page);
  await expect(page.locator("#reference-card")).toBeHidden();
  await expect(
    page.locator("#participant-comparison .sequence-item"),
  ).toHaveCount(16);
  await page.locator('[data-response="match"]').click();
  await page.locator("#repeat-count").fill("2");
  await page
    .locator("#moderator-observation")
    .fill("Participant requested a repeat; no personal information recorded.");
  await page.locator("#save-advance").click();
  await expect(page.locator("#session-summary")).toContainText(
    "1 saved observation",
  );
});

test("explicit export requires review and confirmation and excludes stimuli", async ({
  page,
}) => {
  await createFixedSession(page, "qr-256");
  await startParticipantTask(page);
  await answerAndSave(page, "match", "Synthetic exact QR task.");
  await startParticipantTask(page);
  await answerAndSave(page, "mismatch", "Synthetic differing QR task.");

  await expect(page.locator("#export-area")).toBeVisible();
  await expect(page.locator("#download-json")).toBeHidden();
  await page.locator("#review-export").click();
  await expect(page.locator("#download-json")).toBeDisabled();
  await page.locator("#confirm-export").check();
  await expect(page.locator("#download-json")).toBeEnabled();

  const downloadPromise = page.waitForEvent("download");
  await page.locator("#download-json").click();
  const download = await downloadPromise;
  const text = await readFile(await download.path(), "utf8");
  const value = JSON.parse(text);
  expect(value.observations).toHaveLength(2);
  expect(value.anonymousParticipantCode).toBe("P01");
  expect(text).not.toMatch(
    /digestHex|reference|comparison|privateKey|publicContact/u,
  );
});

test("clear and reload reset active study state", async ({ page }) => {
  await createFixedSession(page, "hex-96");
  await startParticipantTask(page);
  await page.locator("#pause-task").click();
  await expect(page.locator("#global-status")).toContainText("paused");
  await page.locator("#clear-session").click();
  await expect(page.locator("#setup-view")).toBeVisible();
  await expect(page.locator("#moderator-view")).toBeHidden();

  await createFixedSession(page, "words-96");
  await page.reload();
  await expect(page.locator("#setup-view")).toBeVisible();
  await expect(page.locator("#moderator-view")).toBeHidden();
  await expect(page.locator("#global-status")).toHaveText(
    "No synthetic study session exists.",
  );
});
