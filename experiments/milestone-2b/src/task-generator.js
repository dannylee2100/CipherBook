import {
  CONDITION_BY_ID,
  DIGEST_BYTES,
  MANUAL_CONDITION_DEFINITIONS,
  STUDY_ARMS,
  STUDY_PLAN_VERSION,
  TASKS_PER_MANUAL_CONDITION,
} from "./constants.js";
import {
  CANDIDATE_VISUAL_CONFUSION_PAIRS,
  EMOJI_TABLE,
} from "./emoji-table.js";
import {
  bytesToHex,
  representationFor,
  representationSignature,
  validateStudyDigest,
} from "./representations.js";
import { WORD_LIST } from "./word-list.js";

export const MISMATCH_TYPES = Object.freeze({
  SUBSTITUTION_BEGINNING: "substitution-beginning",
  SUBSTITUTION_MIDDLE: "substitution-middle",
  SUBSTITUTION_END: "substitution-end",
  ADJACENT_TRANSPOSITION: "adjacent-transposition",
  OMITTED_ENTRY: "omitted-entry",
  DUPLICATED_ENTRY: "duplicated-entry",
  VISUALLY_SIMILAR_EMOJI: "visually-similar-emoji",
});

const SUBSTITUTION_ROTATION = Object.freeze([
  MISMATCH_TYPES.SUBSTITUTION_BEGINNING,
  MISMATCH_TYPES.SUBSTITUTION_MIDDLE,
  MISMATCH_TYPES.SUBSTITUTION_END,
]);

const STRUCTURAL_ROTATION = Object.freeze([
  MISMATCH_TYPES.ADJACENT_TRANSPOSITION,
  MISMATCH_TYPES.OMITTED_ENTRY,
  MISMATCH_TYPES.DUPLICATED_ENTRY,
]);

const EMOJI_SECONDARY_ROTATION = Object.freeze([
  ...STRUCTURAL_ROTATION,
  MISMATCH_TYPES.VISUALLY_SIMILAR_EMOJI,
]);

const EMOJI_SECONDARY_SCHEDULE = Object.freeze([
  MISMATCH_TYPES.ADJACENT_TRANSPOSITION,
  MISMATCH_TYPES.OMITTED_ENTRY,
  MISMATCH_TYPES.DUPLICATED_ENTRY,
  MISMATCH_TYPES.VISUALLY_SIMILAR_EMOJI,
  MISMATCH_TYPES.ADJACENT_TRANSPOSITION,
  MISMATCH_TYPES.OMITTED_ENTRY,
  MISMATCH_TYPES.DUPLICATED_ENTRY,
  MISMATCH_TYPES.VISUALLY_SIMILAR_EMOJI,
]);

const NON_EMOJI_SECONDARY_SCHEDULES = Object.freeze([
  Object.freeze([
    MISMATCH_TYPES.ADJACENT_TRANSPOSITION,
    MISMATCH_TYPES.OMITTED_ENTRY,
    MISMATCH_TYPES.DUPLICATED_ENTRY,
    MISMATCH_TYPES.ADJACENT_TRANSPOSITION,
    MISMATCH_TYPES.OMITTED_ENTRY,
    MISMATCH_TYPES.DUPLICATED_ENTRY,
    MISMATCH_TYPES.ADJACENT_TRANSPOSITION,
    MISMATCH_TYPES.OMITTED_ENTRY,
  ]),
  Object.freeze([
    MISMATCH_TYPES.OMITTED_ENTRY,
    MISMATCH_TYPES.DUPLICATED_ENTRY,
    MISMATCH_TYPES.ADJACENT_TRANSPOSITION,
    MISMATCH_TYPES.OMITTED_ENTRY,
    MISMATCH_TYPES.DUPLICATED_ENTRY,
    MISMATCH_TYPES.ADJACENT_TRANSPOSITION,
    MISMATCH_TYPES.OMITTED_ENTRY,
    MISMATCH_TYPES.DUPLICATED_ENTRY,
  ]),
  Object.freeze([
    MISMATCH_TYPES.DUPLICATED_ENTRY,
    MISMATCH_TYPES.ADJACENT_TRANSPOSITION,
    MISMATCH_TYPES.OMITTED_ENTRY,
    MISMATCH_TYPES.DUPLICATED_ENTRY,
    MISMATCH_TYPES.ADJACENT_TRANSPOSITION,
    MISMATCH_TYPES.OMITTED_ENTRY,
    MISMATCH_TYPES.DUPLICATED_ENTRY,
    MISMATCH_TYPES.ADJACENT_TRANSPOSITION,
  ]),
]);

// Each row is one manual condition and each column is arm A-H. Every row has
// two 1/3, four 2/2, and two 3/1 match/mismatch allocations. Every arm totals
// 12 matches and 12 mismatches across its 24 tasks.
const MATCH_COUNTS_BY_CONDITION_AND_ARM = Object.freeze(
  [
    [1, 1, 3, 3, 2, 2, 2, 2],
    [2, 2, 1, 1, 3, 3, 2, 2],
    [2, 2, 2, 2, 1, 1, 3, 3],
    [3, 3, 2, 2, 2, 2, 1, 1],
    [1, 1, 2, 2, 3, 3, 2, 2],
    [3, 3, 2, 2, 1, 1, 2, 2],
  ].map((row) => Object.freeze(row)),
);

const EXPANSION_DOMAIN = "CIPHERBOOK-M2B-STUDY-PLAN-EXPANSION-UNSTABLE";
const TASK_SET_SEED_PATTERN = /^[0-9a-f]{32}$/u;
const textEncoder = new TextEncoder();

export function validateStudyArm(studyArm) {
  if (!STUDY_ARMS.includes(studyArm)) {
    throw new Error(`study arm must be one of ${STUDY_ARMS.join(", ")}`);
  }
  return studyArm;
}

export function validateTaskSetSeed(taskSetSeed) {
  if (
    typeof taskSetSeed !== "string" ||
    !TASK_SET_SEED_PATTERN.test(taskSetSeed)
  ) {
    throw new Error(
      "synthetic task-set seed must be exactly 128 lowercase hexadecimal bits",
    );
  }
  return taskSetSeed;
}

function cryptographicApi() {
  if (!globalThis.crypto?.getRandomValues || !globalThis.crypto?.subtle) {
    throw new Error(
      "study-plan generation requires crypto.getRandomValues and crypto.subtle",
    );
  }
  return globalThis.crypto;
}

function compareAscii(left, right) {
  if (left < right) {
    return -1;
  }
  return left > right ? 1 : 0;
}

// This domain-separated SHA-256 expansion generates synthetic study material,
// not keys, contacts, protocol bytes, or a project fingerprint.
export async function deriveStudyBytes(taskSetSeed, ...labels) {
  validateTaskSetSeed(taskSetSeed);
  if (
    labels.length === 0 ||
    labels.some(
      (label) =>
        typeof label !== "string" ||
        label.length === 0 ||
        label.includes("\u0000"),
    )
  ) {
    throw new Error("study expansion labels must be non-empty strings");
  }
  const material = [
    EXPANSION_DOMAIN,
    STUDY_PLAN_VERSION,
    taskSetSeed,
    ...labels,
  ].join("\u0000");
  const digest = await cryptographicApi().subtle.digest(
    "SHA-256",
    textEncoder.encode(material),
  );
  return new Uint8Array(digest);
}

export async function deriveStudyArm(taskSetSeed) {
  const derived = await deriveStudyBytes(taskSetSeed, "study-arm");
  return STUDY_ARMS[derived[0] % STUDY_ARMS.length];
}

export function createRandomStudyBytes(length) {
  if (!Number.isInteger(length) || length < 1) {
    throw new Error("synthetic byte length must be a positive integer");
  }
  const bytes = new Uint8Array(length);
  cryptographicApi().getRandomValues(bytes);
  return bytes;
}

export async function createTaskSetSeedForArm(studyArm) {
  validateStudyArm(studyArm);
  // The moderator preassigns arms in a fixed A-H rotation. Rejection sampling
  // keeps that allocation while making the arm independently derivable from
  // the exported 128-bit synthetic seed. Expected draws: eight.
  for (let attempt = 0; attempt < 4096; attempt += 1) {
    const candidate = bytesToHex(createRandomStudyBytes(16));
    if ((await deriveStudyArm(candidate)) === studyArm) {
      return candidate;
    }
  }
  throw new Error(
    "could not generate a synthetic task-set seed for the selected arm",
  );
}

export function mismatchTypesForCondition(conditionId) {
  const condition = CONDITION_BY_ID[conditionId];
  if (!condition || condition.kind === "qr") {
    throw new Error(`unknown manual study condition: ${conditionId}`);
  }
  if (condition.kind === "emoji") {
    return Object.freeze([
      ...SUBSTITUTION_ROTATION,
      ...EMOJI_SECONDARY_ROTATION,
    ]);
  }
  return Object.freeze([...SUBSTITUTION_ROTATION, ...STRUCTURAL_ROTATION]);
}

export function studyPlanDefinitionsForArm(studyArm) {
  validateStudyArm(studyArm);
  const armIndex = STUDY_ARMS.indexOf(studyArm);
  const definitions = [];

  for (const [
    conditionIndex,
    condition,
  ] of MANUAL_CONDITION_DEFINITIONS.entries()) {
    const matchCount =
      MATCH_COUNTS_BY_CONDITION_AND_ARM[conditionIndex][armIndex];
    const secondaryCount = 3 - matchCount;
    const substitution =
      SUBSTITUTION_ROTATION[
        (armIndex + conditionIndex) % SUBSTITUTION_ROTATION.length
      ];
    const baseSecondarySchedule =
      condition.kind === "emoji"
        ? EMOJI_SECONDARY_SCHEDULE
        : NON_EMOJI_SECONDARY_SCHEDULES[conditionIndex % 3];
    const secondarySchedule =
      condition.kind === "emoji"
        ? Object.freeze([
            ...baseSecondarySchedule.slice((conditionIndex * 2) % 8),
            ...baseSecondarySchedule.slice(0, (conditionIndex * 2) % 8),
          ])
        : baseSecondarySchedule.slice(0, 8);
    const secondaryOffset = MATCH_COUNTS_BY_CONDITION_AND_ARM[conditionIndex]
      .slice(0, armIndex)
      .reduce((total, priorMatchCount) => total + (3 - priorMatchCount), 0);
    const secondaryTypes = secondarySchedule.slice(
      secondaryOffset,
      secondaryOffset + secondaryCount,
    );

    for (let matchIndex = 0; matchIndex < matchCount; matchIndex += 1) {
      definitions.push(
        Object.freeze({
          conditionId: condition.id,
          planSlot: `match-${matchIndex + 1}`,
          mismatchType: null,
        }),
      );
    }
    definitions.push(
      Object.freeze({
        conditionId: condition.id,
        planSlot: "substitution",
        mismatchType: substitution,
      }),
    );
    for (const [secondaryIndex, secondaryType] of secondaryTypes.entries()) {
      definitions.push(
        Object.freeze({
          conditionId: condition.id,
          planSlot: `secondary-${secondaryIndex + 1}`,
          mismatchType: secondaryType,
        }),
      );
    }
  }

  if (
    definitions.length !==
    MANUAL_CONDITION_DEFINITIONS.length * TASKS_PER_MANUAL_CONDITION
  ) {
    throw new Error("predeclared study plan has an unexpected task count");
  }
  return Object.freeze(definitions);
}

function renumber(items) {
  return Object.freeze(
    items.map((item, index) => Object.freeze({ ...item, position: index + 1 })),
  );
}

function replacementItem(kind, item, offset) {
  if (kind === "emoji") {
    const index = (item.index + 1 + offset) % EMOJI_TABLE.length;
    const replacement = EMOJI_TABLE[index];
    return {
      index,
      symbol: replacement.symbol,
      label: replacement.label,
      codePoints: replacement.codePoints,
    };
  }
  if (kind === "spoken") {
    const index = (item.index + 1 + offset) % EMOJI_TABLE.length;
    const replacement = EMOJI_TABLE[index];
    return {
      index,
      label: replacement.label,
      codePoints: replacement.codePoints,
    };
  }
  if (kind === "words") {
    const index = (item.index + 1 + offset) % WORD_LIST.length;
    return { index, word: WORD_LIST[index] };
  }
  if (kind === "hex") {
    const first = Number.parseInt(item.group[0], 16);
    const replacement = ((first + 1 + (offset % 15)) % 16).toString(16);
    return { group: `${replacement}${item.group.slice(1)}` };
  }
  throw new Error(`unsupported manual study kind: ${kind}`);
}

function targetForSubstitution(type, length) {
  if (type === MISMATCH_TYPES.SUBSTITUTION_BEGINNING) {
    return 0;
  }
  if (type === MISMATCH_TYPES.SUBSTITUTION_MIDDLE) {
    return Math.floor(length / 2);
  }
  if (type === MISMATCH_TYPES.SUBSTITUTION_END) {
    return length - 1;
  }
  return null;
}

function distinctAdjacentIndices(items) {
  const value = (item) => item.index ?? item.group ?? item.label;
  return items
    .slice(0, -1)
    .map((item, index) =>
      value(item) === value(items[index + 1]) ? null : index,
    )
    .filter((index) => index !== null);
}

function setSixBitIndex(digest, symbolIndex, value) {
  for (let offset = 0; offset < 6; offset += 1) {
    const bitIndex = symbolIndex * 6 + offset;
    const byteIndex = Math.floor(bitIndex / 8);
    const bitMask = 1 << (7 - (bitIndex % 8));
    const bit = (value >>> (5 - offset)) & 1;
    digest[byteIndex] = bit
      ? digest[byteIndex] | bitMask
      : digest[byteIndex] & ~bitMask;
  }
}

function prepareDigest(conditionId, mismatchType, digest, mutationBytes) {
  const prepared = validateStudyDigest(digest).slice();
  if (mismatchType !== MISMATCH_TYPES.VISUALLY_SIMILAR_EMOJI) {
    return prepared;
  }
  const condition = CONDITION_BY_ID[conditionId];
  const itemCount = condition.bits / 6;
  const itemIndex = mutationBytes[0] % itemCount;
  const candidates = Array.from(CANDIDATE_VISUAL_CONFUSION_PAIRS.keys());
  const candidate = candidates[mutationBytes[1] % candidates.length];
  setSixBitIndex(prepared, itemIndex, candidate);
  return prepared;
}

function manualMismatch(reference, mismatchType, mutationBytes) {
  const items = reference.items.map((item) => ({ ...item }));
  const substitutionTarget = targetForSubstitution(mismatchType, items.length);
  let mismatchPosition;

  if (substitutionTarget !== null) {
    items[substitutionTarget] = replacementItem(
      reference.kind,
      items[substitutionTarget],
      mutationBytes[0] % 31,
    );
    mismatchPosition = `entry ${substitutionTarget + 1}`;
  } else if (mismatchType === MISMATCH_TYPES.ADJACENT_TRANSPOSITION) {
    const candidates = distinctAdjacentIndices(items);
    if (candidates.length === 0) {
      throw new Error(
        "synthetic task has no distinct adjacent entries to transpose",
      );
    }
    const index = candidates[mutationBytes[0] % candidates.length];
    [items[index], items[index + 1]] = [items[index + 1], items[index]];
    mismatchPosition = `entries ${index + 1} and ${index + 2}`;
  } else if (mismatchType === MISMATCH_TYPES.OMITTED_ENTRY) {
    const index = mutationBytes[0] % items.length;
    items.splice(index, 1);
    mismatchPosition = `entry ${index + 1}`;
  } else if (mismatchType === MISMATCH_TYPES.DUPLICATED_ENTRY) {
    const index = mutationBytes[0] % items.length;
    items.splice(index, 0, { ...items[index] });
    mismatchPosition = `entry ${index + 1}`;
  } else if (mismatchType === MISMATCH_TYPES.VISUALLY_SIMILAR_EMOJI) {
    const index = mutationBytes[0] % items.length;
    const replacementIndex = CANDIDATE_VISUAL_CONFUSION_PAIRS.get(
      items[index].index,
    );
    if (replacementIndex === undefined) {
      throw new Error(
        "visual-confusion fixture does not contain a candidate pair",
      );
    }
    const replacement = EMOJI_TABLE[replacementIndex];
    items[index] = {
      index: replacement.index,
      symbol: replacement.symbol,
      label: replacement.label,
      codePoints: replacement.codePoints,
    };
    mismatchPosition = `entry ${index + 1}`;
  } else {
    throw new Error(`mismatch type is not applicable: ${mismatchType}`);
  }

  const comparison = Object.freeze({ ...reference, items: renumber(items) });
  if (
    representationSignature(reference) === representationSignature(comparison)
  ) {
    throw new Error("controlled mismatch must differ from its reference");
  }
  return { comparison, mismatchPosition };
}

export function createStudyTask({
  conditionId,
  mismatchType = null,
  digest,
  mutationBytes = new Uint8Array(DIGEST_BYTES),
  taskId = "M2B-A-001",
}) {
  const condition = CONDITION_BY_ID[conditionId];
  if (!condition || condition.kind === "qr") {
    throw new Error(`unknown manual study condition: ${conditionId}`);
  }
  if (
    mismatchType !== null &&
    !mismatchTypesForCondition(conditionId).includes(mismatchType)
  ) {
    throw new Error(
      `mismatch type ${mismatchType} is not applicable to ${conditionId}`,
    );
  }
  validateStudyDigest(mutationBytes);

  const preparedDigest = prepareDigest(
    conditionId,
    mismatchType,
    digest,
    mutationBytes,
  );
  const reference = representationFor(conditionId, preparedDigest);
  let comparison = reference;
  let mismatchPosition = null;

  if (mismatchType !== null) {
    ({ comparison, mismatchPosition } = manualMismatch(
      reference,
      mismatchType,
      mutationBytes,
    ));
  }

  const isMatch = mismatchType === null;
  if (
    isMatch !==
    (representationSignature(reference) === representationSignature(comparison))
  ) {
    throw new Error("study task ground truth does not match its stimuli");
  }

  return Object.freeze({
    taskId,
    conditionId,
    conditionLabel: condition.label,
    displayedBits: condition.bits,
    groundTruth: isMatch ? "match" : "mismatch",
    mismatchType: mismatchType ?? "none",
    mismatchPosition,
    reference,
    comparison,
  });
}

export async function generateStudyPlan({ taskSetSeed, studyArm }) {
  validateTaskSetSeed(taskSetSeed);
  validateStudyArm(studyArm);
  if ((await deriveStudyArm(taskSetSeed)) !== studyArm) {
    throw new Error(
      "synthetic task-set seed does not derive the selected study arm",
    );
  }

  const definitions = studyPlanDefinitionsForArm(studyArm);
  const expanded = await Promise.all(
    definitions.map(async (definition) => {
      const definitionLabel = [
        definition.conditionId,
        definition.planSlot,
        definition.mismatchType ?? "match",
      ].join(":");
      const [digest, mutationBytes, orderBytes] = await Promise.all([
        deriveStudyBytes(taskSetSeed, studyArm, definitionLabel, "digest"),
        deriveStudyBytes(taskSetSeed, studyArm, definitionLabel, "mutation"),
        deriveStudyBytes(taskSetSeed, studyArm, definitionLabel, "task-order"),
      ]);
      return {
        definition,
        digest,
        mutationBytes,
        orderKey: bytesToHex(orderBytes),
      };
    }),
  );

  expanded.sort(
    (left, right) =>
      compareAscii(left.orderKey, right.orderKey) ||
      compareAscii(left.definition.conditionId, right.definition.conditionId) ||
      compareAscii(left.definition.planSlot, right.definition.planSlot),
  );

  const tasks = Object.freeze(
    expanded.map(({ definition, digest, mutationBytes }, index) =>
      createStudyTask({
        conditionId: definition.conditionId,
        mismatchType: definition.mismatchType,
        digest,
        mutationBytes,
        taskId: `M2B-${studyArm}-${String(index + 1).padStart(3, "0")}`,
      }),
    ),
  );

  return Object.freeze({
    studyPlanVersion: STUDY_PLAN_VERSION,
    studyArm,
    taskSetSeed,
    tasks,
  });
}
