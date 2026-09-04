import type { SkinPrimitives, SlotRow, TextRunItem, UnitState } from "@/components/primitives/types";
import {
  MAX_CHECKS,
  MAX_HINTS,
  THEME_AT_CHECK,
  canCheck,
  type BraidMove,
  type BraidState,
} from "./engine";

const STRAND_TOKENS = ["--accent-a", "--accent-b", "--accent-c"];

function letterAriaLabel(ch: string, strand: number): string {
  return strand < 0 ? `${ch}, unassigned` : `${ch}, strand ${String(strand + 1)}`;
}

export function render(
  state: BraidState,
  dispatch: (move: BraidMove) => void,
  skin: SkinPrimitives,
): React.ReactNode {
  const { Prompt, TextRun, Slots, Passes, Actions, Feedback } = skin;
  const groupTokens = Object.fromEntries(
    STRAND_TOKENS.map((token, i) => [`strand-${String(i)}`, token]),
  );

  const ropeItems: TextRunItem[] = state.puzzle.letters.map((letter, i) => {
    const strand = state.assign[i] ?? -1;
    const unit: UnitState = state.wrongIds.includes(i)
      ? "wrong"
      : state.locked[i]
        ? "locked"
        : "default";
    return {
      id: `letter-${String(i)}`,
      text: letter.ch,
      state: unit,
      ariaLabel: letterAriaLabel(letter.ch, strand),
      ...(strand >= 0 ? { groupId: `strand-${String(strand)}` } : {}),
    };
  });

  const strandRows: SlotRow[] = state.puzzle.words.map((word, k) => {
    const got = state.puzzle.letters
      .filter((_, i) => state.assign[i] === k)
      .map((letter) => letter.ch);
    return {
      id: `strand-${String(k)}`,
      ariaLabel: `Strand ${String(k + 1)}`,
      groupId: `strand-${String(k)}`,
      note: `${String(got.length)} / ${String(word.length)}`,
      slots: Array.from({ length: word.length }, (_, j) => ({
        id: `strand-${String(k)}-slot-${String(j)}`,
        value: got[j] ?? null,
      })),
    };
  });

  const lens = `${state.puzzle.words.map((word) => String(word.length)).join(" and ")} letters`;

  return (
    <>
      <Prompt
        headline={
          state.themeRevealed
            ? state.puzzle.theme
            : `Theme revealed after check ${String(THEME_AT_CHECK)}`
        }
        tone={state.themeRevealed ? "revealed" : "pending"}
        note={lens}
      />
      <TextRun
        items={ropeItems}
        ariaLabel="Braided letters"
        groupTokens={groupTokens}
        onSelect={(id) => {
          dispatch({ type: "assign", index: Number(id.split("-")[1]) });
        }}
      />
      <Slots rows={strandRows} groupTokens={groupTokens} />
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
            id: "clear",
            label: "Clear",
            variant: "secondary",
            disabled: state.done,
            onClick: () => {
              dispatch({ type: "clear" });
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
