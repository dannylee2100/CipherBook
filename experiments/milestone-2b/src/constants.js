export const STUDY_HARNESS_VERSION =
  "M2B-HARNESS-EXPERIMENT-UNSTABLE-2026-07-20";

export const STUDY_PLAN_VERSION = "M2B-MANUAL-STUDY-PLAN-EXPERIMENT-UNSTABLE-1";

export const STUDY_ARMS = Object.freeze([
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
]);

export const TASKS_PER_MANUAL_CONDITION = 4;

export const DIGEST_BYTES = 32;

export const SYNTHETIC_LABELS = Object.freeze([
  "SYNTHETIC STUDY VALUE",
  "NOT A KEY",
  "NOT A PASSWORD",
  "NOT A REAL CONTACT FINGERPRINT",
]);

export const MANUAL_CONDITION_DEFINITIONS = Object.freeze([
  Object.freeze({
    id: "emoji-48",
    label: "Visual emoji — 8 symbols",
    bits: 48,
    kind: "emoji",
  }),
  Object.freeze({
    id: "emoji-96",
    label: "Visual emoji — 16 symbols",
    bits: 96,
    kind: "emoji",
  }),
  Object.freeze({
    id: "emoji-144",
    label: "Visual emoji — 24 symbols",
    bits: 144,
    kind: "emoji",
  }),
  Object.freeze({
    id: "spoken-emoji-96",
    label: "Spoken emoji labels — 16 labels",
    bits: 96,
    kind: "spoken",
  }),
  Object.freeze({
    id: "words-96",
    label: "Word list — 12 words",
    bits: 96,
    kind: "words",
  }),
  Object.freeze({
    id: "hex-96",
    label: "Grouped hexadecimal — 6 groups",
    bits: 96,
    kind: "hex",
  }),
]);

export const QR_TECHNICAL_DEFINITION = Object.freeze({
  id: "qr-technical-256",
  label: "Full-digest QR technical demonstration",
  bits: 256,
  kind: "qr",
});

// Manual study conditions and the QR technical demonstration share only the
// experiment-only representation renderer. QR is not a participant condition.
export const REPRESENTATION_DEFINITIONS = Object.freeze([
  ...MANUAL_CONDITION_DEFINITIONS,
  QR_TECHNICAL_DEFINITION,
]);

export const CONDITION_BY_ID = Object.freeze(
  Object.fromEntries(
    REPRESENTATION_DEFINITIONS.map((condition) => [condition.id, condition]),
  ),
);

export const PARTICIPANT_RESPONSES = Object.freeze([
  "match",
  "mismatch",
  "unsure",
]);

export const ANONYMOUS_CODE_PATTERN = /^P[0-9]{2,4}$/u;
