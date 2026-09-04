"use client";

import { useState } from "react";
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

function hintAction(state: ForecastState, dispatch: (move: ForecastMove) => void) {
  return {
    id: "hint",
    label:
      state.hintsUsed >= MAX_HINTS
        ? "No hints left"
        : `Hint${state.hintsUsed ? ` (${String(MAX_HINTS - state.hintsUsed)} left)` : ""}`,
    variant: "secondary" as const,
    disabled: state.done || state.hintsUsed >= MAX_HINTS,
    onClick: () => {
      dispatch({ type: "hint" });
    },
  };
}

/**
 * `reduce` scores a question and moves to the next one in the same move —
 * that is the engine's contract and it stays that way. So the score is
 * held on screen here, in view state, until the player asks for the next
 * question: no answer is ever scored out of sight.
 */
function ForecastView({
  state,
  dispatch,
  skin,
}: {
  state: ForecastState;
  dispatch: (move: ForecastMove) => void;
  skin: SkinPrimitives;
}): React.ReactElement {
  const { Prompt, NumberField, Slider, Summary, Passes, Actions, Feedback } = skin;
  const [seen, setSeen] = useState(-1);

  const total = state.puzzle.questions.length;
  const scoredIndex = state.index - 1;
  const scored = state.results[scoredIndex];
  const scoredQuestion = state.puzzle.questions[scoredIndex];
  const revealing =
    !state.done && scored !== undefined && scoredQuestion !== undefined && seen < scoredIndex;

  if (revealing) {
    return (
      <>
        <Prompt
          headline={scoredQuestion.question}
          note={`Question ${String(scoredIndex + 1)} of ${String(total)} · scored`}
        />
        <Summary
          ariaLabel="Your answer"
          items={[
            {
              id: "yours",
              label: "You said",
              value: `${String(scored.value)}${scoredQuestion.unit}`,
            },
            {
              id: "actual",
              label: "Actual",
              value: `${String(scoredQuestion.answer)}${scoredQuestion.unit}`,
            },
            {
              id: "points",
              label: "Points",
              value: `${String(scored.points)} of 3`,
            },
          ]}
        />
        <Passes label="Answered" used={state.index} total={total} />
        <Actions
          actions={[
            {
              id: "next",
              label: `Next question (${String(state.index + 1)} of ${String(total)})`,
              variant: "primary",
              onClick: () => {
                setSeen(scoredIndex);
              },
            },
          ]}
        />
        <Feedback message={state.message} tone={toneFor(state)} />
      </>
    );
  }

  const question = state.puzzle.questions[state.index];

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
          hintAction(state, dispatch),
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
    </>
  );
}

export function render(
  state: ForecastState,
  dispatch: (move: ForecastMove) => void,
  skin: SkinPrimitives,
): React.ReactNode {
  return <ForecastView state={state} dispatch={dispatch} skin={skin} />;
}
