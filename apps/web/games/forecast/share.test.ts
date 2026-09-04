import { describe, expect, it } from "vitest";
import * as engine from "./engine";
import type { ForecastPuzzle } from "./generate";
import { shareGrid } from "./share";
import type { ForecastQuestion } from "@/lib/content/forecast-schema";

function fixturePuzzle(): ForecastPuzzle {
  const questions: ForecastQuestion[] = [
    { id: "q1", question: "Q1?", answer: 100, unit: "u", sourceUrl: "https://example.com/1", min: 0, max: 200, difficulty: "easy" },
    { id: "q2", question: "Q2?", answer: 50, unit: "u", sourceUrl: "https://example.com/2", min: 0, max: 100, difficulty: "medium" },
    { id: "q3", question: "Q3?", answer: 10, unit: "u", sourceUrl: "https://example.com/3", min: 0, max: 20, difficulty: "hard" },
    { id: "q4", question: "Q4?", answer: 1000, unit: "u", sourceUrl: "https://example.com/4", min: 0, max: 2000, difficulty: "easy" },
    { id: "q5", question: "Q5?", answer: 5, unit: "u", sourceUrl: "https://example.com/5", min: 0, max: 10, difficulty: "medium" },
  ];
  return { seed: 0, difficulty: "medium", questions };
}

function submitValue(state: engine.ForecastState, value: number): engine.ForecastState {
  let next = engine.reduce(state, { type: "setValue", value });
  next = engine.reduce(next, { type: "submit" });
  return next;
}

describe("shareGrid", () => {
  it("shows the total points, one band emoji per question, and no numbers", () => {
    let state = engine.init(fixturePuzzle());
    // 3, 0, 2, 1, 3 -> 9 total
    state = submitValue(state, 100); // perfect -> 🟩
    state = submitValue(state, 5000); // way off -> ⬛
    state = submitValue(state, 11); // within 15% -> 🟨
    state = submitValue(state, 1350); // within 40% -> 🟧
    state = submitValue(state, 5); // perfect -> 🟩

    const text = shareGrid(state);
    // SPEC §2.4: "one emoji line per question" — each band mark is its own line.
    expect(text).toBe("Forecast 9/15\n\n🟩\n⬛\n🟨\n🟧\n🟩");
    expect(text).not.toMatch(/100|50|10|1000|5000|11|1350/);
  });

  it("appends 💡 per hint used", () => {
    let state = engine.reduce(engine.init(fixturePuzzle()), { type: "hint" });
    for (const guess of [100, 50, 10, 1000, 5]) {
      state = submitValue(state, guess);
    }
    const text = shareGrid(state);
    expect(text.startsWith("Forecast 15/15 💡")).toBe(true);
  });

  it("shows an empty placeholder for questions not yet submitted", () => {
    const state = engine.init(fixturePuzzle());
    const text = shareGrid(state);
    expect(text).toBe("Forecast 0/15\n\n⬜\n⬜\n⬜\n⬜\n⬜");
  });
});
