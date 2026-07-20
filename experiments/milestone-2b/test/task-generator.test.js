import assert from "node:assert/strict";
import { test } from "node:test";

import { CONDITION_DEFINITIONS } from "../src/constants.js";
import { CANDIDATE_VISUAL_CONFUSION_PAIRS } from "../src/emoji-table.js";
import {
  createStudyTask,
  generateInteractiveStudyTasks,
  generateStudyTasks,
  mismatchTypesForCondition,
  MISMATCH_TYPES,
} from "../src/task-generator.js";

const seed = "deterministic-milestone-2b-fixture";

function values(representation) {
  return representation.items.map(
    (item) => item.index ?? item.group ?? item.label,
  );
}

test("seeded task generation is reproducible", () => {
  const conditionIds = CONDITION_DEFINITIONS.map((condition) => condition.id);
  const first = generateStudyTasks({ conditionIds, seed, randomize: true });
  const second = generateStudyTasks({ conditionIds, seed, randomize: true });
  assert.deepEqual(first, second);
});

test("interactive tasks obtain a fresh 32-byte source for every task", () => {
  let calls = 0;
  const tasks = generateInteractiveStudyTasks({
    conditionIds: ["qr-256", "emoji-48"],
    orderSeed: "interactive-order-fixture",
    randomize: false,
    randomBytes(length) {
      calls += 1;
      return Uint8Array.from(
        { length },
        (_, index) => (index * 17 + calls * 29) % 256,
      );
    },
  });

  assert.equal(calls, tasks.length);
  assert.ok(tasks.every((task) => task.reference.digestHex.length === 64));
  const visualTask = tasks.find(
    (task) => task.mismatchType === MISMATCH_TYPES.VISUALLY_SIMILAR_EMOJI,
  );
  const visualIndex = 4;
  assert.equal(
    CANDIDATE_VISUAL_CONFUSION_PAIRS.get(
      visualTask.reference.items[visualIndex].index,
    ),
    visualTask.comparison.items[visualIndex].index,
  );
});

test("match tasks are identical and carry correct ground truth", () => {
  for (const condition of CONDITION_DEFINITIONS) {
    const task = createStudyTask({ conditionId: condition.id, seed });
    assert.equal(task.groundTruth, "match");
    assert.deepEqual(task.reference, task.comparison);
    assert.equal(task.mismatchType, "none");
  }
});

test("every applicable mismatch differs and carries mismatch ground truth", () => {
  for (const condition of CONDITION_DEFINITIONS) {
    for (const mismatchType of mismatchTypesForCondition(condition.id)) {
      const task = createStudyTask({
        conditionId: condition.id,
        mismatchType,
        seed: `${seed}:${condition.id}:${mismatchType}`,
      });
      assert.equal(task.groundTruth, "mismatch");
      assert.notDeepEqual(task.reference, task.comparison);
      assert.ok(task.mismatchPosition);
    }
  }
});

test("beginning, middle, and ending substitutions target intended regions", () => {
  const conditionId = "words-96";
  const cases = [
    [MISMATCH_TYPES.SUBSTITUTION_BEGINNING, 0],
    [MISMATCH_TYPES.SUBSTITUTION_MIDDLE, 6],
    [MISMATCH_TYPES.SUBSTITUTION_END, 11],
  ];
  for (const [mismatchType, expected] of cases) {
    const task = createStudyTask({ conditionId, mismatchType, seed });
    const changed = values(task.reference)
      .map((value, index) =>
        value !== values(task.comparison)[index] ? index : null,
      )
      .filter((value) => value !== null);
    assert.deepEqual(changed, [expected]);
  }
});

test("adjacent transposition swaps two distinct entries", () => {
  const task = createStudyTask({
    conditionId: "emoji-96",
    mismatchType: MISMATCH_TYPES.ADJACENT_TRANSPOSITION,
    seed,
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

test("omission and duplication change the intended sequence length", () => {
  const omitted = createStudyTask({
    conditionId: "hex-96",
    mismatchType: MISMATCH_TYPES.OMITTED_GROUP,
    seed,
  });
  const duplicated = createStudyTask({
    conditionId: "hex-96",
    mismatchType: MISMATCH_TYPES.DUPLICATED_GROUP,
    seed,
  });
  assert.equal(
    omitted.comparison.items.length,
    omitted.reference.items.length - 1,
  );
  assert.equal(
    duplicated.comparison.items.length,
    duplicated.reference.items.length + 1,
  );
});

test("visual substitution uses a declared experiment-only candidate pair", () => {
  const task = createStudyTask({
    conditionId: "emoji-48",
    mismatchType: MISMATCH_TYPES.VISUALLY_SIMILAR_EMOJI,
    seed,
  });
  const index = 4;
  assert.equal(
    CANDIDATE_VISUAL_CONFUSION_PAIRS.get(task.reference.items[index].index),
    task.comparison.items[index].index,
  );
});

test("full QR mismatch changes the synthetic digest and no manual class is forced", () => {
  assert.deepEqual(mismatchTypesForCondition("qr-256"), ["different-full-qr"]);
  const task = createStudyTask({
    conditionId: "qr-256",
    mismatchType: MISMATCH_TYPES.DIFFERENT_FULL_QR,
    seed,
  });
  assert.notEqual(task.reference.digestHex, task.comparison.digestHex);
  assert.throws(() =>
    createStudyTask({
      conditionId: "qr-256",
      mismatchType: MISMATCH_TYPES.OMITTED_GROUP,
      seed,
    }),
  );
});
