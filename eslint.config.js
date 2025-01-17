// @ts-check
import js from "@eslint/js";
import ts from "typescript-eslint";
import prettierEslint from "eslint-config-prettier";
import tsdoc from "eslint-plugin-tsdoc";
import * as importPlugin from "eslint-plugin-import-x";
import { includeIgnoreFile } from "@eslint/compat";

import * as path from "path";

const IS_LINTING_FOR_PRODUCTION = false;
const IS_FAST_LINTING = true;

const rules_overrides = {};

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
if (IS_FAST_LINTING) {
  Object.assign(rules_overrides, {
    "tsdoc/syntax": "off"

  });
}
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
if (!IS_LINTING_FOR_PRODUCTION) {
  Object.assign(rules_overrides, {
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/no-empty-object-type": "off",
  });
}

export default ts.config(
  js.configs.recommended,
  ...ts.configs.strictTypeChecked,
  prettierEslint,
  importPlugin.flatConfigs.recommended,

  // Automatically includes the .gitignore file in ESLint's ignore list.
  // I find this the most intuitive behavior.
  includeIgnoreFile(path.resolve(import.meta.dirname, ".gitignore")),
  {
    languageOptions: {
      ecmaVersion: 2023,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    ignores: [".yarn"],
    plugins: {
      tsdoc,
    },
    settings: {
      "import-x/resolver": "typescript",
    },
    rules: {
      // Allow namespaces.
      "@typescript-eslint/no-namespace": "off",

      // Allow destructuring via `let` even if some of the variables are not reassigned (i.e. they could be `const`).
      "prefer-const": ["error", {
        destructuring: "all"
      }],

      // Avoiding `any` is good practice in TypeScript
      // Many users of TypeScript struggle to avoid `any` though and this rule helps make sure they do.
      // `foundry-vtt-types` ships with common helper types like `AnyObject`, `AnyArray`, `AnyFunction`, etc.
      // If you're still having problems feel free to ask for help avoiding `any` on the League Of Extraordinary developers Discord.
      // However if you an very experienced user of TypeScript there are some niche uses of `any` and you can disable this rule, though using a `eslint-ignore` directive would be recommended.
      // "@typescript-eslint/no-explicit-any": "off",

      "@typescript-eslint/no-unused-vars": [
        "error",
        // Ignore unused parameters and caught errors that are prefixed with an underscore.
        // These are generally the two cases where throwing away a variable makes sense.
        {
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      "@typescript-eslint/restrict-template-expressions": [
        "error",
        {
          allowBoolean: true,
          allowNumber: true,
        },
      ],

      // "@typescript-eslint/no-namespace": ["error", { allowDeclarations: true }],

      // Allow non-null assertions. Although this can be a hard-to-spot source of bugs, inconsistent type inference is a frequent issue, and the non-null assertion operator is the simplest and most elegant solution.
      "@typescript-eslint/no-non-null-assertion": "off",

      "tsdoc/syntax": "warn",
      ...rules_overrides
    },
  },
  {
    files: ["**/*.js"],
    rules: {
      "tsdoc/syntax": "off",
    },
  },
);
