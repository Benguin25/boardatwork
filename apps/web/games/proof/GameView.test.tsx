import { render as rtlRender, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { playSkin } from "@/skins/play";
import { proofGame } from "./index";

describe("proofGame.render (via Play skin)", () => {
  it("renders every passage word, passes, actions, feedback, and log", () => {
    const puzzle = proofGame.generate(2, "medium");
    const state = proofGame.init(puzzle);
    const dispatch = vi.fn();

    rtlRender(<>{proofGame.render(state, dispatch, playSkin)}</>);

    const buttons = screen.getAllByRole("button");
    // Every passage word plus Hint and Check.
    expect(buttons).toHaveLength(puzzle.words.length + 2);
    expect(screen.getByText(/Checks/)).toBeInTheDocument();
    expect(screen.getByText(/Hints/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Hint/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Check" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(state.message);
  });

  it("dispatches a toggleFlag move with the right index when a word is clicked", () => {
    const puzzle = proofGame.generate(2, "medium");
    const state = proofGame.init(puzzle);
    const dispatch = vi.fn();

    rtlRender(<>{proofGame.render(state, dispatch, playSkin)}</>);
    const buttons = screen.getAllByRole("button");
    buttons[3]!.click();

    expect(dispatch).toHaveBeenCalledWith({ type: "toggleFlag", index: 3 });
  });

  it("disables Check until at least one word is flagged", () => {
    const puzzle = proofGame.generate(2, "medium");
    const state = proofGame.init(puzzle);
    rtlRender(<>{proofGame.render(state, vi.fn(), playSkin)}</>);
    expect(screen.getByRole("button", { name: "Check" })).toBeDisabled();
  });

  it("enables Check once a word is flagged", () => {
    const puzzle = proofGame.generate(2, "medium");
    let state = proofGame.init(puzzle);
    state = { ...state, flagged: state.flagged.map((_, i) => i === 0) };
    rtlRender(<>{proofGame.render(state, vi.fn(), playSkin)}</>);
    expect(screen.getByRole("button", { name: "Check" })).toBeEnabled();
  });

  it("disables both actions once the puzzle is done", () => {
    const puzzle = proofGame.generate(2, "medium");
    const state = { ...proofGame.init(puzzle), done: true, won: true, message: "Cleared!" };
    rtlRender(<>{proofGame.render(state, vi.fn(), playSkin)}</>);
    expect(screen.getByRole("button", { name: "Check" })).toBeDisabled();
    expect(screen.getByRole("button", { name: /^Hint/ })).toBeDisabled();
  });

  it("shows 'No hints left' once hints are exhausted", () => {
    const puzzle = proofGame.generate(2, "medium");
    const state = { ...proofGame.init(puzzle), hintsUsed: proofGame.meta.hints };
    rtlRender(<>{proofGame.render(state, vi.fn(), playSkin)}</>);
    expect(screen.getByRole("button", { name: "No hints left" })).toBeInTheDocument();
  });

  it("shows remaining hints once at least one has been used", () => {
    const puzzle = proofGame.generate(2, "medium");
    const state = { ...proofGame.init(puzzle), hintsUsed: 1 };
    rtlRender(<>{proofGame.render(state, vi.fn(), playSkin)}</>);
    expect(screen.getByRole("button", { name: `Hint (${String(proofGame.meta.hints - 1)} left)` })).toBeInTheDocument();
  });

  it("dispatches a hint move when Hint is clicked", () => {
    const puzzle = proofGame.generate(2, "medium");
    const state = proofGame.init(puzzle);
    const dispatch = vi.fn();
    rtlRender(<>{proofGame.render(state, dispatch, playSkin)}</>);
    screen.getByRole("button", { name: /^Hint/ }).click();
    expect(dispatch).toHaveBeenCalledWith({ type: "hint" });
  });

  it("dispatches a check move when Check is clicked", () => {
    const puzzle = proofGame.generate(2, "medium");
    let state = proofGame.init(puzzle);
    state = { ...state, flagged: state.flagged.map((_, i) => i === 0) };
    const dispatch = vi.fn();
    rtlRender(<>{proofGame.render(state, dispatch, playSkin)}</>);
    screen.getByRole("button", { name: "Check" }).click();
    expect(dispatch).toHaveBeenCalledWith({ type: "check" });
  });

  it("shows an error tone once the puzzle is lost", () => {
    const puzzle = proofGame.generate(2, "medium");
    const state = { ...proofGame.init(puzzle), done: true, won: false, message: "Out of checks." };
    rtlRender(<>{proofGame.render(state, vi.fn(), playSkin)}</>);
    expect(screen.getByRole("status")).toHaveTextContent("Out of checks.");
  });

  it("renders a flagged (selected) word and a hint-locked word without error", () => {
    const puzzle = proofGame.generate(2, "medium");
    let state = proofGame.init(puzzle);
    state = {
      ...state,
      flagged: state.flagged.map((_, i) => i === 0 || i === 1),
      locked: state.locked.map((_, i) => i === 1),
    };
    rtlRender(<>{proofGame.render(state, vi.fn(), playSkin)}</>);
    expect(screen.getAllByRole("button")).toHaveLength(puzzle.words.length + 2);
  });
});
