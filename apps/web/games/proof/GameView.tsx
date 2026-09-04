import type { PassageWord, SkinPrimitives, UnitState } from "@/components/primitives/types";
import { MAX_CHECKS, MAX_HINTS, canCheck, type ProofMove, type ProofState } from "./engine";

export function wordId(index: number): string {
  return `word-${String(index)}`;
}

export function wordIndexFromId(id: string): number {
  return Number(id.slice("word-".length));
}

export function render(
  state: ProofState,
  dispatch: (move: ProofMove) => void,
  skin: SkinPrimitives,
): React.ReactNode {
  const { Passage, Passes, Actions, Feedback, Log } = skin;

  const words: PassageWord[] = state.passage.words.map((text, i) => {
    const st: UnitState = state.locked[i] ? "locked" : state.flagged[i] ? "selected" : "default";
    return { id: wordId(i), text, state: st };
  });

  return (
    <div className="flex flex-col gap-6">
      <Passage words={words} onSelect={(id) => { dispatch({ type: "toggleFlag", index: wordIndexFromId(id) }); }} />
      <div className="flex flex-wrap gap-4">
        <Passes label="Checks" used={state.checksUsed} total={MAX_CHECKS} />
        <Passes label="Hints" used={state.hintsUsed} total={MAX_HINTS} />
      </div>
      <Actions
        actions={[
          {
            id: "hint",
            label: state.hintsUsed >= MAX_HINTS ? "No hints left" : `Hint${state.hintsUsed ? ` (${String(MAX_HINTS - state.hintsUsed)} left)` : ""}`,
            variant: "secondary",
            disabled: state.done || state.hintsUsed >= MAX_HINTS,
            onClick: () => { dispatch({ type: "hint" }); },
          },
          {
            id: "check",
            label: "Check",
            variant: "primary",
            disabled: !canCheck(state),
            onClick: () => { dispatch({ type: "check" }); },
          },
        ]}
      />
      <Feedback message={state.message} tone={state.done ? (state.won ? "success" : "error") : "neutral"} />
      <Log entries={state.log} />
    </div>
  );
}
