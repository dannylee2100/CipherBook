import assert from "node:assert/strict";
import { test } from "node:test";

import { STUDY_PLAN_VERSION } from "../src/constants.js";
import {
  createObservation,
  exportCsv,
  exportFieldNames,
  exportJson,
  resultExport,
} from "../src/results.js";
import { deriveStudyArm, generateStudyPlan } from "../src/task-generator.js";

async function seedForArm(wantedArm) {
  for (let candidate = 0; candidate < 1_000; candidate += 1) {
    const seed = (candidate + 20_000).toString(16).padStart(32, "0");
    if ((await deriveStudyArm(seed)) === wantedArm) {
      return seed;
    }
  }
  throw new Error(`could not find deterministic seed for arm ${wantedArm}`);
}

const participantCode = "P01";
const sessionId = "S-001122334455";
const studyArm = "A";
const taskSetSeed = await seedForArm(studyArm);
const plan = await generateStudyPlan({ taskSetSeed, studyArm });
const matchTask = plan.tasks.find((task) => task.groundTruth === "match");
const mismatchTask = plan.tasks.find((task) => task.groundTruth === "mismatch");

function observation(task, response, extra = {}) {
  return createObservation({
    participantCode,
    sessionId,
    studyPlanVersion: STUDY_PLAN_VERSION,
    studyArm,
    taskSetSeed,
    task,
    response,
    startedAt: 100.25,
    endedAt: 345.75,
    ...extra,
  });
}

function completeObservations(overrides = new Map()) {
  return plan.tasks.map((task) =>
    observation(
      task,
      overrides.get(task.taskId)?.response ?? task.groundTruth,
      overrides.get(task.taskId)?.extra,
    ),
  );
}

function completeExport(observations = completeObservations()) {
  return resultExport({
    participantCode,
    sessionId,
    studyPlanVersion: STUDY_PLAN_VERSION,
    studyArm,
    taskSetSeed,
    tasks: plan.tasks,
    observations,
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
  assert.throws(() =>
    observation(matchTask, "match", {
      moderatorObservation: "x".repeat(241),
    }),
  );
});

test("anonymous participant code cannot be a name-like free-form value", () => {
  assert.throws(() =>
    createObservation({
      participantCode: "Alice",
      sessionId,
      studyPlanVersion: STUDY_PLAN_VERSION,
      studyArm,
      taskSetSeed,
      task: matchTask,
      response: "match",
      startedAt: 1,
      endedAt: 2,
    }),
  );
});

test("JSON and CSV include reproducible plan identifiers but no stimuli", () => {
  const exported = completeExport();
  const json = exportJson(exported);
  const csv = exportCsv(exported);
  assert.match(json, /"studyPlanVersion"/u);
  assert.match(json, /"studyArm": "A"/u);
  assert.match(json, new RegExp(taskSetSeed, "u"));
  assert.match(csv, /^harnessVersion,studyPlanVersion,studyArm,taskSetSeed,/u);
  assert.doesNotMatch(json, /digestHex|"reference"|"comparison"/u);
  assert.doesNotMatch(csv, /digestHex|reference|comparison/u);
});

test("exported seed, arm, and task IDs reconstruct every observed task", async () => {
  const exported = completeExport();
  const reconstructed = await generateStudyPlan({
    taskSetSeed: exported.taskSetSeed,
    studyArm: exported.studyArm,
  });
  const reconstructedById = new Map(
    reconstructed.tasks.map((task) => [task.taskId, task]),
  );
  for (const recorded of exported.observations) {
    const task = reconstructedById.get(recorded.taskId);
    assert.ok(task, recorded.taskId);
    assert.equal(recorded.condition, task.conditionId);
    assert.equal(recorded.groundTruth, task.groundTruth);
    assert.equal(recorded.mismatchType, task.mismatchType);
    assert.equal(recorded.mismatchPosition, task.mismatchPosition);
  }
});

test("export rejects missing, duplicated, or altered task observations", () => {
  const observations = completeObservations();
  assert.throws(() => completeExport(observations.slice(1)));
  assert.throws(() =>
    completeExport([
      observations[0],
      observations[0],
      ...observations.slice(2),
    ]),
  );
  const altered = observations.map((item, index) =>
    index === 0 ? { ...item, mismatchPosition: "entry 999" } : item,
  );
  assert.throws(() => completeExport(altered));
});

test("CSV export neutralizes spreadsheet-formula prefixes", () => {
  const overrides = new Map([
    [
      plan.tasks[0].taskId,
      {
        response: plan.tasks[0].groundTruth,
        extra: {
          moderatorObservation:
            '=HYPERLINK("https://invalid.example","synthetic")',
        },
      },
    ],
  ]);
  const csv = exportCsv(completeExport(completeObservations(overrides)));
  assert.match(csv, /'=HYPERLINK/u);
  assert.doesNotMatch(csv, /,"=HYPERLINK/u);
});

test("export schema contains no prohibited personal or real-cryptographic fields", () => {
  const forbidden = new Set([
    "name",
    "email",
    "phone",
    "employer",
    "account",
    "ipAddress",
    "networkIdentifier",
    "deviceFingerprint",
    "demographics",
    "privateKey",
    "publicKey",
    "publicContact",
    "realRelationshipValue",
    "message",
    "clipboard",
    "audio",
    "image",
  ]);
  for (const field of exportFieldNames()) {
    assert.equal(forbidden.has(field), false, field);
  }
});
