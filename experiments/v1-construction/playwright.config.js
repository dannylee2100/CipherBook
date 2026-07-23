import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./test",
  testMatch: "browser.spec.js",
  outputDir: "./test-results",
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:4186",
  },
  webServer: {
    command: "npm run v1-construction:dev",
    url: "http://127.0.0.1:4186",
    reuseExistingServer: false,
    timeout: 30_000,
  },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
    { name: "firefox", use: { browserName: "firefox" } },
  ],
});
