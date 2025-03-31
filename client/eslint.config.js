import ts from "typescript-eslint";
import reactRecommended from "eslint-plugin-react/configs/recommended.js";
import prettier from "eslint-config-prettier";
import reactHooks from "eslint-plugin-react-hooks";
import tsParser from "@typescript-eslint/parser";
import globals from "globals";

export default [
  ...ts.configs.recommended,
  reactRecommended,
  {
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
      parser: tsParser,
      parserOptions: {
        // Added for full TS support
        ecmaFeatures: {
          jsx: true,
        },
        project: true, // Enables type-aware linting
        sourceType: "module",
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  {
    ignores: [
      "dist/**",
      ".vite/**",
      "node_modules/**",
      "**/*.d.ts",
      "**/vite.config.ts",
      "**/*.config.js",
      "**/eslint.config.js",
    ],
  },
  prettier,
];
