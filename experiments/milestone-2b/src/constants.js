export const STUDY_HARNESS_VERSION =
  "M2B-HARNESS-EXPERIMENT-UNSTABLE-2026-07-20";

export const DIGEST_BYTES = 32;

export const SYNTHETIC_LABELS = Object.freeze([
  "SYNTHETIC STUDY VALUE",
  "NOT A KEY",
  "NOT A PASSWORD",
  "NOT A REAL CONTACT FINGERPRINT",
]);

export const CONDITION_DEFINITIONS = Object.freeze([
  Object.freeze({
    id: "qr-256",
    label: "Full-digest QR",
    bits: 256,
    kind: "qr",
  }),
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

export const CONDITION_BY_ID = Object.freeze(
  Object.fromEntries(
    CONDITION_DEFINITIONS.map((condition) => [condition.id, condition]),
  ),
);

export const PARTICIPANT_RESPONSES = Object.freeze([
  "match",
  "mismatch",
  "unsure",
]);

export const ANONYMOUS_CODE_PATTERN = /^P[0-9]{2,4}$/u;
