import { CONDITION_BY_ID } from "./constants.js";
import {
  createObservation,
  exportCsv,
  exportJson,
  resultExport,
  summarizeObservations,
  validateAnonymousParticipantCode,
} from "./results.js";
import { decodeQrImageData } from "./qr.js";
import { bytesToHex } from "./representations.js";
import {
  activeTask,
  clearStudyState,
  emptyStudyState,
  resetTaskResponse,
} from "./state.js";
import {
  createInteractiveStudySeed,
  generateInteractiveStudyTasks,
} from "./task-generator.js";
import { renderRepresentation } from "./view.js";

const ids = [
  "global-status",
  "global-error",
  "setup-view",
  "participant-code",
  "condition-selection",
  "task-order",
  "create-session",
  "moderator-view",
  "session-summary",
  "task-summary",
  "answer-key",
  "ground-truth",
  "mismatch-detail",
  "moderator-reference-area",
  "moderator-reference",
  "spoken-instruction",
  "pending-outcome",
  "outcome-text",
  "repeat-count",
  "moderator-observation",
  "show-participant",
  "save-advance",
  "clear-session",
  "export-area",
  "export-summary",
  "review-export",
  "export-confirmation",
  "confirm-export",
  "download-json",
  "download-csv",
  "participant-view",
  "participant-task-summary",
  "participant-instruction",
  "reference-card",
  "participant-reference",
  "participant-comparison",
  "qr-study-control",
  "run-qr-comparison",
  "qr-comparison-status",
  "pause-task",
];

const elements = Object.fromEntries(
  ids.map((id) => {
    const element = document.getElementById(id);
    if (!element) {
      throw new Error(`missing Milestone 2B study element: ${id}`);
    }
    return [id, element];
  }),
);

let state = emptyStudyState();

function currentCondition() {
  const task = activeTask(state);
  return task ? CONDITION_BY_ID[task.conditionId] : null;
}

function setView(view) {
  state.view = view;
  render();
}

function renderSetup() {
  elements["setup-view"].hidden = state.view !== "setup";
}

function renderModerator() {
  const visible = state.view === "moderator";
  elements["moderator-view"].hidden = !visible;
  if (!visible) {
    return;
  }

  const task = activeTask(state);
  elements["session-summary"].textContent =
    `Anonymous code ${state.participantCode} · session ${state.sessionId} · ` +
    `${state.observations.length} saved observation(s)`;

  if (!task) {
    elements["task-summary"].textContent =
      `Session complete: ${state.tasks.length} of ${state.tasks.length} tasks.`;
    elements["answer-key"].hidden = true;
    elements["moderator-reference-area"].hidden = true;
    elements["pending-outcome"].hidden = true;
    elements["repeat-count"].disabled = true;
    elements["moderator-observation"].disabled = true;
    elements["show-participant"].hidden = true;
    elements["save-advance"].hidden = true;
    elements["export-area"].hidden = false;
    const summary = summarizeObservations(state.observations);
    elements["export-summary"].textContent =
      `${summary.total} anonymous observation(s); ${summary.falseAccepts} false accept(s); ` +
      `${summary.falseRejects} false reject(s); ${summary.unsure} unsure response(s).`;
    elements["export-confirmation"].hidden = !state.exportReviewVisible;
    elements["confirm-export"].checked = state.exportConfirmed;
    elements["download-json"].disabled = !state.exportConfirmed;
    elements["download-csv"].disabled = !state.exportConfirmed;
    return;
  }

  const position = state.taskIndex + 1;
  elements["task-summary"].textContent =
    `Task ${position} of ${state.tasks.length} · ${task.conditionLabel} · ` +
    `${task.displayedBits} displayed bits`;
  elements["answer-key"].hidden = false;
  elements["moderator-reference-area"].hidden = false;
  elements["ground-truth"].textContent =
    `Ground truth: ${task.groundTruth.toUpperCase()}`;
  elements["mismatch-detail"].textContent =
    task.groundTruth === "match"
      ? "Exact task: reference and comparison stimuli are identical."
      : `Controlled mismatch: ${task.mismatchType}; ${task.mismatchPosition}.`;
  renderRepresentation(
    elements["moderator-reference"],
    task.reference,
    "Moderator reference",
  );

  const spoken = currentCondition()?.kind === "spoken";
  elements["spoken-instruction"].hidden = !spoken;
  elements["repeat-count"].disabled = !spoken;
  elements["moderator-observation"].disabled = false;
  elements["pending-outcome"].hidden = !state.pendingResponse;
  elements["show-participant"].hidden = Boolean(state.pendingResponse);
  elements["save-advance"].hidden = !state.pendingResponse;
  elements["export-area"].hidden = true;

  if (state.pendingResponse) {
    const response = state.pendingResponse.response;
    const correct = response === task.groundTruth;
    elements["outcome-text"].textContent =
      `Participant answered ${response.toUpperCase()}. ` +
      `${response === "unsure" ? "Recorded as unsure." : correct ? "The response matches the task ground truth." : "The response does not match the task ground truth."}`;
  }
}

function renderParticipant() {
  const visible = state.view === "participant";
  elements["participant-view"].hidden = !visible;
  if (!visible) {
    return;
  }

  const task = activeTask(state);
  if (!task) {
    throw new Error("participant view requires an active task");
  }
  const condition = currentCondition();
  elements["participant-task-summary"].textContent =
    `${task.conditionLabel} · ${task.displayedBits} displayed bits · ` +
    `task ${state.taskIndex + 1} of ${state.tasks.length}`;

  if (condition.kind === "spoken") {
    elements["participant-instruction"].textContent =
      "Listen to the moderator read the numbered reference labels, then compare the entire spoken sequence with the numbered list below.";
    elements["reference-card"].hidden = true;
    elements["participant-reference"].replaceChildren();
  } else {
    elements["reference-card"].hidden = false;
    elements["participant-instruction"].textContent =
      condition.kind === "qr"
        ? "These locally generated QR images carry all 256 synthetic bits. This no-camera harness is technical instrumentation; use the complete text fallback only if needed and do not compare QR shapes by eye."
        : "Compare every numbered item in order before answering. Do not check only the beginning or end.";
    renderRepresentation(
      elements["participant-reference"],
      task.reference,
      "Reference",
    );
  }
  renderRepresentation(
    elements["participant-comparison"],
    task.comparison,
    "Comparison",
  );

  const qrCondition = condition.kind === "qr";
  elements["qr-study-control"].hidden = !qrCondition;
  elements["qr-comparison-status"].textContent = state.qrDecoderResult;
  updateParticipantResponseAvailability();

  for (const input of document.querySelectorAll('input[name="confidence"]')) {
    input.checked = false;
  }
}

function render() {
  elements["global-status"].textContent = state.status;
  elements["global-error"].textContent = state.error;
  renderSetup();
  renderModerator();
  renderParticipant();
}

function selectedConditionIds() {
  return Array.from(
    elements["condition-selection"].querySelectorAll(
      'input[type="checkbox"]:checked',
    ),
    (input) => input.value,
  );
}

function updateParticipantResponseAvailability() {
  const qrWaiting = currentCondition()?.kind === "qr" && !state.qrComparisonRun;
  for (const button of document.querySelectorAll("[data-response]")) {
    button.disabled = qrWaiting && button.dataset.response !== "unsure";
  }
}

elements["create-session"].addEventListener("click", () => {
  try {
    const participantCode = elements["participant-code"].value.trim();
    validateAnonymousParticipantCode(participantCode);
    const conditionIds = selectedConditionIds();
    const seed = createInteractiveStudySeed();
    const tasks = generateInteractiveStudyTasks({
      conditionIds,
      orderSeed: seed,
      randomize: elements["task-order"].value === "random",
    });

    state = emptyStudyState();
    state.participantCode = participantCode;
    state.sessionId = `S-${seed.slice(0, 12)}`;
    state.tasks = tasks;
    state.view = "moderator";
    state.status = `Synthetic session created with ${tasks.length} task(s). No data has been saved or uploaded.`;
    render();
  } catch (error) {
    state.error =
      error instanceof Error ? error.message : "Study setup failed.";
    render();
  }
});

elements["show-participant"].addEventListener("click", () => {
  if (!activeTask(state) || state.pendingResponse) {
    return;
  }
  state.error = "";
  state.status =
    "Participant task timing started with a local monotonic timer.";
  state.taskStartedAt = performance.now();
  state.qrComparisonRun = false;
  state.qrDecoderResult = "";
  setView("participant");
});

async function decodeImageElement(image) {
  if (!image.complete || image.naturalWidth === 0) {
    await new Promise((resolve, reject) => {
      image.addEventListener("load", resolve, { once: true });
      image.addEventListener("error", reject, { once: true });
    });
  }
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0);
  return decodeQrImageData(
    context.getImageData(0, 0, canvas.width, canvas.height),
  );
}

elements["run-qr-comparison"].addEventListener("click", async () => {
  const images = elements["participant-view"].querySelectorAll(".qr-image");
  if (images.length !== 2 || currentCondition()?.kind !== "qr") {
    return;
  }
  elements["run-qr-comparison"].disabled = true;
  let decodedBothImages = false;
  try {
    const [reference, comparison] = await Promise.all(
      Array.from(images, (image) => decodeImageElement(image)),
    );
    state.qrDecoderResult =
      bytesToHex(reference) === bytesToHex(comparison)
        ? "Local decoder result: MATCH. This result does not prove human identity."
        : "Local decoder result: MISMATCH. Do not verify this synthetic relationship.";
    decodedBothImages = true;
  } catch {
    state.qrDecoderResult =
      "Local decoder could not compare the generated images. Respond Unsure or pause the task.";
  } finally {
    state.qrComparisonRun = decodedBothImages;
    elements["run-qr-comparison"].disabled = false;
    elements["qr-comparison-status"].textContent = state.qrDecoderResult;
    updateParticipantResponseAvailability();
  }
});

elements["pause-task"].addEventListener("click", () => {
  state.taskStartedAt = null;
  state.status =
    "Task paused without recording a response. Starting it again restarts the timer.";
  setView("moderator");
});

for (const button of document.querySelectorAll("[data-response]")) {
  button.addEventListener("click", () => {
    if (state.view !== "participant" || state.taskStartedAt === null) {
      return;
    }
    const confidenceInput = document.querySelector(
      'input[name="confidence"]:checked',
    );
    state.pendingResponse = {
      response: button.dataset.response,
      confidence: confidenceInput ? Number(confidenceInput.value) : null,
      startedAt: state.taskStartedAt,
      endedAt: performance.now(),
    };
    state.taskStartedAt = null;
    state.status =
      "Participant response captured in memory. The moderator must save or clear it explicitly.";
    setView("moderator");
  });
}

elements["save-advance"].addEventListener("click", () => {
  try {
    const task = activeTask(state);
    if (!task || !state.pendingResponse) {
      throw new Error("there is no pending participant response");
    }
    const repeatCount =
      currentCondition().kind === "spoken"
        ? Number(elements["repeat-count"].value)
        : 0;
    const observation = createObservation({
      participantCode: state.participantCode,
      sessionId: state.sessionId,
      task,
      ...state.pendingResponse,
      repeatCount,
      moderatorObservation: elements["moderator-observation"].value,
    });
    state.observations.push(observation);
    state.taskIndex += 1;
    resetTaskResponse(state);
    elements["repeat-count"].value = "0";
    elements["moderator-observation"].value = "";
    state.status = activeTask(state)
      ? "Anonymous observation held in memory; ready for the next task."
      : "All selected tasks are complete. Review before any explicit local export.";
    state.error = "";
    render();
  } catch (error) {
    state.error =
      error instanceof Error ? error.message : "Observation failed.";
    render();
  }
});

elements["clear-session"].addEventListener("click", () => {
  clearStudyState(state);
  elements["participant-code"].value = "P01";
  elements["repeat-count"].value = "0";
  elements["moderator-observation"].value = "";
  state.status =
    "Study session cleared from the interface. Reliable browser or operating-system memory erasure is not claimed.";
  render();
});

elements["review-export"].addEventListener("click", () => {
  state.exportReviewVisible = true;
  state.exportConfirmed = false;
  state.status =
    "Export summary shown. No file is created until the moderator confirms and chooses a download.";
  render();
});

elements["confirm-export"].addEventListener("change", (event) => {
  state.exportConfirmed = event.currentTarget.checked;
  render();
});

function currentExport() {
  if (!state.exportConfirmed || activeTask(state)) {
    throw new Error("explicit export confirmation is required after all tasks");
  }
  return resultExport({
    participantCode: state.participantCode,
    sessionId: state.sessionId,
    observations: state.observations,
  });
}

function downloadText(filename, text, mediaType) {
  const url = URL.createObjectURL(new Blob([text], { type: mediaType }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

elements["download-json"].addEventListener("click", () => {
  const exportValue = currentExport();
  downloadText(
    `cipherbook-m2b-${state.sessionId}-${state.participantCode}.json`,
    exportJson(exportValue),
    "application/json",
  );
  state.status =
    "Anonymous JSON observations downloaded locally by explicit action.";
  render();
});

elements["download-csv"].addEventListener("click", () => {
  const exportValue = currentExport();
  downloadText(
    `cipherbook-m2b-${state.sessionId}-${state.participantCode}.csv`,
    exportCsv(exportValue),
    "text/csv",
  );
  state.status =
    "Anonymous CSV observations downloaded locally by explicit action.";
  render();
});

globalThis.addEventListener("pagehide", () => {
  clearStudyState(state);
});

render();
