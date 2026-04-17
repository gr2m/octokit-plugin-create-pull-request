import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: ["src/**/*.ts"],
      reporter: ["html"],
      thresholds: {
        lines: 99,
        statements: 98,
        branches: 97,
        functions: 100,
      },
    },
  },
});
