import { SYNTHETIC_LABELS } from "./constants.js";
import { encodeQrDigest } from "./qr.js";
import { groupFullDigestHex, hexToBytes } from "./representations.js";

function textElement(name, text, className = "") {
  const element = document.createElement(name);
  element.textContent = text;
  if (className) {
    element.className = className;
  }
  return element;
}

function appendOrdinalItem(list, item, kind) {
  const row = document.createElement("li");
  row.className = "sequence-item";
  row.append(textElement("span", String(item.position), "ordinal"));

  if (kind === "emoji") {
    row.setAttribute(
      "aria-label",
      `Position ${item.position}: ${item.label}; ${item.codePoints}`,
    );
    const symbol = textElement("span", item.symbol, "emoji-symbol");
    symbol.setAttribute("aria-hidden", "true");
    row.append(symbol, textElement("span", item.label, "item-label"));
  } else if (kind === "spoken") {
    row.setAttribute("aria-label", `Position ${item.position}: ${item.label}`);
    row.append(textElement("span", item.label, "spoken-label"));
  } else if (kind === "words") {
    row.setAttribute("aria-label", `Position ${item.position}: ${item.word}`);
    row.append(textElement("span", item.word, "word-label"));
  } else if (kind === "hex") {
    row.setAttribute("aria-label", `Group ${item.position}: ${item.group}`);
    row.append(textElement("span", item.group, "hex-label"));
  }

  list.append(row);
}

function renderQr(container, representation, side) {
  const digest = hexToBytes(representation.digestHex);
  const encoded = encodeQrDigest(digest);
  const figure = document.createElement("figure");
  figure.className = "qr-figure";
  const image = document.createElement("img");
  image.className = "qr-image";
  image.src = encoded.dataUrl;
  image.alt = `${side} QR containing one complete 256-bit synthetic study value`;
  image.dataset.qrPayload = encoded.payload;
  figure.append(image);
  figure.append(
    textElement(
      "figcaption",
      `${side} QR · all 256 synthetic bits · experiment-only prefix`,
    ),
  );
  container.append(figure);
  container.append(
    textElement("p", "Full hexadecimal text fallback:", "field-label"),
  );
  container.append(
    textElement("code", groupFullDigestHex(digest), "full-hex-fallback"),
  );
}

export function renderRepresentation(container, representation, side) {
  container.replaceChildren();
  container.dataset.condition = representation.conditionId;
  container.dataset.displayedBits = String(representation.bits);

  if (representation.kind === "qr") {
    renderQr(container, representation, side);
    return;
  }

  const list = document.createElement("ol");
  list.className = `sequence ${representation.kind}-sequence`;
  list.setAttribute("aria-label", `${side} ${representation.label}`);
  for (const item of representation.items) {
    appendOrdinalItem(list, item, representation.kind);
  }
  container.append(list);
}

export function renderSyntheticLabels(container) {
  container.replaceChildren(
    ...SYNTHETIC_LABELS.map((label) => textElement("span", label)),
  );
}
