import type { LogicGridCell, SkinPrimitives } from "@/components/primitives/types";
import {
  MAX_CHECKS,
  MAX_HINTS,
  canCheck,
  type CellMark,
  type OrgMove,
  type OrgState,
} from "./engine";

const ROLE_COLS = 5;
const COL_COUNT = 10;

export function render(
  state: OrgState,
  dispatch: (move: OrgMove) => void,
  skin: SkinPrimitives,
): React.ReactNode {
  const { Prompt, LogicGrid, Log, Summary, Passes, Actions, Feedback } = skin;
  const { puzzle, marks } = state;

  const rowLabels = puzzle.people.map((person, p) => ({
    id: `person-${String(p)}`,
    label: person,
  }));
  const colLabels = [
    ...puzzle.roles.map((role, r) => ({ id: `role-${String(r)}`, label: `${role} lead` })),
    ...puzzle.teams.map((team, t) => ({ id: `team-${String(t)}`, label: team })),
  ];

  const cells: LogicGridCell[] = [];
  puzzle.people.forEach((_, p) => {
    for (let col = 0; col < COL_COUNT; col += 1) {
      const colId = col < ROLE_COLS ? `role-${String(col)}` : `team-${String(col - ROLE_COLS)}`;
      cells.push({
        rowId: `person-${String(p)}`,
        colId,
        state: marks[p]?.[col] as CellMark,
      });
    }
  });

  // Only the ticks the player has placed — a person's row resolves once
  // exactly one role and one team are marked "yes".
  const resolved = puzzle.people.map((person, p) => {
    const row = marks[p] ?? [];
    const roleIdx = row.findIndex((mark, col) => col < ROLE_COLS && mark === "yes");
    const teamIdx = row.findIndex((mark, col) => col >= ROLE_COLS && mark === "yes");
    const role = roleIdx >= 0 ? puzzle.roles[roleIdx] : undefined;
    const team = teamIdx >= 0 ? puzzle.teams[teamIdx - ROLE_COLS] : undefined;
    return {
      id: `resolved-${String(p)}`,
      label: person,
      value: role === undefined && team === undefined ? "—" : `${role ?? "?"} · ${team ?? "?"}`,
    };
  });

  const markedCount = marks.reduce(
    (sum, row) => sum + row.filter((mark) => mark === "yes").length,
    0,
  );

  return (
    <>
      <Prompt
        headline="Work out who leads what, and which team they sit in."
        note={`${String(markedCount)} of ${String(puzzle.people.length * 2)} assignments marked`}
      />
      <Log entries={puzzle.clues.map((clue) => ({ id: clue.id, text: clue.text }))} ariaLabel="Clues" />
      <LogicGrid
        rowLabels={rowLabels}
        colLabels={colLabels}
        cells={cells}
        ariaLabel="People against roles and teams"
        onSelect={(rowId, colId) => {
          const person = Number(rowId.split("-")[1]);
          const [kind, indexStr] = colId.split("-");
          const index = Number(indexStr);
          const col = kind === "role" ? index : index + ROLE_COLS;
          dispatch({ type: "mark", person, col });
        }}
      />
      <Summary items={resolved} ariaLabel="Resolved assignments" />
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
