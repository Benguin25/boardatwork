import { FlatCompat } from "@eslint/eslintrc";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends(
    "next/core-web-vitals",
    "next/typescript",
    "plugin:jsx-a11y/recommended",
  ),
  {
    rules: {
      "jsx-a11y/no-autofocus": "off",
    },
  },
  {
    ignores: [
      ".next/**",
      "playwright-report/**",
      "test-results/**",
      "coverage/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
