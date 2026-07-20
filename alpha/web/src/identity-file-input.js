import {
  IDENTITY_FILE_LAYOUT,
  IDENTITY_FILE_MAX_BYTES,
  IdentityFileError,
} from "./identity-file.js";

export async function readSelectedIdentityFile(files) {
  if (!files || files.length !== 1) {
    throw new IdentityFileError(
      "file-count",
      "Select exactly one encrypted identity file.",
    );
  }

  const [file] = files;
  if (!Number.isSafeInteger(file.size) || file.size === 0) {
    throw new IdentityFileError(
      "file-empty",
      "The selected identity file is empty.",
    );
  }
  if (file.size > IDENTITY_FILE_MAX_BYTES) {
    throw new IdentityFileError(
      "file-oversized",
      `The selected identity file exceeds ${IDENTITY_FILE_MAX_BYTES} bytes.`,
    );
  }
  if (file.size !== IDENTITY_FILE_LAYOUT.totalBytes) {
    throw new IdentityFileError(
      "file-length",
      `Identity file must be exactly ${IDENTITY_FILE_LAYOUT.totalBytes} bytes.`,
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.length !== IDENTITY_FILE_LAYOUT.totalBytes) {
    throw new IdentityFileError(
      "file-length",
      `Identity file must be exactly ${IDENTITY_FILE_LAYOUT.totalBytes} bytes.`,
    );
  }
  return bytes;
}
