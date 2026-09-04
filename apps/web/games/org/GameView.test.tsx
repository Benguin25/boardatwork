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
