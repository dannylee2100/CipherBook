import { fileURLToPath } from "node:url";

import { defineConfig } from "vite";

const experimentRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  root: experimentRoot,
  server: {
    host: "127.0.0.1",
    port: 4173,
    strictPort: true,
    hmr: false,
  },
  preview: {
    host: "127.0.0.1",
    port: 4173,
    strictPort: true,
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
  },
});
