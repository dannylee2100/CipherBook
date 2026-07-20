import { fileURLToPath } from "node:url";

import { defineConfig } from "vite";

const alphaRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  root: alphaRoot,
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
