import { render as rtlRender, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { playSkin } from "@/skins/play";
import { orgGame } from "./index";

describe("orgGame.render (via Play skin)", () => {
  it("renders the grid, clue log, passes, actions, and feedback", () => {
    const puzzle = orgGame.generate(2, "medium");
    const state = orgGame.init(puzzle);
    const dispatch = vi.fn();

    rtlRender(<>{orgGame.render(state, dispatch, playSkin)}</>);

    // 5 people x 10 columns (role UNION team) = 50 addressable cells.
    expect(screen.getAllByRole("button", { name: /: empty$/ })).toHaveLength(50);
    expect(screen.getByText(/Checks/)).toBeInTheDocument();
    expect(screen.getByText(/Hints/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Hint/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Check" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(state.message);
    for (const clue of puzzle.clues) {
      expect(screen.getByText(clue.text)).toBeInTheDocument();
    }
  });

  it("dispatches a mark move for the clicked person/role cell", () => {
    const puzzle = orgGame.generate(2, "medium");
    const state = orgGame.init(puzzle);
    const dispatch = vi.fn();

    rtlRender(<>{orgGame.render(state, dispatch, playSkin)}</>);
    const personName = puzzle.people[0] as string;
    const roleLabel = `${puzzle.roles[0] as string} lead`;
    screen.getByRole("button", { name: `${personName}, ${roleLabel}: empty` }).click();

    expect(dispatch).toHaveBeenCalledWith({ type: "mark", person: 0, col: 0 });
  });

  it("dispatches a mark move for the clicked person/team cell", () => {
    const puzzle = orgGame.generate(2, "medium");
    const state = orgGame.init(puzzle);
    const dispatch = vi.fn();

    rtlRender(<>{orgGame.render(state, dispatch, playSkin)}</>);
    const personName = puzzle.people[1] as string;
    const teamLabel = puzzle.teams[2] as string;
    screen.getByRole("button", { name: `${personName}, ${teamLabel}: empty` }).click();

    expect(dispatch).toHaveBeenCalledWith({ type: "mark", person: 1, col: 7 });
  });

  it("disables Check until the grid is full", () => {
    const puzzle = orgGame.generate(2, "medium");
    const state = orgGame.init(puzzle);
    rtlRender(<>{orgGame.render(state, vi.fn(), playSkin)}</>);
    expect(screen.getByRole("button", { name: "Check" })).toBeDisabled();
  });

  it("dispatches a hint move when Hint is clicked", () => {
    const puzzle = orgGame.generate(2, "medium");
    const state = orgGame.init(puzzle);
    const dispatch = vi.fn();

    rtlRender(<>{orgGame.render(state, dispatch, playSkin)}</>);
    screen.getByRole("button", { name: /^Hint/ }).click();

    expect(dispatch).toHaveBeenCalledWith({ type: "hint" });
  });

  it("dispatches a check move when Check is clicked and the grid is full", () => {
    const puzzle = orgGame.generate(2, "medium");
    let state = orgGame.init(puzzle);
    // Fill the grid (values don't need to be correct — Check just needs to be enabled).
    for (let p = 0; p < puzzle.people.length; p += 1) {
      state = orgGame.reduce(state, { type: "mark", person: p, col: p });
      state = orgGame.reduce(state, { type: "mark", person: p, col: 5 + p });
    }
    const dispatch = vi.fn();
    rtlRender(<>{orgGame.render(state, dispatch, playSkin)}</>);
    const checkButton = screen.getByRole("button", { name: "Check" });
    expect(checkButton).not.toBeDisabled();
    checkButton.click();

    expect(dispatch).toHaveBeenCalledWith({ type: "check" });
  });

  it("shows the hints-remaining count once at least one hint has been used, and 'No hints left' once exhausted", () => {
    const puzzle = orgGame.generate(2, "medium");
    let state = orgGame.init(puzzle);
    state = orgGame.reduce(state, { type: "hint" });
    rtlRender(<>{orgGame.render(state, vi.fn(), playSkin)}</>);
    expect(screen.getByRole("button", { name: `Hint (${String(3 - state.hintsUsed)} left)` })).toBeInTheDocument();

    const exhausted = { ...state, hintsUsed: 3 };
    rtlRender(<>{orgGame.render(exhausted, vi.fn(), playSkin)}</>);
    expect(screen.getByRole("button", { name: "No hints left" })).toBeInTheDocument();
  });

  it("shows success feedback tone once won, and error tone once lost", () => {
    const puzzle = orgGame.generate(2, "medium");
    const state = orgGame.init(puzzle);
    const won = { ...state, done: true, won: true, message: "Cleared!" };
    rtlRender(<>{orgGame.render(won, vi.fn(), playSkin)}</>);
    expect(screen.getByRole("status")).toHaveTextContent("Cleared!");

    const lost = { ...state, done: true, won: false, message: "Out of checks." };
    rtlRender(<>{orgGame.render(lost, vi.fn(), playSkin)}</>);
    expect(screen.getAllByRole("status").at(-1)).toHaveTextContent("Out of checks.");
  });

  it("shows a yes glyph for a marked cell", () => {
    const puzzle = orgGame.generate(2, "medium");
    let state = orgGame.init(puzzle);
    state = orgGame.reduce(state, { type: "mark", person: 0, col: 0 });
    rtlRender(<>{orgGame.render(state, vi.fn(), playSkin)}</>);
    const personName = puzzle.people[0] as string;
    const roleLabel = `${puzzle.roles[0] as string} lead`;
    const cell = within(screen.getByRole("table")).getByRole("button", { name: `${personName}, ${roleLabel}: yes` });
    expect(cell).toHaveTextContent("✓");
  });
});
