import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import prettier from "eslint-config-prettier/flat";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores(["build/**", "coverage/**"]),
  {
    files: ["**/*.ts", "**/*.mts"],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "no-console": "error",
    },
  },
  {
    // The public contract must not be a side effect of type inference.
    files: ["lib/**/*.ts"],
    rules: { "@typescript-eslint/explicit-module-boundary-types": "error" },
  },
  prettier,
]);
