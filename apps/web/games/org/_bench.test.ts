import { describe, expect, it } from "vitest";
import { generate } from "./generate";

describe("bench", () => {
  it("times a handful of generate() calls", () => {
    for (let i = 0; i < 5; i += 1) {
      const start = performance.now();
      const puzzle = generate(i, "medium");
      const ms = performance.now() - start;
      // eslint-disable-next-line no-console
      console.log(`seed ${i}: ${ms.toFixed(1)}ms, ${puzzle.clues.length} clues`);
    }
    expect(true).toBe(true);
  });
});
