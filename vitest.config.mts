import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Isomorphic library: server paths run in node, browser paths in a real DOM.
    projects: [
      {
        extends: true,
        test: {
          name: "node",
          environment: "node",
          include: ["__tests__/**/*.test.ts"],
          exclude: ["__tests__/**/*.dom.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "jsdom",
          environment: "jsdom",
          include: ["__tests__/**/*.dom.test.ts"],
        },
      },
    ],
    // Call history must not leak between tests: a module mock created once per file is shared by
    // every test in it.
    clearMocks: true,
    restoreMocks: true,
    unstubGlobals: true,
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      include: ["lib/**/*.ts"],
      // Type-only files have no behaviour; the logic-free barrel is measured by index.test.ts.
      exclude: ["lib/index.ts", "lib/types/**"],
      thresholds: { 100: true },
    },
  },
});
