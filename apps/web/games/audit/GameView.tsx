import type { GridCell, GridTotal, SkinPrimitives } from "@/components/primitives/types";
import {
  MAX_CHECKS,
  MAX_HINTS,
  canCheck,
  type AuditMove,
  type AuditState,
} from "./engine";
import { GRID_SIZE } from "./generate";

const CELL_ID_PREFIX = "cell-";

/**
 * Row/column totals are the originals, so a line whose displayed cells no
 * longer sum to its total contains at least one altered cell. That's a
 * pure derivation from what the player can already see — it reveals
 * nothing the grid doesn't.
 */
function totals(
  grid: readonly number[],
  shown: readonly number[],
  pick: (index: number, line: number) => boolean,
): GridTotal[] {
  return shown.map((value, line) => {
    const sum = grid.reduce(
      (acc, cell, index) => (pick(index, line) ? acc + cell : acc),
      0,
    );
    return { value, reconciled: sum === value };
  });
}

export function render(
  state: AuditState,
  dispatch: (move: AuditMove) => void,
  skin: SkinPrimitives,
): React.ReactNode {
  const { Prompt, Grid, Passes, Actions, Feedback } = skin;
  const { puzzle, flagged, locked } = state;

  const cells: GridCell[] = puzzle.displayedGrid.map((value, index) => ({
    id: `${CELL_ID_PREFIX}${String(index)}`,
    value: String(value),
    state: locked[index] ? "locked" : flagged[index] ? "selected" : "default",
  }));

  const flaggedCount = flagged.filter(Boolean).length;

  return (
    <>
      <Prompt
        headline="The row and column totals are the originals. Find the cells that were changed."
        note={`${String(flaggedCount)} of ${String(puzzle.k)} flagged`}
      />
      <Grid
        rows={GRID_SIZE}
        cols={GRID_SIZE}
        cells={cells}
        ariaLabel="Ledger grid with row and column totals"
        rowTotals={totals(
          puzzle.displayedGrid,
          puzzle.rowTotals,
          (index, row) => Math.floor(index / GRID_SIZE) === row,
        )}
        colTotals={totals(
          puzzle.displayedGrid,
          puzzle.colTotals,
          (index, col) => index % GRID_SIZE === col,
        )}
        onSelect={(id) => {
          dispatch({ type: "toggle", index: Number(id.slice(CELL_ID_PREFIX.length)) });
        }}
      />
      <Passes label="Checks" used={state.checksUsed} total={MAX_CHECKS} />
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
      <Feedback
        message={state.message}
        tone={state.done ? (state.won ? "success" : "error") : "neutral"}
      />
    </>
  );
}
