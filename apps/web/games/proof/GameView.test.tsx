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

  it("allows Check even before anything is flagged", () => {
    const puzzle = proofGame.generate(2, "medium");
    const state = proofGame.init(puzzle);
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
});
