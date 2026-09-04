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
  const { Prompt, NumberField, Slider, Passes, Actions, Feedback } = skin;
  const total = state.puzzle.questions.length;
  const question = state.puzzle.questions[state.index];

  // The score for the question just answered, held on screen while the
  // next one is posed, so no answer is scored out of sight.
  const previous = state.puzzle.questions[state.index - 1];
  const previousResult = state.results[state.index - 1];

  return (
    <>
      <Prompt
        headline={question ? question.question : "That's all five."}
        note={
          question
            ? `Question ${String(state.index + 1)} of ${String(total)}`
            : `${String(state.results.reduce((sum, r) => sum + (r?.points ?? 0), 0))} of ${String(MAX_POINTS)} points`
        }
      />
      {question && (
        <>
          <NumberField
            label={question.question}
            min={state.min}
            max={state.max}
            value={state.value}
            unit={question.unit}
            onChange={(value) => {
              dispatch({ type: "setValue", value });
            }}
          />
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
        </>
      )}
      <Passes label="Answered" used={state.index} total={total} />
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
      <Feedback
        message={
          previous && previousResult && !state.done
            ? `Q${String(state.index)}: you said ${String(previousResult.value)}${previous.unit}, actual ${String(previous.answer)}${previous.unit} — ${String(previousResult.points)} points.`
            : state.message
        }
        tone={toneFor(state)}
      />
    </>
  );
}
