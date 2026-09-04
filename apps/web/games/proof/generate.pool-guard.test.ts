import { describe, expect, it, vi } from "vitest";

vi.mock("@/content/proof.json", () => ({
  default: [{ id: "only-easy", words: ["a", "b"], impostorIndices: [0, 0, 0, 0, 0], difficulty: "easy" }],
}));

describe("generate: missing content-pack tag", () => {
  it("throws a clear error rather than silently picking from the wrong pool", async () => {
    const { generate } = await import("./generate");
    expect(() => generate(0, "hard")).toThrow(/No Proof passages tagged "hard"/);
  });
});
