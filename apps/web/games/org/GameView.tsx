import type { LogicGridCell, SkinPrimitives } from "@/components/primitives/types";
import { MAX_CHECKS, MAX_HINTS, canCheck, type OrgMove, type OrgState } from "./engine";

export function render(state: OrgState, dispatch: (move: OrgMove) => void, skin: SkinPrimitives): React.ReactNode {
  const { LogicGrid, Passes, Actions, Feedback, Log } = skin;
  const { puzzle, marks } = state;

  const rowLabels = puzzle.people.map((person, p) => ({ id: `person-${String(p)}`, label: person }));
  const colLabels = [
    ...puzzle.roles.map((role, r) => ({ id: `role-${String(r)}`, label: `${role} lead` })),
    ...puzzle.teams.map((team, t) => ({ id: `team-${String(t)}`, label: team })),
  ];

  const cells: LogicGridCell[] = [];
  puzzle.people.forEach((_, p) => {
    for (let col = 0; col < 10; col += 1) {
      const colId = col < 5 ? `role-${String(col)}` : `team-${String(col - 5)}`;
      cells.push({ rowId: `person-${String(p)}`, colId, state: marks[p]?.[col] ?? "empty" });
    }
  });

  return (
    <div className="flex flex-col gap-6">
      <LogicGrid
        rowLabels={rowLabels}
        colLabels={colLabels}
        cells={cells}
        onSelect={(rowId, colId) => {
          const person = Number(rowId.split("-")[1]);
          const [kind, indexStr] = colId.split("-");
          const index = Number(indexStr);
          const col = kind === "role" ? index : index + 5;
          dispatch({ type: "mark", person, col });
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
            label: state.hintsUsed >= MAX_HINTS ? "No hints left" : `Hint${state.hintsUsed ? ` (${String(MAX_HINTS - state.hintsUsed)} left)` : ""}`,
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
