import { IDENTITY_FILE_MIME, IDENTITY_FILE_NAME } from "./identity-file.js";

export function downloadEncryptedIdentityFile(
  bytes,
  { documentObject = document, urlObject = URL, BlobConstructor = Blob } = {},
) {
  if (!(bytes instanceof Uint8Array)) {
    throw new TypeError("encrypted identity file must be bytes");
  }

  const blob = new BlobConstructor([bytes], { type: IDENTITY_FILE_MIME });
  const objectUrl = urlObject.createObjectURL(blob);
  const anchor = documentObject.createElement("a");
  anchor.download = IDENTITY_FILE_NAME;
  anchor.href = objectUrl;
  anchor.hidden = true;
  documentObject.body.append(anchor);
  try {
    anchor.click();
  } finally {
    anchor.remove();
    urlObject.revokeObjectURL(objectUrl);
  }
}
