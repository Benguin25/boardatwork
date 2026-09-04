import type { SkinPrimitives, TextRunItem, UnitState } from "@/components/primitives/types";
import { MAX_CHECKS, MAX_HINTS, canCheck, type BraidMove, type BraidState } from "./engine";

const STRAND_TOKENS = ["--accent-a", "--accent-b", "--accent-c"];

function letterAriaLabel(ch: string, strand: number): string {
  return strand < 0 ? `${ch}, unassigned` : `${ch}, strand ${String(strand + 1)}`;
}

export function render(
  state: BraidState,
  dispatch: (move: BraidMove) => void,
  skin: SkinPrimitives,
): React.ReactNode {
  const { TextRun, TileRow, Passes, Actions, Feedback, Log } = skin;
  const groupTokens = Object.fromEntries(STRAND_TOKENS.map((t, i) => [`strand-${String(i)}`, t]));

  const ropeItems: TextRunItem[] = state.puzzle.letters.map((letter, i) => {
    const strand = state.assign[i] ?? -1;
    const st: UnitState = state.wrongIds.includes(i) ? "wrong" : state.locked[i] ? "locked" : "default";
    return {
      id: `letter-${String(i)}`,
      text: letter.ch,
      state: st,
      ariaLabel: letterAriaLabel(letter.ch, strand),
      ...(strand >= 0 ? { groupId: `strand-${String(strand)}` } : {}),
    };
  });

  const strandRows = state.puzzle.words.map((word, k) => {
    const got = state.puzzle.letters.filter((_, i) => state.assign[i] === k).map((l) => l.ch);
    return {
      id: `strand-${String(k)}`,
      label: `Strand ${String(k + 1)}`,
      items: Array.from({ length: word.length }, (_, j) => ({
        id: `strand-${String(k)}-slot-${String(j)}`,
        text: got[j] ?? "",
        ariaLabel: got[j] ?? "empty slot",
      })),
    };
  });

  const logForDisplay = state.log.map((entry) =>
    entry.id === "theme" ? { ...entry, text: state.themeRevealed ? state.puzzle.theme : entry.text } : entry,
  );

  return (
    <div className="flex flex-col gap-6">
      <TextRun items={ropeItems} groupTokens={groupTokens} onSelect={(id) => { dispatch({ type: "assign", index: Number(id.split("-")[1]) }); }} />
      <TileRow rows={strandRows} groupTokens={groupTokens} />
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
            id: "clear",
            label: "Clear",
            variant: "secondary",
            disabled: state.done,
            onClick: () => { dispatch({ type: "clear" }); },
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
      <Log entries={logForDisplay} />
    </div>
  );
}
