import { render as rtlRender, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { playSkin } from "@/skins/play";
import { forecastGame } from "./index";

describe("forecastGame.render (via Play skin)", () => {
  it("renders the current question, a slider, progress, actions, feedback, and log", () => {
    const puzzle = forecastGame.generate(2, "medium");
    const state = forecastGame.init(puzzle);
    const dispatch = vi.fn();

    rtlRender(<>{forecastGame.render(state, dispatch, playSkin)}</>);

    expect(screen.getByText(/Question 1 of 5/)).toBeInTheDocument();
    expect(screen.getByRole("slider")).toBeInTheDocument();
    expect(screen.getByText("Question")).toBeInTheDocument(); // Passes label
    expect(screen.getByRole("button", { name: /^Hint/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(state.message);
  });

  it("dispatches a setValue move when the slider changes", () => {
    const puzzle = forecastGame.generate(2, "medium");
    const state = forecastGame.init(puzzle);
    const dispatch = vi.fn();

    rtlRender(<>{forecastGame.render(state, dispatch, playSkin)}</>);
    const slider = screen.getByRole("slider") as HTMLInputElement;
    // A plain `.value =` assignment doesn't trigger React's change tracking
    // on a controlled input; go through the native setter, like a real
    // user interaction would.
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
    nativeSetter?.call(slider, String(state.min));
    slider.dispatchEvent(new Event("input", { bubbles: true }));

    expect(dispatch).toHaveBeenCalledWith({ type: "setValue", value: state.min });
  });

  it("dispatches a hint move when Hint is clicked", () => {
    const puzzle = forecastGame.generate(2, "medium");
    const state = forecastGame.init(puzzle);
    const dispatch = vi.fn();

    rtlRender(<>{forecastGame.render(state, dispatch, playSkin)}</>);
    screen.getByRole("button", { name: /^Hint/ }).click();

    expect(dispatch).toHaveBeenCalledWith({ type: "hint" });
  });

  it("dispatches a submit move when Submit is clicked", () => {
    const puzzle = forecastGame.generate(2, "medium");
    const state = forecastGame.init(puzzle);
    const dispatch = vi.fn();

    rtlRender(<>{forecastGame.render(state, dispatch, playSkin)}</>);
    screen.getByRole("button", { name: "Submit" }).click();

    expect(dispatch).toHaveBeenCalledWith({ type: "submit" });
  });

  it("disables Hint once the shared hint pool is exhausted", () => {
    const puzzle = forecastGame.generate(2, "medium");
    let state = forecastGame.init(puzzle);
    state = { ...state, hintsUsed: forecastGame.meta.hints };
    rtlRender(<>{forecastGame.render(state, vi.fn(), playSkin)}</>);
    expect(screen.getByRole("button", { name: "No hints left" })).toBeDisabled();
  });

  it("shows an error tone after a 0-point submission mid-puzzle", () => {
    const puzzle = forecastGame.generate(2, "medium");
    let state = forecastGame.init(puzzle);
    state = { ...state, index: 1, results: [{ value: 0, error: 1, points: 0 }, undefined, undefined, undefined, undefined] };
    rtlRender(<>{forecastGame.render(state, vi.fn(), playSkin)}</>);
    expect(screen.getByRole("status")).toHaveClass("text-sm"); // sanity: Feedback rendered
    expect(screen.getByRole("status")).toHaveStyle({ color: "#b91c1c" }); // Play skin's "error" tone colour
  });

  it("hides the slider and disables Submit once the puzzle is done", () => {
    const puzzle = forecastGame.generate(2, "medium");
    let state = forecastGame.init(puzzle);
    state = { ...state, done: true, index: 5 };
    rtlRender(<>{forecastGame.render(state, vi.fn(), playSkin)}</>);
    expect(screen.queryByRole("slider")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();
  });
});
