export async function copyTextFromUserGesture(text) {
  if (typeof text !== "string" || text.length === 0) {
    throw new Error("there is no text to copy");
  }
  if (!navigator.clipboard?.writeText) {
    throw new Error("clipboard writing is unavailable in this browser context");
  }
  await navigator.clipboard.writeText(text);
}
