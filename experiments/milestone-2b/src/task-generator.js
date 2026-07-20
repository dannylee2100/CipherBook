import { CONDITION_BY_ID, DIGEST_BYTES } from "./constants.js";
import {
  CANDIDATE_VISUAL_CONFUSION_PAIRS,
  EMOJI_TABLE,
} from "./emoji-table.js";
import { deterministicStudyBytes, shuffleStudyItems } from "./prng.js";
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
  OMITTED_GROUP: "omitted-group",
  DUPLICATED_GROUP: "duplicated-group",
  VISUALLY_SIMILAR_EMOJI: "visually-similar-emoji",
  DIFFERENT_FULL_QR: "different-full-qr",
});

const MANUAL_MISMATCHES = Object.freeze([
  MISMATCH_TYPES.SUBSTITUTION_BEGINNING,
  MISMATCH_TYPES.SUBSTITUTION_MIDDLE,
  MISMATCH_TYPES.SUBSTITUTION_END,
  MISMATCH_TYPES.ADJACENT_TRANSPOSITION,
  MISMATCH_TYPES.OMITTED_GROUP,
  MISMATCH_TYPES.DUPLICATED_GROUP,
]);

export function mismatchTypesForCondition(conditionId) {
  const condition = CONDITION_BY_ID[conditionId];
  if (!condition) {
    throw new Error(`unknown study condition: ${conditionId}`);
  }
  if (condition.kind === "qr") {
    return Object.freeze([MISMATCH_TYPES.DIFFERENT_FULL_QR]);
  }
  if (condition.kind === "emoji") {
    return Object.freeze([
      ...MANUAL_MISMATCHES,
      MISMATCH_TYPES.VISUALLY_SIMILAR_EMOJI,
    ]);
  }
  return MANUAL_MISMATCHES;
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

function differingAdjacentIndex(items) {
  const preferred = Math.max(0, Math.floor(items.length / 2) - 1);
  const value = (item) => item.index ?? item.group ?? item.label;
  for (let distance = 0; distance < items.length - 1; distance += 1) {
    for (const candidate of [preferred - distance, preferred + distance]) {
      if (
        candidate >= 0 &&
        candidate < items.length - 1 &&
        value(items[candidate]) !== value(items[candidate + 1])
      ) {
        return candidate;
      }
    }
  }
  throw new Error(
    "synthetic task has no distinct adjacent entries to transpose",
  );
}

function digestForTask(seed, conditionId, mismatchType) {
  if (mismatchType !== MISMATCH_TYPES.VISUALLY_SIMILAR_EMOJI) {
    return deterministicStudyBytes(
      `${seed}:${conditionId}:${mismatchType ?? "match"}`,
      DIGEST_BYTES,
    );
  }

  const condition = CONDITION_BY_ID[conditionId];
  const itemIndex = Math.floor(condition.bits / 12);
  for (let attempt = 0; attempt < 4096; attempt += 1) {
    const digest = deterministicStudyBytes(
      `${seed}:${conditionId}:visual-candidate:${attempt}`,
      DIGEST_BYTES,
    );
    const representation = representationFor(conditionId, digest);
    if (
      CANDIDATE_VISUAL_CONFUSION_PAIRS.has(
        representation.items[itemIndex].index,
      )
    ) {
      return digest;
    }
  }
  throw new Error("could not create a deterministic visual-confusion fixture");
}

function randomStudyBytes(length) {
  const bytes = new Uint8Array(length);
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error("interactive study tasks require crypto.getRandomValues");
  }
  globalThis.crypto.getRandomValues(bytes);
  return bytes;
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

function interactiveDigestForTask(conditionId, mismatchType, randomBytes) {
  const digest = validateStudyDigest(randomBytes(DIGEST_BYTES)).slice();
  if (mismatchType === MISMATCH_TYPES.VISUALLY_SIMILAR_EMOJI) {
    const condition = CONDITION_BY_ID[conditionId];
    const itemIndex = Math.floor(condition.bits / 12);
    const candidateIndices = Array.from(
      CANDIDATE_VISUAL_CONFUSION_PAIRS.keys(),
    );
    const candidate = candidateIndices[digest.at(-1) % candidateIndices.length];
    setSixBitIndex(digest, itemIndex, candidate);
  }
  return digest;
}

function manualMismatch(reference, mismatchType, seed) {
  const items = reference.items.map((item) => ({ ...item }));
  const substitutionTarget = targetForSubstitution(mismatchType, items.length);
  let mismatchPosition;

  if (substitutionTarget !== null) {
    items[substitutionTarget] = replacementItem(
      reference.kind,
      items[substitutionTarget],
      deterministicStudyBytes(`${seed}:replacement`, 1)[0] % 31,
    );
    mismatchPosition = `item ${substitutionTarget + 1}`;
  } else if (mismatchType === MISMATCH_TYPES.ADJACENT_TRANSPOSITION) {
    const index = differingAdjacentIndex(items);
    [items[index], items[index + 1]] = [items[index + 1], items[index]];
    mismatchPosition = `items ${index + 1} and ${index + 2}`;
  } else if (mismatchType === MISMATCH_TYPES.OMITTED_GROUP) {
    const index = Math.floor(items.length / 2);
    items.splice(index, 1);
    mismatchPosition = `item ${index + 1}`;
  } else if (mismatchType === MISMATCH_TYPES.DUPLICATED_GROUP) {
    const index = Math.floor(items.length / 2);
    items.splice(index, 0, { ...items[index] });
    mismatchPosition = `item ${index + 1}`;
  } else if (mismatchType === MISMATCH_TYPES.VISUALLY_SIMILAR_EMOJI) {
    const index = Math.floor(items.length / 2);
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
    mismatchPosition = `item ${index + 1}`;
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
  seed,
  digest: suppliedDigest = null,
  taskId = "T001",
}) {
  if (!CONDITION_BY_ID[conditionId]) {
    throw new Error(`unknown study condition: ${conditionId}`);
  }
  if (
    mismatchType !== null &&
    !mismatchTypesForCondition(conditionId).includes(mismatchType)
  ) {
    throw new Error(
      `mismatch type ${mismatchType} is not applicable to ${conditionId}`,
    );
  }

  const hasSeed = typeof seed === "string";
  const hasSuppliedDigest = suppliedDigest !== null;
  if (hasSeed === hasSuppliedDigest) {
    throw new Error("provide exactly one deterministic seed or study digest");
  }
  const digest =
    suppliedDigest === null
      ? digestForTask(seed, conditionId, mismatchType)
      : validateStudyDigest(suppliedDigest).slice();
  const taskSeed = suppliedDigest === null ? seed : bytesToHex(digest);
  const reference = representationFor(conditionId, digest);
  let comparison = reference;
  let mismatchPosition = null;

  if (mismatchType === MISMATCH_TYPES.DIFFERENT_FULL_QR) {
    const comparisonDigest = digest.slice();
    const location =
      deterministicStudyBytes(`${taskSeed}:qr-difference`, 1)[0] % 32;
    comparisonDigest[location] ^= 0x01;
    comparison = representationFor(conditionId, comparisonDigest);
    mismatchPosition = `digest byte ${location + 1}`;
  } else if (mismatchType !== null) {
    ({ comparison, mismatchPosition } = manualMismatch(
      reference,
      mismatchType,
      taskSeed,
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
    conditionLabel: CONDITION_BY_ID[conditionId].label,
    displayedBits: CONDITION_BY_ID[conditionId].bits,
    groundTruth: isMatch ? "match" : "mismatch",
    mismatchType: mismatchType ?? "none",
    mismatchPosition,
    reference,
    comparison,
  });
}

export function generateStudyTasks({ conditionIds, seed, randomize = true }) {
  if (!Array.isArray(conditionIds) || conditionIds.length === 0) {
    throw new Error("select at least one study condition");
  }
  if (new Set(conditionIds).size !== conditionIds.length) {
    throw new Error("study conditions must not be duplicated");
  }

  const pending = [];
  for (const conditionId of conditionIds) {
    pending.push({ conditionId, mismatchType: null });
    for (const mismatchType of mismatchTypesForCondition(conditionId)) {
      pending.push({ conditionId, mismatchType });
    }
  }

  const ordered = randomize
    ? shuffleStudyItems(pending, `${seed}:task-order`)
    : pending;

  return Object.freeze(
    ordered.map((definition, index) =>
      createStudyTask({
        ...definition,
        seed: `${seed}:task:${index}`,
        taskId: `T${String(index + 1).padStart(3, "0")}`,
      }),
    ),
  );
}

export function generateInteractiveStudyTasks({
  conditionIds,
  orderSeed,
  randomize = true,
  randomBytes = randomStudyBytes,
}) {
  if (!Array.isArray(conditionIds) || conditionIds.length === 0) {
    throw new Error("select at least one study condition");
  }
  if (new Set(conditionIds).size !== conditionIds.length) {
    throw new Error("study conditions must not be duplicated");
  }
  if (typeof orderSeed !== "string" || orderSeed.length === 0) {
    throw new Error("an interactive ordering seed is required");
  }

  const pending = [];
  for (const conditionId of conditionIds) {
    if (!CONDITION_BY_ID[conditionId]) {
      throw new Error(`unknown study condition: ${conditionId}`);
    }
    pending.push({ conditionId, mismatchType: null });
    for (const mismatchType of mismatchTypesForCondition(conditionId)) {
      pending.push({ conditionId, mismatchType });
    }
  }

  const ordered = randomize
    ? shuffleStudyItems(pending, `${orderSeed}:task-order`)
    : pending;

  return Object.freeze(
    ordered.map((definition, index) =>
      createStudyTask({
        ...definition,
        digest: interactiveDigestForTask(
          definition.conditionId,
          definition.mismatchType,
          randomBytes,
        ),
        taskId: `T${String(index + 1).padStart(3, "0")}`,
      }),
    ),
  );
}

export function createInteractiveStudySeed() {
  return bytesToHex(randomStudyBytes(16));
}
