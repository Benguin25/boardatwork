import { render as rtlRender, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { playSkin } from "@/skins/play";
import { braidGame } from "./index";

describe("braidGame.render (via Play skin)", () => {
  it("renders the rope, strands, checks counter, actions, and feedback", () => {
    const puzzle = braidGame.generate(2, "medium");
    const state = braidGame.init(puzzle);
    const dispatch = vi.fn();

    rtlRender(<>{braidGame.render(state, dispatch, playSkin)}</>);

    expect(screen.getByRole("group", { name: "Braided letters" })).toBeInTheDocument();
    expect(screen.getByText(/Checks/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Hint/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Check" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(state.message);
  });

  it("dispatches an assign move when a letter is clicked", async () => {
    const puzzle = braidGame.generate(2, "medium");
    const state = braidGame.init(puzzle);
    const dispatch = vi.fn();

    rtlRender(<>{braidGame.render(state, dispatch, playSkin)}</>);
    const rope = within(screen.getByRole("group", { name: "Braided letters" }));
    rope.getAllByRole("button")[0]!.click();

    expect(dispatch).toHaveBeenCalledWith({ type: "assign", index: 0 });
  });

  it("disables Check until the board is full", () => {
    const puzzle = braidGame.generate(2, "medium");
    const state = braidGame.init(puzzle);
    rtlRender(<>{braidGame.render(state, vi.fn(), playSkin)}</>);
    expect(screen.getByRole("button", { name: "Check" })).toBeDisabled();
  });

  it("reveals the theme text once the check count requires it", () => {
    const puzzle = braidGame.generate(2, "medium");
    let state = braidGame.init(puzzle);
    state = { ...state, themeRevealed: true };
    rtlRender(<>{braidGame.render(state, vi.fn(), playSkin)}</>);
    expect(screen.getByText(state.puzzle.theme)).toBeInTheDocument();
  });
});
