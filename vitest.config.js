import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: ["src/**/*.ts"],
      reporter: ["html"],
      thresholds: {
        100: true,
      },
    },
  },
});
