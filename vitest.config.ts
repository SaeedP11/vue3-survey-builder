import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: "jsdom",
    include: ["tests/unit/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
    restoreMocks: true,
    // Mounting a full SurveyJS creator is slow, more so under coverage
    testTimeout: 30_000,
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,vue}"],
      exclude: ["src/types/**", "src/utils/prefixPrompts.ts"],
      reporter: ["text-summary", "html"],
      reportsDirectory: "coverage",
    },
  },
});
