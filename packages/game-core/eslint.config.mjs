import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["dist/**", "coverage/**", "*.config.mjs", "vitest.config.ts"],
  },
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-non-null-assertion": "error",
    },
  },
);
