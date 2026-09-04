import { describe, expect, it, vi } from "vitest";
import type * as RulesModule from "@boardatwork/rules";

vi.mock("@boardatwork/rules", async (importOriginal) => {
  const actual = await importOriginal<typeof RulesModule>();
  return {
    ...actual,
    // Every rule now rejects every word, so no rule can ever find 3
    // matching examples in the word pool.
    RULES: actual.RULES.map((rule) => ({ ...rule, test: () => false })),
  };
});

describe("generate: word-pool shortfall guard", () => {
  it("throws a clear error rather than silently generating too few examples", async () => {
    const { generate } = await import("./generate");
    expect(() => generate(0, "easy")).toThrow(/fewer than 3 matches/);
  });
});
