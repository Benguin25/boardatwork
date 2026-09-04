import type { GridCell, SkinPrimitives } from "@/components/primitives/types";
import { MAX_CHECKS, MAX_HINTS, canCheck, type AuditMove, type AuditState } from "./engine";
import { GRID_SIZE } from "./generate";

const CELL_ID_PREFIX = "cell-";

export function render(
  state: AuditState,
  dispatch: (move: AuditMove) => void,
  skin: SkinPrimitives,
): React.ReactNode {
  const { Grid, Passes, Actions, Feedback, Log } = skin;
  const { puzzle, flagged, locked } = state;

  const cells: GridCell[] = puzzle.displayedGrid.map((value, index) => ({
    id: `${CELL_ID_PREFIX}${String(index)}`,
    value: String(value),
    state: locked[index] ? "locked" : flagged[index] ? "selected" : "default",
  }));

  return (
    <div className="flex flex-col gap-6">
      <Grid
        rows={GRID_SIZE}
        cols={GRID_SIZE}
        cells={cells}
        rowTotals={puzzle.rowTotals}
        colTotals={puzzle.colTotals}
        onSelect={(id) => {
          dispatch({ type: "toggle", index: Number(id.slice(CELL_ID_PREFIX.length)) });
        }}
      />
      <div className="flex flex-wrap gap-4">
        <Passes label="Checks" used={state.checksUsed} total={MAX_CHECKS} />
        <Passes label="Hints" used={state.hintsUsed} total={MAX_HINTS} />
      </div>
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
            id: "check",
            label: "Check",
            variant: "primary",
            disabled: !canCheck(state),
            onClick: () => {
              dispatch({ type: "check" });
            },
          },
        ]}
      />
      <Feedback message={state.message} tone={state.done ? (state.won ? "success" : "error") : "neutral"} />
      <Log entries={state.log} />
    </div>
  );
}
