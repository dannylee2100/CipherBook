import { fileURLToPath } from "node:url";

import { defineConfig } from "vite";

const alphaRoot = fileURLToPath(new URL(".", import.meta.url));
const base = process.env.CIPHERBOOK_BASE_PATH ?? "/";
const buildLabel = process.env.CIPHERBOOK_BUILD_LABEL ?? "development-preview";
const buildCommit = process.env.CIPHERBOOK_BUILD_COMMIT ?? "local-working-tree";

if (!base.startsWith("/") || !base.endsWith("/")) {
  throw new Error("CIPHERBOOK_BASE_PATH must start and end with a slash.");
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export default defineConfig({
  root: alphaRoot,
  base,
  plugins: [
    {
      name: "cipherbook-build-metadata",
      transformIndexHtml(html) {
        return html
          .replaceAll("CIPHERBOOK_BUILD_LABEL", escapeHtml(buildLabel))
          .replaceAll("CIPHERBOOK_BUILD_COMMIT", escapeHtml(buildCommit));
      },
    },
  ],
  server: {
    host: "127.0.0.1",
    port: 4175,
    strictPort: true,
    hmr: false,
  },
  preview: {
    host: "127.0.0.1",
    port: 4175,
    strictPort: true,
  },
  build: {
    modulePreload: { polyfill: false },
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
  },
});
