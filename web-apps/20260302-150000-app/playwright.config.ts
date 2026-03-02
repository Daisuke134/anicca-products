import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  use: {
    baseURL: "http://localhost:3077",
    headless: true,
  },
  webServer: {
    command: "npx next dev -p 3077",
    port: 3077,
    reuseExistingServer: false,
    timeout: 60000,
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
});
