import type { SkinPrimitives } from "@/components/primitives/types";
import { MAX_HINTS, MAX_POINTS, type ForecastMove, type ForecastState } from "./engine";

function toneFor(state: ForecastState): "neutral" | "success" | "error" {
  if (state.done) {
    const total = state.results.reduce((sum, r) => sum + (r?.points ?? 0), 0);
    if (total === 0) return "error";
    return total >= MAX_POINTS * 0.6 ? "success" : "neutral";
  }
  const last = state.results[state.index - 1];
  if (!last) return "neutral";
  if (last.points === 0) return "error";
  return last.points >= 2 ? "success" : "neutral";
}

export function render(
  state: ForecastState,
  dispatch: (move: ForecastMove) => void,
  skin: SkinPrimitives,
): React.ReactNode {
  const { Slider, Passes, Actions, Feedback, Log } = skin;
  const total = state.puzzle.questions.length;
  const question = state.puzzle.questions[state.index];

  return (
    <div className="flex flex-col gap-6">
      <Passes label="Question" used={state.index} total={total} />
      {question && (
        <div className="flex flex-col gap-3">
          <p className="text-base font-medium">
            Question {state.index + 1} of {total}: {question.question}
          </p>
          <Slider
            label={question.question}
            min={state.min}
            max={state.max}
            step={1}
            value={state.value}
            unit={question.unit}
            onChange={(value) => {
              dispatch({ type: "setValue", value });
            }}
          />
        </div>
      )}
      <Actions
        actions={[
          {
            id: "hint",
            label:
              state.hintsUsed >= MAX_HINTS
                ? "No hints left"
                : `Hint${state.hintsUsed ? ` (${String(MAX_HINTS - state.hintsUsed)} left)` : ""}`,
            variant: "secondary",
            disabled: state.done || state.hintsUsed >= MAX_HINTS,
            onClick: () => {
              dispatch({ type: "hint" });
            },
          },
          {
            id: "submit",
            label: "Submit",
            variant: "primary",
            disabled: state.done,
            onClick: () => {
              dispatch({ type: "submit" });
            },
          },
        ]}
      />
      <Feedback message={state.message} tone={toneFor(state)} />
      <Log entries={state.log} />
    </div>
  );
}
