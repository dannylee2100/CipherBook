import assert from "node:assert/strict";
import { test } from "node:test";

import {
  MANUAL_CONDITION_DEFINITIONS,
  STUDY_ARMS,
  STUDY_PLAN_VERSION,
  TASKS_PER_MANUAL_CONDITION,
} from "../src/constants.js";
import { CANDIDATE_VISUAL_CONFUSION_PAIRS } from "../src/emoji-table.js";
import {
  createStudyTask,
  deriveStudyArm,
  generateStudyPlan,
  mismatchTypesForCondition,
  MISMATCH_TYPES,
  studyPlanDefinitionsForArm,
} from "../src/task-generator.js";

async function collectValidSeeds(perArm = 2) {
  const collected = Object.fromEntries(STUDY_ARMS.map((arm) => [arm, []]));
  for (let candidate = 0; candidate < 10_000; candidate += 1) {
    const seed = candidate.toString(16).padStart(32, "0");
    const arm = await deriveStudyArm(seed);
    if (collected[arm].length < perArm) {
      collected[arm].push(seed);
    }
    if (STUDY_ARMS.every((item) => collected[item].length === perArm)) {
      return collected;
    }
  }
  throw new Error("could not collect deterministic study seeds for every arm");
}

const seedsByArm = await collectValidSeeds();
const completeArmPlans = await Promise.all(
  STUDY_ARMS.map((studyArm) =>
    generateStudyPlan({ taskSetSeed: seedsByArm[studyArm][0], studyArm }),
  ),
);

function values(representation) {
  return representation.items.map(
    (item) => item.index ?? item.group ?? item.label,
  );
}

function conditionTasks(plan, conditionId) {
  return plan.tasks.filter((task) => task.conditionId === conditionId);
}

const SUBSTITUTION_TYPES = [
  MISMATCH_TYPES.SUBSTITUTION_BEGINNING,
  MISMATCH_TYPES.SUBSTITUTION_MIDDLE,
  MISMATCH_TYPES.SUBSTITUTION_END,
];

test("every arm has four tasks per condition without one match versus every mismatch class", () => {
  for (const plan of completeArmPlans) {
    assert.equal(plan.studyPlanVersion, STUDY_PLAN_VERSION);
    assert.equal(
      plan.tasks.length,
      MANUAL_CONDITION_DEFINITIONS.length * TASKS_PER_MANUAL_CONDITION,
    );
    for (const condition of MANUAL_CONDITION_DEFINITIONS) {
      const tasks = conditionTasks(plan, condition.id);
      assert.equal(tasks.length, TASKS_PER_MANUAL_CONDITION, condition.id);
      const matchCount = tasks.filter(
        (task) => task.groundTruth === "match",
      ).length;
      const mismatchCount = tasks.length - matchCount;
      assert.ok([1, 2, 3].includes(matchCount));
      assert.ok([1, 2, 3].includes(mismatchCount));
      assert.ok(
        mismatchCount < mismatchTypesForCondition(condition.id).length,
        `${plan.studyArm}:${condition.id}:mismatch coverage`,
      );
    }
    assert.equal(
      plan.tasks.filter((task) => task.groundTruth === "match").length,
      12,
    );
    assert.equal(
      plan.tasks.filter((task) => task.groundTruth === "mismatch").length,
      12,
    );
  }
});

test("condition-level match ratios vary by arm but balance over the complete set", () => {
  for (const condition of MANUAL_CONDITION_DEFINITIONS) {
    const counts = completeArmPlans
      .map(
        (plan) =>
          conditionTasks(plan, condition.id).filter(
            (task) => task.groundTruth === "match",
          ).length,
      )
      .sort((left, right) => left - right);
    assert.deepEqual(counts, [1, 1, 2, 2, 2, 2, 3, 3], condition.id);
  }
});

test("aggregate match and mismatch totals are balanced across all eight arms", () => {
  const tasks = completeArmPlans.flatMap((plan) => plan.tasks);
  assert.equal(tasks.length, 192);
  assert.equal(tasks.filter((task) => task.groundTruth === "match").length, 96);
  assert.equal(
    tasks.filter((task) => task.groundTruth === "mismatch").length,
    96,
  );
});

test("mismatch classes rotate across arms instead of appearing in every participant plan", () => {
  for (const condition of MANUAL_CONDITION_DEFINITIONS) {
    const perArm = completeArmPlans.map((plan) =>
      conditionTasks(plan, condition.id)
        .filter((task) => task.groundTruth === "mismatch")
        .map((task) => task.mismatchType),
    );
    assert.ok(perArm.every((types) => [1, 2, 3].includes(types.length)));
    assert.ok(
      perArm.every(
        (types) =>
          types.length < mismatchTypesForCondition(condition.id).length,
      ),
    );
    assert.deepEqual(
      new Set(perArm.flat()),
      new Set(mismatchTypesForCondition(condition.id)),
      condition.id,
    );
  }
});

test("beginning, middle, and end substitutions receive equal complete-arm coverage", () => {
  const definitions = STUDY_ARMS.flatMap((arm) =>
    studyPlanDefinitionsForArm(arm),
  );
  const counts = Object.fromEntries(
    SUBSTITUTION_TYPES.map((type) => [
      type,
      definitions.filter((definition) => definition.mismatchType === type)
        .length,
    ]),
  );
  assert.deepEqual(counts, {
    "substitution-beginning": 16,
    "substitution-middle": 16,
    "substitution-end": 16,
  });
});

test("secondary mismatch schedules have their declared complete-arm coverage", () => {
  const secondaryTypes = [
    MISMATCH_TYPES.ADJACENT_TRANSPOSITION,
    MISMATCH_TYPES.OMITTED_ENTRY,
    MISMATCH_TYPES.DUPLICATED_ENTRY,
    MISMATCH_TYPES.VISUALLY_SIMILAR_EMOJI,
  ];
  for (const condition of MANUAL_CONDITION_DEFINITIONS.slice(0, 3)) {
    const tasks = completeArmPlans.flatMap((plan) =>
      conditionTasks(plan, condition.id),
    );
    for (const mismatchType of secondaryTypes) {
      assert.equal(
        tasks.filter((task) => task.mismatchType === mismatchType).length,
        2,
        `${condition.id}:${mismatchType}`,
      );
    }
  }

  const nonEmojiTasks = completeArmPlans.flatMap((plan) =>
    plan.tasks.filter((task) =>
      ["spoken-emoji-96", "words-96", "hex-96"].includes(task.conditionId),
    ),
  );
  for (const mismatchType of secondaryTypes.slice(0, 3)) {
    assert.equal(
      nonEmojiTasks.filter((task) => task.mismatchType === mismatchType).length,
      8,
      mismatchType,
    );
  }
});

test("same seed and arm reconstruct exact ordered tasks", async () => {
  const taskSetSeed = seedsByArm.A[0];
  const first = await generateStudyPlan({ taskSetSeed, studyArm: "A" });
  const second = await generateStudyPlan({ taskSetSeed, studyArm: "A" });
  assert.deepEqual(first, second);
});

test("different seeds for one arm change stimuli and task ordering", async () => {
  const first = await generateStudyPlan({
    taskSetSeed: seedsByArm.B[0],
    studyArm: "B",
  });
  const second = await generateStudyPlan({
    taskSetSeed: seedsByArm.B[1],
    studyArm: "B",
  });
  assert.notDeepEqual(
    first.tasks.map((task) => task.reference.digestHex),
    second.tasks.map((task) => task.reference.digestHex),
  );
  assert.notDeepEqual(
    first.tasks.map((task) => `${task.conditionId}:${task.mismatchType}`),
    second.tasks.map((task) => `${task.conditionId}:${task.mismatchType}`),
  );
});

test("participant-facing task ordinals do not encode ground truth or mismatch class", () => {
  for (const plan of completeArmPlans) {
    for (const task of plan.tasks) {
      assert.match(
        task.taskId,
        new RegExp(`^M2B-${plan.studyArm}-[0-9]{3}$`, "u"),
      );
      assert.doesNotMatch(
        task.taskId,
        /match|mismatch|substitution|transposition|omitted|duplicated/iu,
      );
    }
  }
});

test("a task-set seed must independently derive its declared arm", async () => {
  for (const arm of STUDY_ARMS) {
    assert.equal(await deriveStudyArm(seedsByArm[arm][0]), arm);
  }
  await assert.rejects(() =>
    generateStudyPlan({ taskSetSeed: seedsByArm.A[0], studyArm: "B" }),
  );
});

const fixtureDigest = Uint8Array.from(
  { length: 32 },
  (_, index) => (index * 17 + 29) % 256,
);
const fixtureMutation = Uint8Array.from(
  { length: 32 },
  (_, index) => (index * 13 + 7) % 256,
);

test("match tasks are identical and controlled mismatches differ", () => {
  for (const condition of MANUAL_CONDITION_DEFINITIONS) {
    const match = createStudyTask({
      conditionId: condition.id,
      digest: fixtureDigest,
      mutationBytes: fixtureMutation,
    });
    assert.equal(match.groundTruth, "match");
    assert.deepEqual(match.reference, match.comparison);

    for (const mismatchType of mismatchTypesForCondition(condition.id)) {
      const mismatch = createStudyTask({
        conditionId: condition.id,
        mismatchType,
        digest: fixtureDigest,
        mutationBytes: fixtureMutation,
      });
      assert.equal(mismatch.groundTruth, "mismatch");
      assert.notDeepEqual(mismatch.reference, mismatch.comparison);
      assert.match(mismatch.mismatchPosition, /entr(?:y|ies) [0-9]/u);
    }
  }
});

test("beginning, middle, and ending substitutions target intended entries", () => {
  const cases = [
    [MISMATCH_TYPES.SUBSTITUTION_BEGINNING, 0],
    [MISMATCH_TYPES.SUBSTITUTION_MIDDLE, 6],
    [MISMATCH_TYPES.SUBSTITUTION_END, 11],
  ];
  for (const [mismatchType, expected] of cases) {
    const task = createStudyTask({
      conditionId: "words-96",
      mismatchType,
      digest: fixtureDigest,
      mutationBytes: fixtureMutation,
    });
    const reference = values(task.reference);
    const comparison = values(task.comparison);
    const changed = reference
      .map((value, index) => (value !== comparison[index] ? index : null))
      .filter((value) => value !== null);
    assert.deepEqual(changed, [expected]);
    assert.equal(task.mismatchPosition, `entry ${expected + 1}`);
  }
});

test("adjacent transposition swaps two distinct entries", () => {
  const task = createStudyTask({
    conditionId: "emoji-96",
    mismatchType: MISMATCH_TYPES.ADJACENT_TRANSPOSITION,
    digest: fixtureDigest,
    mutationBytes: fixtureMutation,
  });
  const reference = values(task.reference);
  const comparison = values(task.comparison);
  const changed = reference
    .map((value, index) => (value !== comparison[index] ? index : null))
    .filter((value) => value !== null);
  assert.equal(changed.length, 2);
  assert.equal(changed[1], changed[0] + 1);
  assert.equal(reference[changed[0]], comparison[changed[1]]);
  assert.equal(reference[changed[1]], comparison[changed[0]]);
});

test("omitted-entry and duplicated-entry alter exactly one condition entry", () => {
  const omitted = createStudyTask({
    conditionId: "hex-96",
    mismatchType: MISMATCH_TYPES.OMITTED_ENTRY,
    digest: fixtureDigest,
    mutationBytes: fixtureMutation,
  });
  const duplicated = createStudyTask({
    conditionId: "hex-96",
    mismatchType: MISMATCH_TYPES.DUPLICATED_ENTRY,
    digest: fixtureDigest,
    mutationBytes: fixtureMutation,
  });
  assert.equal(
    omitted.comparison.items.length,
    omitted.reference.items.length - 1,
  );
  assert.equal(
    duplicated.comparison.items.length,
    duplicated.reference.items.length + 1,
  );
  assert.match(omitted.mismatchPosition, /^entry [1-6]$/u);
  assert.match(duplicated.mismatchPosition, /^entry [1-6]$/u);
});

test("visual substitution uses a declared experiment-only candidate pair", () => {
  const task = createStudyTask({
    conditionId: "emoji-48",
    mismatchType: MISMATCH_TYPES.VISUALLY_SIMILAR_EMOJI,
    digest: fixtureDigest,
    mutationBytes: fixtureMutation,
  });
  const index = Number.parseInt(task.mismatchPosition.split(" ")[1], 10) - 1;
  assert.equal(
    CANDIDATE_VISUAL_CONFUSION_PAIRS.get(task.reference.items[index].index),
    task.comparison.items[index].index,
  );
});

test("QR never appears in a manual participant plan", () => {
  for (const plan of completeArmPlans) {
    assert.ok(plan.tasks.every((task) => !task.conditionId.includes("qr")));
  }
  assert.throws(() => mismatchTypesForCondition("qr-technical-256"));
});
