export function nativeShareAvailable() {
  return typeof navigator.share === "function";
}

export async function shareCiphertextFromUserGesture(ciphertext) {
  if (typeof ciphertext !== "string" || ciphertext.length === 0) {
    throw new Error("there is no ciphertext to share");
  }
  if (!nativeShareAvailable()) {
    throw new Error("native sharing is unavailable");
  }
  try {
    await navigator.share({ text: ciphertext });
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return false;
    }
    throw new Error("native ciphertext sharing failed", { cause: error });
  }
}
