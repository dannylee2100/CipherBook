import {
  CONDITION_BY_ID,
  DIGEST_BYTES,
  QR_TECHNICAL_DEFINITION,
} from "./constants.js";
import {
  createObservation,
  exportCsv,
  exportJson,
  resultExport,
  summarizeObservations,
  validateAnonymousParticipantCode,
} from "./results.js";
import { decodeQrImageData } from "./qr.js";
import { bytesToHex, representationFor } from "./representations.js";
import {
  activeTask,
  clearStudyState,
  emptyStudyState,
  resetTaskResponse,
} from "./state.js";
import {
  createRandomStudyBytes,
  createTaskSetSeedForArm,
  generateStudyPlan,
} from "./task-generator.js";
import { renderRepresentation } from "./view.js";

const NEUTRAL_PARTICIPANT_INSTRUCTION =
  "Decide whether the two displayed values match. Answer Match, Mismatch, or Unsure.";

const ids = [
  "global-status",
  "global-error",
  "setup-view",
  "participant-code",
  "study-arm",
  "create-session",
  "run-qr-demo",
  "qr-demo-output",
  "qr-demo-representation",
  "qr-demo-status",
  "moderator-view",
  "session-summary",
  "task-summary",
  "answer-key",
  "moderator-reference-area",
  "moderator-reference",
  "spoken-instruction",
  "pending-outcome",
  "outcome-text",
  "observation-area",
  "repeat-area",
  "repeat-count",
  "moderator-observation",
  "show-participant",
  "save-advance",
  "clear-session",
  "export-area",
  "export-summary",
  "review-export",
  "export-confirmation",
  "export-note-preview",
  "export-note-list",
  "confirm-export",
  "download-json",
  "download-csv",
  "participant-view",
  "participant-task-summary",
  "participant-instruction",
  "spoken-participant-context",
  "reference-card",
  "participant-reference",
  "participant-comparison",
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

function clearAnswerKey() {
  elements["answer-key"].hidden = true;
  elements["answer-key"].replaceChildren();
}

function revealAnswerKey(task) {
  const heading = document.createElement("h3");
  heading.textContent = "Answer key — revealed after the recorded response";
  const groundTruth = document.createElement("p");
  groundTruth.id = "ground-truth";
  groundTruth.textContent = `Ground truth: ${task.groundTruth.toUpperCase()}`;
  const mismatchDetail = document.createElement("p");
  mismatchDetail.id = "mismatch-detail";
  mismatchDetail.textContent =
    task.groundTruth === "match"
      ? "Exact task: reference and comparison stimuli are identical."
      : `Controlled mismatch: ${task.mismatchType}; ${task.mismatchPosition}.`;
  elements["answer-key"].replaceChildren(heading, groundTruth, mismatchDetail);
  elements["answer-key"].hidden = false;
}

function renderObservationPreview() {
  elements["export-note-list"].replaceChildren(
    ...state.observations.map((observation) => {
      const item = document.createElement("li");
      const note = observation.moderatorObservation || "[no observation text]";
      item.textContent = `${observation.taskId}: ${note}`;
      return item;
    }),
  );
}

function renderModerator() {
  const visible = state.view === "moderator";
  elements["moderator-view"].hidden = !visible;
  if (!visible) {
    return;
  }

  const task = activeTask(state);
  elements["session-summary"].textContent =
    `Anonymous code ${state.participantCode} · arm ${state.studyArm} · ` +
    `${state.observations.length} saved observation(s)`;

  if (!task) {
    elements["task-summary"].textContent =
      `Session complete: ${state.tasks.length} of ${state.tasks.length} tasks.`;
    clearAnswerKey();
    elements["moderator-reference-area"].hidden = true;
    elements["moderator-reference"].replaceChildren();
    elements["pending-outcome"].hidden = true;
    elements["observation-area"].hidden = true;
    elements["repeat-count"].disabled = true;
    elements["moderator-observation"].disabled = true;
    elements["show-participant"].hidden = true;
    elements["save-advance"].hidden = true;
    elements["export-area"].hidden = false;
    const summary = summarizeObservations(state.observations);
    elements["export-summary"].textContent =
      `${summary.total} anonymous manual-task observation(s); ${summary.falseAccepts} false accept(s); ` +
      `${summary.falseRejects} false reject(s); ${summary.unsure} unsure response(s).`;
    elements["export-confirmation"].hidden = !state.exportReviewVisible;
    elements["export-note-preview"].hidden = !state.exportReviewVisible;
    if (state.exportReviewVisible) {
      renderObservationPreview();
    }
    elements["confirm-export"].checked = state.exportConfirmed;
    elements["download-json"].disabled = !state.exportConfirmed;
    elements["download-csv"].disabled = !state.exportConfirmed;
    return;
  }

  const position = state.taskIndex + 1;
  const spoken = currentCondition()?.kind === "spoken";
  const responseRecorded = Boolean(state.pendingResponse);
  elements["task-summary"].textContent =
    `Task ${position} of ${state.tasks.length} · ${task.conditionLabel} · ` +
    `${task.displayedBits} displayed bits`;

  if (responseRecorded) {
    revealAnswerKey(task);
  } else {
    clearAnswerKey();
  }

  elements["moderator-reference-area"].hidden = !spoken;
  elements["spoken-instruction"].hidden = !spoken;
  if (spoken) {
    renderRepresentation(
      elements["moderator-reference"],
      task.reference,
      "Moderator reference",
    );
  } else {
    elements["moderator-reference"].replaceChildren();
  }

  elements["pending-outcome"].hidden = !responseRecorded;
  elements["observation-area"].hidden = !responseRecorded;
  elements["repeat-area"].hidden = !responseRecorded || !spoken;
  elements["repeat-count"].disabled = !responseRecorded || !spoken;
  elements["moderator-observation"].disabled = !responseRecorded;
  elements["show-participant"].hidden = responseRecorded;
  elements["save-advance"].hidden = !responseRecorded;
  elements["export-area"].hidden = true;

  if (state.pendingResponse) {
    const response = state.pendingResponse.response;
    const correct = response === task.groundTruth;
    elements["outcome-text"].textContent =
      `Participant answered ${response.toUpperCase()}. ` +
      `${response === "unsure" ? "Recorded as unsure." : correct ? "The response matches the task ground truth." : "The response does not match the task ground truth."}`;
  } else {
    elements["outcome-text"].textContent = "";
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
  elements["participant-instruction"].textContent =
    NEUTRAL_PARTICIPANT_INSTRUCTION;

  const spoken = condition.kind === "spoken";
  elements["spoken-participant-context"].hidden = !spoken;
  elements["reference-card"].hidden = spoken;
  if (spoken) {
    elements["participant-reference"].replaceChildren();
  } else {
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

  for (const button of document.querySelectorAll("[data-response]")) {
    button.disabled = false;
  }
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
  if (!context) {
    throw new Error("QR technical demonstration requires a 2D canvas context");
  }
  context.drawImage(image, 0, 0);
  return decodeQrImageData(
    context.getImageData(0, 0, canvas.width, canvas.height),
  );
}

elements["run-qr-demo"].addEventListener("click", async () => {
  elements["run-qr-demo"].disabled = true;
  elements["qr-demo-output"].hidden = true;
  elements["qr-demo-status"].textContent = "";
  try {
    const digest = createRandomStudyBytes(DIGEST_BYTES);
    const representation = representationFor(
      QR_TECHNICAL_DEFINITION.id,
      digest,
    );
    renderRepresentation(
      elements["qr-demo-representation"],
      representation,
      "Technical demonstration",
    );
    elements["qr-demo-output"].hidden = false;
    const image = elements["qr-demo-representation"].querySelector(".qr-image");
    const decoded = await decodeImageElement(image);
    if (bytesToHex(decoded) !== bytesToHex(digest)) {
      throw new Error("local QR decoder returned different synthetic bytes");
    }
    elements["qr-demo-status"].textContent =
      "Technical result: the generated image decoded to the exact 256 synthetic bits. No participant metric was recorded.";
  } catch (error) {
    elements["qr-demo-output"].hidden = false;
    elements["qr-demo-status"].textContent =
      error instanceof Error
        ? `Technical QR demonstration failed: ${error.message}`
        : "Technical QR demonstration failed.";
  } finally {
    elements["run-qr-demo"].disabled = false;
  }
});

elements["create-session"].addEventListener("click", async () => {
  elements["create-session"].disabled = true;
  try {
    const participantCode = elements["participant-code"].value.trim();
    const studyArm = elements["study-arm"].value;
    validateAnonymousParticipantCode(participantCode);
    const taskSetSeed = await createTaskSetSeedForArm(studyArm);
    const studyPlan = await generateStudyPlan({ taskSetSeed, studyArm });

    state = emptyStudyState();
    state.participantCode = participantCode;
    state.sessionId = `S-${taskSetSeed.slice(0, 12)}`;
    state.studyPlanVersion = studyPlan.studyPlanVersion;
    state.studyArm = studyPlan.studyArm;
    state.taskSetSeed = studyPlan.taskSetSeed;
    state.tasks = studyPlan.tasks;
    state.view = "moderator";
    state.status =
      `Synthetic arm ${studyArm} session created with ${studyPlan.tasks.length} manual task(s). ` +
      "No data has been saved or uploaded.";
    render();
  } catch (error) {
    state.error =
      error instanceof Error ? error.message : "Study setup failed.";
    render();
  } finally {
    elements["create-session"].disabled = false;
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
  setView("participant");
});

elements["pause-task"].addEventListener("click", () => {
  state.taskStartedAt = null;
  state.status =
    "Task paused without recording a response. Starting it again restarts the timer.";
  setView("moderator");
});

for (const button of document.querySelectorAll("[data-response]")) {
  button.addEventListener("click", () => {
    if (
      state.view !== "participant" ||
      state.taskStartedAt === null ||
      state.pendingResponse
    ) {
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
      "Participant response captured in memory and cannot be changed after answer-key reveal.";
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
      studyPlanVersion: state.studyPlanVersion,
      studyArm: state.studyArm,
      taskSetSeed: state.taskSetSeed,
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
      : "All planned manual tasks are complete. Review every note before any explicit local export.";
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
  elements["study-arm"].value = "A";
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
    "Export summary and every observation note are shown. No file is created until confirmation and an explicit download choice.";
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
    studyPlanVersion: state.studyPlanVersion,
    studyArm: state.studyArm,
    taskSetSeed: state.taskSetSeed,
    tasks: state.tasks,
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
