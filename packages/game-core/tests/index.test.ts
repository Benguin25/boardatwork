import { describe, expect, it } from "vitest";
import * as gameCore from "../src/index";

describe("package barrel exports", () => {
  it("re-exports the public API", () => {
    expect(typeof gameCore.createRng).toBe("function");
    expect(typeof gameCore.hashSeed).toBe("function");
    expect(typeof gameCore.localDateKey).toBe("function");
    expect(typeof gameCore.encodeChallengeCode).toBe("function");
    expect(typeof gameCore.decodeChallengeCode).toBe("function");
    expect(typeof gameCore.MemoryAdapter).toBe("function");
    expect(typeof gameCore.computeStats).toBe("function");
    expect(gameCore.DifficultySchema.parse("easy")).toBe("easy");
  });
});
