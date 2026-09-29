import { defineConfig, devices } from "@playwright/test";

// End-to-end tests of the library through the playground (demo/), in a real
// browser. They need the playground running: PLAYGROUND_URL points at it
// (http://localhost:5180 by default, as `pnpm dev -- --port 5180` or the
// devzone's form-builder service serve it).
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  workers: 2,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.PLAYGROUND_URL ?? "http://localhost:5180",
    viewport: { width: 1440, height: 900 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } }],
});
