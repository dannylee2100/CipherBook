import { fileURLToPath } from "node:url";

import { defineConfig } from "vite";

const experimentRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  root: experimentRoot,
  server: {
    host: "127.0.0.1",
    port: 4174,
    strictPort: true,
    hmr: false,
  },
  preview: {
    host: "127.0.0.1",
    port: 4174,
    strictPort: true,
  },
  build: {
    modulePreload: { polyfill: false },
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
  },
});
