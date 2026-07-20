import { readFile } from "node:fs/promises";

import { expect, test } from "@playwright/test";

import { generateStudyPlan } from "../src/task-generator.js";

import {
  answerAndSave,
  completeRemainingTasks,
  createStudySession,
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

test("moderator stays blinded until an immutable neutral participant response", async ({
  page,
}) => {
  await createStudySession(page, "A");
  await expect(page.getByTestId("answer-key")).toBeHidden();
  await expect(page.locator("#ground-truth")).toHaveCount(0);
  await expect(page.locator("#mismatch-detail")).toHaveCount(0);
  await expect(page.locator("#observation-area")).toBeHidden();

  await startParticipantTask(page);
  await expect(page.locator("#participant-instruction")).toHaveText(
    "Decide whether the two displayed values match. Answer Match, Mismatch, or Unsure.",
  );
  await expect(page.locator("#participant-instruction")).not.toContainText(
    /compare every|check all|do not skim|beginning or end/iu,
  );

  await page.locator('[data-response="match"]').click();
  await expect(page.getByTestId("answer-key")).toBeVisible();
  await expect(page.locator("#ground-truth")).not.toBeEmpty();
  await expect(page.locator("#post-response-question")).toContainText(
    "Which numbered positions or groups did you compare?",
  );
  const recordedOutcome = await page.locator("#outcome-text").textContent();
  await page.evaluate(() => {
    document.querySelector('[data-response="mismatch"]').click();
  });
  await expect(page.locator("#outcome-text")).toHaveText(recordedOutcome);
  await expect(page.locator("#show-participant")).toBeHidden();
});

test("spoken condition exposes only the conduct reference before response", async ({
  page,
}) => {
  await createStudySession(page, "D");

  for (let attempts = 0; attempts < 24; attempts += 1) {
    const summary = await page.locator("#task-summary").textContent();
    if (summary.includes("Spoken emoji labels")) {
      break;
    }
    await startParticipantTask(page);
    await answerAndSave(page, "unsure");
  }

  await expect(page.locator("#task-summary")).toContainText(
    "Spoken emoji labels",
  );
  await expect(page.getByTestId("answer-key")).toBeHidden();
  await expect(page.locator("#moderator-reference .sequence-item")).toHaveCount(
    16,
  );

  await startParticipantTask(page);
  await expect(page.locator("#reference-card")).toBeHidden();
  await expect(page.locator("#spoken-participant-context")).toBeVisible();
  await expect(page.locator("#participant-instruction")).toHaveText(
    "Decide whether the two displayed values match. Answer Match, Mismatch, or Unsure.",
  );
  const comparisonEntryCount = await page
    .locator("#participant-comparison .sequence-item")
    .count();
  expect([15, 16, 17]).toContain(comparisonEntryCount);
  await page.locator('[data-response="unsure"]').click();
  await expect(page.getByTestId("answer-key")).toBeVisible();
  const mismatchDetail = await page.locator("#mismatch-detail").textContent();
  if (mismatchDetail.includes("omitted-entry")) {
    expect(comparisonEntryCount).toBe(15);
  } else if (mismatchDetail.includes("duplicated-entry")) {
    expect(comparisonEntryCount).toBe(17);
  } else {
    expect(comparisonEntryCount).toBe(16);
  }
  await page.locator("#repeat-count").fill("2");
  await page
    .locator("#moderator-observation")
    .fill("Participant requested a repeat; no identifying data recorded.");
  await page.locator("#save-advance").click();
  await expect(page.locator("#session-summary")).toContainText(
    /[1-9][0-9]* saved observation/u,
  );
});

test("explicit export previews notes and includes reproducible plan metadata", async ({
  page,
}) => {
  await createStudySession(page, "E");
  await startParticipantTask(page);
  await answerAndSave(page, "unsure", "Synthetic task note for export review.");
  await completeRemainingTasks(page);

  await expect(page.locator("#export-area")).toBeVisible();
  await expect(page.locator("#download-json")).toBeHidden();
  await page.locator("#review-export").click();
  await expect(page.locator("#export-note-preview")).toBeVisible();
  await expect(page.locator("#export-note-list")).toContainText(
    "Synthetic task note for export review.",
  );
  await expect(page.locator("#download-json")).toBeDisabled();
  await page.locator("#confirm-export").check();
  await expect(page.locator("#download-json")).toBeEnabled();

  const downloadPromise = page.waitForEvent("download");
  await page.locator("#download-json").click();
  const download = await downloadPromise;
  const text = await readFile(await download.path(), "utf8");
  const value = JSON.parse(text);
  expect(value.observations).toHaveLength(24);
  expect(value.anonymousParticipantCode).toBe("P01");
  expect(value.studyArm).toBe("E");
  expect(value.studyPlanVersion).toMatch(/EXPERIMENT-UNSTABLE/u);
  expect(value.taskSetSeed).toMatch(/^[0-9a-f]{32}$/u);
  expect(value.observations[0].taskId).toMatch(/^M2B-E-[0-9]{3}$/u);
  const reconstructed = await generateStudyPlan({
    taskSetSeed: value.taskSetSeed,
    studyArm: value.studyArm,
  });
  expect(
    value.observations.map((observation) => ({
      taskId: observation.taskId,
      condition: observation.condition,
      groundTruth: observation.groundTruth,
      mismatchType: observation.mismatchType,
      mismatchPosition: observation.mismatchPosition,
    })),
  ).toEqual(
    reconstructed.tasks.map((task) => ({
      taskId: task.taskId,
      condition: task.conditionId,
      groundTruth: task.groundTruth,
      mismatchType: task.mismatchType,
      mismatchPosition: task.mismatchPosition,
    })),
  );
  const browserStimuli = await page.evaluate(
    async ({ taskSetSeed, studyArm }) => {
      const { representationSignature } =
        await import("/src/representations.js");
      const { generateStudyPlan: generateBrowserStudyPlan } =
        await import("/src/task-generator.js");
      const browserPlan = await generateBrowserStudyPlan({
        taskSetSeed,
        studyArm,
      });
      return browserPlan.tasks.map((task) => ({
        taskId: task.taskId,
        referenceDigest: task.reference.digestHex,
        referenceSignature: representationSignature(task.reference),
        comparisonSignature: representationSignature(task.comparison),
      }));
    },
    { taskSetSeed: value.taskSetSeed, studyArm: value.studyArm },
  );
  const { representationSignature } = await import("../src/representations.js");
  expect(browserStimuli).toEqual(
    reconstructed.tasks.map((task) => ({
      taskId: task.taskId,
      referenceDigest: task.reference.digestHex,
      referenceSignature: representationSignature(task.reference),
      comparisonSignature: representationSignature(task.comparison),
    })),
  );
  expect(text).not.toMatch(
    /digestHex|"reference"|"comparison"|privateKey|publicContact/u,
  );
});

test("clear and reload reset active study state", async ({ page }) => {
  await createStudySession(page, "F");
  await startParticipantTask(page);
  await page.locator("#pause-task").click();
  await expect(page.locator("#global-status")).toContainText("paused");
  await page.locator("#clear-session").click();
  await expect(page.locator("#setup-view")).toBeVisible();
  await expect(page.locator("#moderator-view")).toBeHidden();

  await createStudySession(page, "G");
  await page.reload();
  await expect(page.locator("#setup-view")).toBeVisible();
  await expect(page.locator("#moderator-view")).toBeHidden();
  await expect(page.locator("#global-status")).toHaveText(
    "No synthetic study session exists.",
  );
});
