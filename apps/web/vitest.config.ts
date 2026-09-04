import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  esbuild: {
    jsx: "automatic",
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["node_modules", ".next", "tests/e2e/**"],
    passWithNoTests: true,
    coverage: {
      provider: "v8",
      include: ["lib/**", "games/**", "skins/**", "components/**"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
