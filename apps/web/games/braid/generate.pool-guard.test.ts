import { describe, expect, it, vi } from "vitest";

vi.mock("@/content/braid.json", () => ({
  default: [{ theme: "Only easy set", words: ["ABCD", "EFGH"], difficulty: "easy" }],
}));

describe("generate: missing content-pack tag", () => {
  it("throws a clear error rather than silently picking from the wrong pool", async () => {
    const { generate } = await import("./generate");
    expect(() => generate(0, "hard")).toThrow(/No Braid word sets tagged "hard"/);
  });
});
