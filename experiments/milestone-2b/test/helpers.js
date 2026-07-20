import { expect } from "@playwright/test";

export async function createStudySession(page, arm = "A", code = "P01") {
  await page.goto("/");
  await page.locator("#participant-code").fill(code);
  await page.locator("#study-arm").selectOption(arm);
  await page.locator("#create-session").click();
  await expect(page.locator("#moderator-view")).toBeVisible();
  await expect(page.locator("#session-summary")).toContainText(`arm ${arm}`);
}

export async function startParticipantTask(page) {
  await page.locator("#show-participant").click();
  await expect(page.locator("#participant-view")).toBeVisible();
  await expect(page.locator("#moderator-view")).toBeHidden();
}

export async function answerAndSave(page, response, observation = "") {
  await page.locator(`[data-response="${response}"]`).click();
  await expect(page.locator("#moderator-view")).toBeVisible();
  if (observation) {
    await page.locator("#moderator-observation").fill(observation);
  }
  await page.locator("#save-advance").click();
}

export async function completeRemainingTasks(page, response = "unsure") {
  while (await page.locator("#show-participant").isVisible()) {
    await startParticipantTask(page);
    await answerAndSave(page, response);
  }
  await expect(page.locator("#export-area")).toBeVisible();
}
