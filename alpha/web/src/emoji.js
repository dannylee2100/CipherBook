import { emojiEntries } from "../../../experiments/milestone-2b/src/representations.js";

export const ALPHA_EMOJI_COUNT = 16;
export const ALPHA_EMOJI_BITS = 96;

export function deriveEmojiConvenience(digest) {
  return Object.freeze(emojiEntries(digest, ALPHA_EMOJI_COUNT));
}
