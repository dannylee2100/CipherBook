import assert from "node:assert/strict";
import { test } from "node:test";

import {
  createObservation,
  exportCsv,
  exportFieldNames,
  exportJson,
  resultExport,
} from "../src/results.js";
import { createStudyTask, MISMATCH_TYPES } from "../src/task-generator.js";

const sessionId = "S-001122334455";
const participantCode = "P01";
const matchTask = createStudyTask({
  conditionId: "hex-96",
  seed: "results-match",
});
const mismatchTask = createStudyTask({
  conditionId: "words-96",
  mismatchType: MISMATCH_TYPES.SUBSTITUTION_MIDDLE,
  seed: "results-mismatch",
});

function observation(task, response, extra = {}) {
  return createObservation({
    participantCode,
    sessionId,
    task,
    response,
    startedAt: 100.25,
    endedAt: 345.75,
    ...extra,
  });
}

test("result recording classifies correct match and correct mismatch", () => {
  assert.equal(observation(matchTask, "match").correct, true);
  assert.equal(observation(mismatchTask, "mismatch").correct, true);
});

test("result recording classifies false accept, false reject, and unsure", () => {
  const falseAccept = observation(mismatchTask, "match");
  const falseReject = observation(matchTask, "mismatch");
  const unsure = observation(matchTask, "unsure");
  assert.equal(falseAccept.falseAccept, true);
  assert.equal(falseReject.falseReject, true);
  assert.equal(unsure.unsure, true);
  assert.equal(unsure.correct, false);
});

test("timing, confidence, repeat count, and observation are bounded fields", () => {
  const value = observation(mismatchTask, "mismatch", {
    confidence: 3,
    repeatCount: 2,
    moderatorObservation: "Participant requested one label repeated twice.",
  });
  assert.equal(value.completionMilliseconds, 246);
  assert.equal(value.confidence, 3);
  assert.equal(value.repeatCount, 2);
  assert.match(value.moderatorObservation, /repeated twice/u);
  assert.throws(() => observation(matchTask, "match", { confidence: 9 }));
  assert.throws(() => observation(matchTask, "match", { repeatCount: -1 }));
});

test("anonymous participant code cannot be a name-like free-form value", () => {
  assert.throws(() =>
    createObservation({
      participantCode: "Alice",
      sessionId,
      task: matchTask,
      response: "match",
      startedAt: 1,
      endedAt: 2,
    }),
  );
});

test("JSON and CSV exports contain observations but no stimuli", () => {
  const observations = [
    { ...observation(matchTask, "match"), injectedStimulus: "must not export" },
  ];
  const exported = resultExport({ participantCode, sessionId, observations });
  const json = exportJson(exported);
  const csv = exportCsv(exported);
  assert.match(json, /anonymousParticipantCode/u);
  assert.match(csv, /^harnessVersion,/u);
  assert.doesNotMatch(json, /digestHex|reference|comparison|seed/u);
  assert.doesNotMatch(json, /injectedStimulus|must not export/u);
  assert.doesNotMatch(csv, /digestHex|reference|comparison|seed/u);
});

test("CSV export neutralizes spreadsheet-formula prefixes", () => {
  const observations = [
    observation(matchTask, "match", {
      moderatorObservation: '=HYPERLINK("https://invalid.example","synthetic")',
    }),
  ];
  const csv = exportCsv(
    resultExport({ participantCode, sessionId, observations }),
  );
  assert.match(csv, /'=HYPERLINK/u);
  assert.doesNotMatch(csv, /,"=HYPERLINK/u);
});

test("export schema contains only the documented observation fields", () => {
  const forbidden = new Set([
    "name",
    "email",
    "phone",
    "employer",
    "account",
    "ipAddress",
    "deviceFingerprint",
    "privateKey",
    "publicContact",
    "digest",
    "message",
    "clipboard",
    "audio",
    "image",
  ]);
  for (const field of exportFieldNames()) {
    assert.equal(forbidden.has(field), false, field);
  }
});
