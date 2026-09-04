import { describe, expect, it } from "vitest";
import {
  SHARE_EMOJI,
  buildShareGrid,
  hintSuffix,
  shareGridHeader,
  shareLine,
} from "../src/share-grid";

describe("shareLine", () => {
  it("joins emoji marks with no separator or letters", () => {
    expect(shareLine([SHARE_EMOJI.correct, SHARE_EMOJI.wrong])).toBe("🟩⬛");
  });

  it("handles an empty line", () => {
    expect(shareLine([])).toBe("");
  });
});

describe("hintSuffix", () => {
  it("is empty when no hints were used", () => {
    expect(hintSuffix(0)).toBe("");
  });

  it("repeats the hint emoji once per hint used", () => {
    expect(hintSuffix(1)).toBe(" 💡");
    expect(hintSuffix(3)).toBe(" 💡💡💡");
  });
});

describe("shareGridHeader", () => {
  it("formats game, date, and checks used", () => {
    expect(shareGridHeader("Braid", "2026-09-04", 2, 5)).toBe(
      "Braid 2026-09-04 2/5",
    );
  });
});

describe("buildShareGrid", () => {
  it("assembles header, blank line, and check lines", () => {
    const grid = buildShareGrid("Braid 2026-09-04 2/5", ["🟩🟩⬛", "🟩🟩🟩"]);
    expect(grid).toBe("Braid 2026-09-04 2/5\n\n🟩🟩⬛\n🟩🟩🟩");
  });

  it("appends an optional footer", () => {
    const grid = buildShareGrid("Braid 2026-09-04 2/5", ["🟩🟩⬛"], "boardatwork.example/p/abc");
    expect(grid).toBe(
      "Braid 2026-09-04 2/5\n\n🟩🟩⬛\n\nboardatwork.example/p/abc",
    );
  });
});
