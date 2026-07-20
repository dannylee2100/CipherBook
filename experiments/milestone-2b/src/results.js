import {
  ANONYMOUS_CODE_PATTERN,
  PARTICIPANT_RESPONSES,
  STUDY_HARNESS_VERSION,
} from "./constants.js";

export const EXPORT_FORMAT = "M2B-ANONYMOUS-OBSERVATIONS-EXPERIMENT-UNSTABLE";

const CSV_FIELDS = Object.freeze([
  "harnessVersion",
  "anonymousParticipantCode",
  "sessionId",
  "taskId",
  "condition",
  "displayedBits",
  "groundTruth",
  "mismatchType",
  "mismatchPosition",
  "participantResponse",
  "correct",
  "falseAccept",
  "falseReject",
  "unsure",
  "completionMilliseconds",
  "confidence",
  "repeatCount",
  "moderatorObservation",
]);

function requireText(value, field, maximum = 80) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > maximum ||
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(value)
  ) {
    throw new Error(`${field} is invalid`);
  }
  return value;
}

export function validateAnonymousParticipantCode(code) {
  if (!ANONYMOUS_CODE_PATTERN.test(code)) {
    throw new Error("anonymous participant code must look like P01");
  }
  return code;
}

export function createObservation({
  participantCode,
  sessionId,
  task,
  response,
  startedAt,
  endedAt,
  confidence = null,
  repeatCount = 0,
  moderatorObservation = "",
}) {
  validateAnonymousParticipantCode(participantCode);
  requireText(sessionId, "session ID");
  if (!task || typeof task !== "object") {
    throw new Error("a study task is required");
  }
  if (!PARTICIPANT_RESPONSES.includes(response)) {
    throw new Error("participant response is invalid");
  }
  if (
    !Number.isFinite(startedAt) ||
    !Number.isFinite(endedAt) ||
    endedAt < startedAt
  ) {
    throw new Error("task timing is invalid");
  }
  if (confidence !== null && ![1, 2, 3].includes(confidence)) {
    throw new Error("confidence must be empty or between 1 and 3");
  }
  if (!Number.isInteger(repeatCount) || repeatCount < 0 || repeatCount > 99) {
    throw new Error("repeat count must be an integer from 0 through 99");
  }
  if (
    typeof moderatorObservation !== "string" ||
    moderatorObservation.length > 240
  ) {
    throw new Error("moderator observation must be at most 240 characters");
  }

  const groundTruth = task.groundTruth;
  const unsure = response === "unsure";
  return Object.freeze({
    harnessVersion: STUDY_HARNESS_VERSION,
    anonymousParticipantCode: participantCode,
    sessionId,
    taskId: requireText(task.taskId, "task ID"),
    condition: requireText(task.conditionId, "condition"),
    displayedBits: task.displayedBits,
    groundTruth,
    mismatchType: task.mismatchType,
    mismatchPosition: task.mismatchPosition,
    participantResponse: response,
    correct: response === groundTruth,
    falseAccept: groundTruth === "mismatch" && response === "match",
    falseReject: groundTruth === "match" && response === "mismatch",
    unsure,
    completionMilliseconds: Math.round(endedAt - startedAt),
    confidence,
    repeatCount,
    moderatorObservation: moderatorObservation.trim(),
  });
}

export function resultExport({ participantCode, sessionId, observations }) {
  validateAnonymousParticipantCode(participantCode);
  requireText(sessionId, "session ID");
  if (!Array.isArray(observations)) {
    throw new Error("observations must be an array");
  }
  for (const observation of observations) {
    if (
      observation.anonymousParticipantCode !== participantCode ||
      observation.sessionId !== sessionId
    ) {
      throw new Error("observation does not belong to this anonymous session");
    }
  }
  const sanitized = observations.map((item) =>
    Object.fromEntries(CSV_FIELDS.map((field) => [field, item[field]])),
  );
  return Object.freeze({
    format: EXPORT_FORMAT,
    warning:
      "Anonymous synthetic study observations only; downloaded files remain on this device.",
    harnessVersion: STUDY_HARNESS_VERSION,
    anonymousParticipantCode: participantCode,
    sessionId,
    observations: Object.freeze(sanitized),
  });
}

export function summarizeObservations(observations) {
  return Object.freeze({
    total: observations.length,
    falseAccepts: observations.filter((item) => item.falseAccept).length,
    falseRejects: observations.filter((item) => item.falseReject).length,
    unsure: observations.filter((item) => item.unsure).length,
  });
}

export function exportJson(exportValue) {
  return `${JSON.stringify(exportValue, null, 2)}\n`;
}

function csvCell(value) {
  if (value === null || value === undefined) {
    return "";
  }
  const raw = String(value);
  const text = /^[\t\r ]*[=+\-@]/u.test(raw) ? `'${raw}` : raw;
  return /[",\r\n]/u.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function exportCsv(exportValue) {
  const rows = [CSV_FIELDS.join(",")];
  for (const observation of exportValue.observations) {
    rows.push(CSV_FIELDS.map((field) => csvCell(observation[field])).join(","));
  }
  return `${rows.join("\n")}\n`;
}

export function exportFieldNames() {
  return CSV_FIELDS;
}
