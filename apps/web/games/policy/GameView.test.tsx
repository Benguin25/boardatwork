import { render as rtlRender, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { playSkin } from "@/skins/play";
import { policyGame } from "./index";

/** The Play skin's Modal renders its own "Close" (×) button alongside the children, so filter it out to count only the candidate-rule buttons. */
function candidateButtons(dialog: ReturnType<typeof within>): HTMLElement[] {
  return dialog.getAllByRole("button").filter((btn: HTMLElement) => btn.getAttribute("aria-label") !== "Close");
}

describe("policyGame.render (via Play skin)", () => {
  it("renders the examples log, probe chips, passes, actions, and feedback", () => {
    const puzzle = policyGame.generate(1, "easy");
    const state = policyGame.init(puzzle);
    const dispatch = vi.fn();

    rtlRender(<>{policyGame.render(state, dispatch, playSkin)}</>);

    expect(screen.getByRole("list", { name: "History" })).toBeInTheDocument();
    for (const example of puzzle.examples) {
      expect(screen.getByText(new RegExp(example))).toBeInTheDocument();
    }
    expect(screen.getByText(/Probes/)).toBeInTheDocument();
    expect(screen.getByText(/Hints/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Hint/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guess the rule" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(state.message);
  });

  it("dispatches a hint move when Hint is clicked", () => {
    const puzzle = policyGame.generate(1, "easy");
    const state = policyGame.init(puzzle);
    const dispatch = vi.fn();
    rtlRender(<>{policyGame.render(state, dispatch, playSkin)}</>);
    screen.getByRole("button", { name: /^Hint/ }).click();
    expect(dispatch).toHaveBeenCalledWith({ type: "hint" });
  });

  it("dispatches toggle-guess-modal when Guess the rule is clicked, and again when the modal is closed", () => {
    const puzzle = policyGame.generate(1, "easy");
    let state = policyGame.init(puzzle);
    for (const word of puzzle.probeCandidates.slice(0, 5)) {
      state = policyGame.reduce(state, { type: "probe", word });
    }
    const dispatch = vi.fn();
    rtlRender(<>{policyGame.render(state, dispatch, playSkin)}</>);
    screen.getByRole("button", { name: "Guess the rule" }).click();
    expect(dispatch).toHaveBeenCalledWith({ type: "toggle-guess-modal" });

    const opened = policyGame.reduce(state, { type: "toggle-guess-modal" });
    const dispatch2 = vi.fn();
    rtlRender(<>{policyGame.render(opened, dispatch2, playSkin)}</>);
    screen.getAllByRole("button", { name: "Close" })[0]!.click();
    expect(dispatch2).toHaveBeenCalledWith({ type: "toggle-guess-modal" });
  });

  it("dispatches a probe move when a word chip is clicked", () => {
    const puzzle = policyGame.generate(1, "easy");
    const state = policyGame.init(puzzle);
    const dispatch = vi.fn();

    rtlRender(<>{policyGame.render(state, dispatch, playSkin)}</>);
    const firstWord = puzzle.probeCandidates[0] as string;
    screen.getByRole("button", { name: `Probe the word ${firstWord}` }).click();

    expect(dispatch).toHaveBeenCalledWith({ type: "probe", word: firstWord });
  });

  it("disables Guess the rule until 5 probes have been made", () => {
    const puzzle = policyGame.generate(1, "easy");
    let state = policyGame.init(puzzle);
    state = policyGame.reduce(state, { type: "probe", word: puzzle.probeCandidates[0] as string });
    rtlRender(<>{policyGame.render(state, vi.fn(), playSkin)}</>);
    expect(screen.getByRole("button", { name: "Guess the rule" })).toBeDisabled();
  });

  it("enables Guess the rule after 5 probes and opens the picker with 10 candidates", () => {
    const puzzle = policyGame.generate(1, "easy");
    let state = policyGame.init(puzzle);
    for (const word of puzzle.probeCandidates.slice(0, 5)) {
      state = policyGame.reduce(state, { type: "probe", word });
    }
    state = policyGame.reduce(state, { type: "toggle-guess-modal" });

    rtlRender(<>{policyGame.render(state, vi.fn(), playSkin)}</>);
    expect(screen.getByRole("button", { name: "Guess the rule" })).toBeEnabled();
    const dialog = within(screen.getByRole("dialog"));
    expect(candidateButtons(dialog)).toHaveLength(puzzle.candidateIds.length);
  });

  it("dispatches a guess move when a candidate is picked from the modal", () => {
    const puzzle = policyGame.generate(1, "easy");
    let state = policyGame.init(puzzle);
    for (const word of puzzle.probeCandidates.slice(0, 5)) {
      state = policyGame.reduce(state, { type: "probe", word });
    }
    state = policyGame.reduce(state, { type: "toggle-guess-modal" });
    const dispatch = vi.fn();

    rtlRender(<>{policyGame.render(state, dispatch, playSkin)}</>);
    const dialog = within(screen.getByRole("dialog"));
    candidateButtons(dialog)[0]!.click();

    expect(dispatch).toHaveBeenCalledWith({ type: "guess", ruleId: puzzle.candidateIds[0] });
  });

  it("hides eliminated candidates from the guess picker after a hint", () => {
    const puzzle = policyGame.generate(1, "easy");
    let state = policyGame.init(puzzle);
    for (const word of puzzle.probeCandidates.slice(0, 5)) {
      state = policyGame.reduce(state, { type: "probe", word });
    }
    state = policyGame.reduce(state, { type: "hint" });
    state = policyGame.reduce(state, { type: "toggle-guess-modal" });

    rtlRender(<>{policyGame.render(state, vi.fn(), playSkin)}</>);
    const dialog = within(screen.getByRole("dialog"));
    expect(candidateButtons(dialog)).toHaveLength(puzzle.candidateIds.length - state.eliminatedIds.length);
  });

  it("shows a win/loss feedback tone once the puzzle is done", () => {
    const puzzle = policyGame.generate(1, "easy");
    let state = policyGame.init(puzzle);
    for (const word of puzzle.probeCandidates.slice(0, 5)) {
      state = policyGame.reduce(state, { type: "probe", word });
    }
    state = policyGame.reduce(state, { type: "guess", ruleId: puzzle.trueRuleId });
    rtlRender(<>{policyGame.render(state, vi.fn(), playSkin)}</>);
    expect(screen.getByRole("status")).toHaveTextContent("Correct!");
  });

  it("removes an already-probed word from the chip list", () => {
    const puzzle = policyGame.generate(1, "easy");
    const firstWord = puzzle.probeCandidates[0] as string;
    let state = policyGame.init(puzzle);
    state = policyGame.reduce(state, { type: "probe", word: firstWord });
    rtlRender(<>{policyGame.render(state, vi.fn(), playSkin)}</>);
    expect(screen.queryByRole("button", { name: `Probe the word ${firstWord}` })).not.toBeInTheDocument();
  });
});
