import { defineConfig } from "vitest/config";

// Checks the built package (dist/) as consumers get it. Run through
// `pnpm test:package`, which builds first.
export default defineConfig({
  test: {
    include: ["tests/package/**/*.test.ts"],
    environment: "node",
    setupFiles: ["tests/package/requireBuild.ts"],
    testTimeout: 120_000,
  },
});
