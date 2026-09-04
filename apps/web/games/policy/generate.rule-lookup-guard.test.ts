import { describe, expect, it, vi } from "vitest";
import type * as RulesModule from "@boardatwork/rules";

vi.mock("@boardatwork/rules", async (importOriginal) => {
  const actual = await importOriginal<typeof RulesModule>();
  return {
    ...actual,
    // Drop "double-letter" from the exported RULES while leaving it in
    // generate.ts's own (unmocked) EASY_RULE_IDS tier list, so a seed that
    // picks it as the true rule id hits the "rule id not found" guard.
    RULES: actual.RULES.filter((rule) => rule.id !== "double-letter"),
  };
});

describe("generate: unknown true-rule-id guard", () => {
  it("throws a clear error if the picked rule id can't be found in RULES", async () => {
    const { generate } = await import("./generate");
    // Seed 1 + "easy" deterministically picks "double-letter" as the true
    // rule (proven against the real RULES list; see generate.test.ts's
    // determinism coverage for why this stays stable).
    expect(() => generate(1, "easy")).toThrow(/Unknown rule id "double-letter"/);
  });
});
