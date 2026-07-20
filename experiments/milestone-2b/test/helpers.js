import { expect } from "@playwright/test";

export async function selectOnlyCondition(page, conditionId) {
  for (const checkbox of await page
    .locator('#condition-selection input[type="checkbox"]')
    .all()) {
    if ((await checkbox.getAttribute("value")) === conditionId) {
      await checkbox.check();
    } else {
      await checkbox.uncheck();
    }
  }
}

export async function createFixedSession(page, conditionId, code = "P01") {
  await page.goto("/");
  await selectOnlyCondition(page, conditionId);
  await page.locator("#participant-code").fill(code);
  await page.locator("#task-order").selectOption("fixed");
  await page.locator("#create-session").click();
  await expect(page.locator("#moderator-view")).toBeVisible();
}

export async function startParticipantTask(page) {
  await page.locator("#show-participant").click();
  await expect(page.locator("#participant-view")).toBeVisible();
  await expect(page.locator("#moderator-view")).toBeHidden();
}

export async function answerAndSave(page, response, observation = "") {
  if (await page.locator("#run-qr-comparison").isVisible()) {
    await page.locator("#run-qr-comparison").click();
    await expect(page.locator("#qr-comparison-status")).not.toHaveText("");
  }
  await page.locator(`[data-response="${response}"]`).click();
  await expect(page.locator("#moderator-view")).toBeVisible();
  if (observation) {
    await page.locator("#moderator-observation").fill(observation);
  }
  await page.locator("#save-advance").click();
}
