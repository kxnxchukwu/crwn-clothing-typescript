import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import jsxA11y from "eslint-plugin-jsx-a11y";
import prettier from "eslint-config-prettier";
import globals from "globals";

export default tseslint.config(
  { ignores: ["dist", "dev-dist", "coverage", ".netlify", "docs"] },

  js.configs.recommended,
  tseslint.configs.recommended,

  // Browser app
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: { globals: globals.browser },
  },
  reactHooks.configs.flat["recommended-latest"],
  reactRefresh.configs.vite,
  jsxA11y.flatConfigs.recommended,

  // Netlify functions, config files and Node-side tests
  {
    files: ["netlify/**/*.ts", "tests/**/*.ts", "*.{js,mjs,mts}"],
    languageOptions: { globals: globals.node },
  },

  // Vitest globals (describe, it, expect, vi) in every test file
  {
    files: ["**/*.test.{ts,tsx}"],
    languageOptions: { globals: globals.vitest },
  },

  // Formatting is Prettier's job; turn off rules that would fight it.
  prettier,
);
