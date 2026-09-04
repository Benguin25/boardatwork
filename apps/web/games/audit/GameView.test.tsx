import { render as rtlRender, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { playSkin } from "@/skins/play";
import * as engine from "./engine";
import { auditGame } from "./index";

describe("auditGame.render (via Play skin)", () => {
  it("renders the grid, totals, passes, actions, feedback, and log", () => {
    const puzzle = auditGame.generate(2, "medium");
    const state = auditGame.init(puzzle);
    const dispatch = vi.fn();

    rtlRender(<>{auditGame.render(state, dispatch, playSkin)}</>);

    expect(screen.getAllByRole("button", { name: /^Row \d, column \d:/ })).toHaveLength(25);
    expect(screen.getByText(/Checks/)).toBeInTheDocument();
    expect(screen.getByText(/Hints/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Hint/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Check" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(state.message);
    for (const total of puzzle.rowTotals) {
      expect(screen.getByText(String(total))).toBeInTheDocument();
    }
  });

  it("dispatches a toggle move with the row-major cell index when a cell is clicked", () => {
    const puzzle = auditGame.generate(2, "medium");
    const state = auditGame.init(puzzle);
    const dispatch = vi.fn();

    rtlRender(<>{auditGame.render(state, dispatch, playSkin)}</>);
    const cells = screen.getAllByRole("button", { name: /^Row \d, column \d:/ });
    cells[7]!.click();

    expect(dispatch).toHaveBeenCalledWith({ type: "toggle", index: 7 });
  });

  it("disables Check until exactly k cells are flagged", () => {
    const puzzle = auditGame.generate(2, "medium");
    let state = auditGame.init(puzzle);
    rtlRender(<>{auditGame.render(state, vi.fn(), playSkin)}</>);
    expect(screen.getByRole("button", { name: "Check" })).toBeDisabled();

    state = { ...state, flagged: state.flagged.map((_, i) => i < puzzle.k) };
    rtlRender(<>{auditGame.render(state, vi.fn(), playSkin)}</>);
    expect(screen.getAllByRole("button", { name: "Check" })[1]).toBeEnabled();
  });

  it("disables both actions once the puzzle is done", () => {
    const puzzle = auditGame.generate(2, "medium");
    const state = { ...auditGame.init(puzzle), done: true, won: true, message: "Cleared!" };
    rtlRender(<>{auditGame.render(state, vi.fn(), playSkin)}</>);
    expect(screen.getByRole("button", { name: "Check" })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Hint/ })).toBeDisabled();
  });

  it("shows the intro log entry naming how many cells are altered", () => {
    const puzzle = auditGame.generate(2, "medium");
    const state = auditGame.init(puzzle);
    rtlRender(<>{auditGame.render(state, vi.fn(), playSkin)}</>);
    expect(screen.getByText(new RegExp(`${String(puzzle.k)} cells altered`))).toBeInTheDocument();
  });

  it("shows a remaining-hints count once at least one hint has been used", () => {
    const puzzle = auditGame.generate(2, "medium");
    const state = { ...auditGame.init(puzzle), hintsUsed: 1 };
    rtlRender(<>{auditGame.render(state, vi.fn(), playSkin)}</>);
    expect(screen.getByRole("button", { name: "Hint (2 left)" })).toBeInTheDocument();
  });

  it("shows a locked cell distinctly from a merely-flagged one", () => {
    const puzzle = auditGame.generate(2, "medium");
    let state = auditGame.init(puzzle);
    state = engine.reduce(state, { type: "hint" });
    rtlRender(<>{auditGame.render(state, vi.fn(), playSkin)}</>);
    const lockedIndex = state.locked.findIndex(Boolean);
    const buttons = screen.getAllByRole("button", { name: /^Row \d, column \d:/ });
    expect(buttons[lockedIndex]).toHaveAttribute("aria-label", expect.stringContaining(String(puzzle.displayedGrid[lockedIndex])));
  });

  it("shows an error tone when the puzzle ends without a win", () => {
    const puzzle = auditGame.generate(2, "medium");
    const state = { ...auditGame.init(puzzle), done: true, won: false, message: "Out of checks." };
    rtlRender(<>{auditGame.render(state, vi.fn(), playSkin)}</>);
    expect(screen.getByRole("status")).toHaveTextContent("Out of checks.");
  });

  it("shows 'No hints left' once every hint is used", () => {
    const puzzle = auditGame.generate(2, "medium");
    const state = { ...auditGame.init(puzzle), hintsUsed: 3 };
    rtlRender(<>{auditGame.render(state, vi.fn(), playSkin)}</>);
    expect(screen.getByRole("button", { name: "No hints left" })).toBeInTheDocument();
  });

  it("dispatches a hint move when Hint is clicked", () => {
    const puzzle = auditGame.generate(2, "medium");
    const state = auditGame.init(puzzle);
    const dispatch = vi.fn();
    rtlRender(<>{auditGame.render(state, dispatch, playSkin)}</>);
    screen.getByRole("button", { name: /^Hint/ }).click();
    expect(dispatch).toHaveBeenCalledWith({ type: "hint" });
  });

  it("dispatches a check move when Check is clicked and the board is ready", () => {
    const puzzle = auditGame.generate(2, "medium");
    let state = auditGame.init(puzzle);
    state = { ...state, flagged: state.flagged.map((_, i) => i < puzzle.k) };
    const dispatch = vi.fn();
    rtlRender(<>{auditGame.render(state, dispatch, playSkin)}</>);
    screen.getByRole("button", { name: "Check" }).click();
    expect(dispatch).toHaveBeenCalledWith({ type: "check" });
  });
});
