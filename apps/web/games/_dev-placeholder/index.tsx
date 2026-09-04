import {
  buildShareGrid,
  createRng,
  hashSeed,
  shareGridHeader,
  shareLine,
  type CheckResult,
  type Difficulty,
  type Score,
} from "@boardatwork/game-core";
import type { GameModule } from "../types";

/**
 * Not a shipped game — a fixture that exercises every `SkinPrimitives`
 * component in one screen, used only by the Gate 2 skin-parity checks
 * (`/dev/skins/[skin]`, `tests/e2e/skins.spec.ts`). Never registered in
 * `games/registry.ts` and never linked from the home page.
 */
export interface PlaceholderPuzzle {
  seed: number;
  difficulty: Difficulty;
}

export interface PlaceholderState {
  puzzle: PlaceholderPuzzle;
  selectedId: string | null;
  sliderValue: number;
  modalOpen: boolean;
  checksUsed: number;
  hintsUsed: number;
  feedback: string;
  log: { id: string; author?: string; text: string }[];
  logicCell: "empty" | "yes" | "no";
  done: boolean;
}

export type PlaceholderMove =
  | { type: "select"; id: string }
  | { type: "set-slider"; value: number }
  | { type: "toggle-modal" }
  | { type: "toggle-logic-cell" };

const CHECKS = 5;
const HINTS = 3;

function generate(seed: number, difficulty: Difficulty): PlaceholderPuzzle {
  const rng = createRng(seed);
  rng.next();
  return { seed, difficulty };
}

function init(puzzle: PlaceholderPuzzle): PlaceholderState {
  return {
    puzzle,
    selectedId: null,
    sliderValue: 50,
    modalOpen: false,
    checksUsed: 0,
    hintsUsed: 0,
    feedback: "",
    log: [],
    logicCell: "empty",
    done: false,
  };
}

function reduce(state: PlaceholderState, move: PlaceholderMove): PlaceholderState {
  switch (move.type) {
    case "select":
      return { ...state, selectedId: move.id };
    case "set-slider":
      return { ...state, sliderValue: move.value };
    case "toggle-modal":
      return { ...state, modalOpen: !state.modalOpen };
    case "toggle-logic-cell": {
      const next: Record<PlaceholderState["logicCell"], PlaceholderState["logicCell"]> = {
        empty: "yes",
        yes: "no",
        no: "empty",
      };
      return { ...state, logicCell: next[state.logicCell] };
    }
    default:
      return state;
  }
}

function check(state: PlaceholderState): { state: PlaceholderState; result: CheckResult } {
  const checksUsed = state.checksUsed + 1;
  const done = checksUsed >= CHECKS;
  const result: CheckResult = { correctCount: checksUsed, totalCount: CHECKS, done };
  return {
    state: {
      ...state,
      checksUsed,
      done,
      feedback: `Check ${String(checksUsed)}/${String(CHECKS)} complete.`,
      log: [...state.log, { id: `check-${String(checksUsed)}`, author: "Reviewer", text: `Check ${String(checksUsed)} complete.` }],
    },
    result,
  };
}

function hint(state: PlaceholderState): PlaceholderState {
  if (state.hintsUsed >= HINTS) {
    return state;
  }
  const hintsUsed = state.hintsUsed + 1;
  return {
    ...state,
    hintsUsed,
    log: [...state.log, { id: `hint-${String(hintsUsed)}`, author: "Reviewer", text: "Here's a hint." }],
  };
}

function isDone(state: PlaceholderState): boolean {
  return state.done;
}

function score(state: PlaceholderState): Score {
  return {
    points: state.done ? CHECKS - state.checksUsed + 1 : 0,
    maxPoints: CHECKS,
    checksUsed: state.checksUsed,
    hintsUsed: state.hintsUsed,
    won: state.done,
  };
}

function shareGrid(state: PlaceholderState): string {
  const header = shareGridHeader("Placeholder", "0000-00-00", state.checksUsed, CHECKS);
  const lines = [shareLine(["🟩", "🟩", "⬛"])];
  return buildShareGrid(header, lines);
}

export const placeholderGame: GameModule<PlaceholderPuzzle, PlaceholderState, PlaceholderMove> = {
  id: "braid",
  meta: { name: "Placeholder", tagline: "Skin smoke test", checks: CHECKS, hints: HINTS },
  homeSkin: "play",
  help: <p>This fixture exercises every skin primitive for Gate 2.</p>,
  dailySeed: (dateKey) => hashSeed("braid", dateKey),
  practiceSeed: (counter) => hashSeed("braid", "practice", counter),
  generate,
  init,
  reduce,
  check,
  hint,
  isDone,
  score,
  shareGrid,
  render(state, dispatch, skin) {
    const {
      Prompt,
      TextRun,
      Slots,
      Grid,
      Passage,
      Passes,
      Actions,
      Feedback,
      Log,
      Summary,
      Modal,
      Slider,
      NumberField,
      LogicGrid,
    } = skin;
    return (
      <>
        <Prompt headline="Every primitive, one screen." tone="revealed" note="Skin smoke test" />
        <TextRun
          ariaLabel="Text run demo"
          items={[
            { id: "a", text: "B", groupId: "g1", state: state.selectedId === "a" ? "selected" : "default" },
            { id: "b", text: "R", groupId: "g2" },
            { id: "c", text: "A", groupId: "g1" },
            { id: "d", text: "I", groupId: "g2", state: "locked" },
            { id: "e", text: "D", groupId: "g1", state: "wrong" },
          ]}
          groupTokens={{ g1: "--accent-a", g2: "--accent-b" }}
          onSelect={(id) => {
            dispatch({ type: "select", id });
          }}
        />
        <Slots
          groupTokens={{ g1: "--accent-a", g2: "--accent-b" }}
          rows={[
            {
              id: "row1",
              ariaLabel: "Strand 1",
              groupId: "g1",
              note: "2 / 3",
              slots: [
                { id: "r1a", value: "B" },
                { id: "r1b", value: "A" },
                { id: "r1c", value: null },
              ],
            },
            {
              id: "row2",
              ariaLabel: "Strand 2",
              groupId: "g2",
              note: "1 / 2",
              slots: [
                { id: "r2a", value: "R" },
                { id: "r2b", value: null },
              ],
            },
          ]}
        />
        <Grid
          rows={2}
          cols={2}
          ariaLabel="Grid demo"
          cells={[
            { id: "g1", value: "12" },
            { id: "g2", value: "7", state: "selected" },
            { id: "g3", value: "3" },
            { id: "g4", value: "9" },
          ]}
          rowTotals={[
            { value: 19, reconciled: true },
            { value: 12, reconciled: false },
          ]}
          colTotals={[
            { value: 15, reconciled: true },
            { value: 16, reconciled: true },
          ]}
          onSelect={(id) => {
            dispatch({ type: "select", id });
          }}
        />
        <Passage
          words={[
            { id: "w1", text: "The" },
            { id: "w2", text: "cot", state: "selected" },
            { id: "w3", text: "sat" },
            { id: "w4", text: "quietly" },
          ]}
          onSelect={(id) => {
            dispatch({ type: "select", id });
          }}
        />
        <NumberField
          label="Estimate"
          min={0}
          max={100}
          value={state.sliderValue}
          unit="%"
          onChange={(value) => {
            dispatch({ type: "set-slider", value });
          }}
        />
        <Slider
          label="Estimate"
          min={0}
          max={100}
          value={state.sliderValue}
          unit="%"
          onChange={(value) => {
            dispatch({ type: "set-slider", value });
          }}
        />
        <LogicGrid
          ariaLabel="Logic grid demo"
          rowLabels={[{ id: "priya", label: "Priya" }]}
          colLabels={[{ id: "design", label: "Design" }]}
          cells={[{ rowId: "priya", colId: "design", state: state.logicCell }]}
          onSelect={() => {
            dispatch({ type: "toggle-logic-cell" });
          }}
        />
        <Summary
          ariaLabel="Summary demo"
          items={[{ id: "priya", label: "Priya", value: "Design · Platform" }]}
        />
        <Log
          ariaLabel="Log demo"
          entries={[
            ...state.log,
            { id: "probe", author: "You", text: "kernel", status: "yes" as const },
          ]}
        />
        <Passes label="Checks" used={state.checksUsed} total={CHECKS} />
        <Actions
          actions={[
            { id: "check", label: "Check", onClick: () => undefined, disabled: true },
            {
              id: "modal",
              label: "How to play",
              variant: "secondary",
              onClick: () => {
                dispatch({ type: "toggle-modal" });
              },
            },
          ]}
        />
        <Feedback message={state.feedback || "Ready."} tone={state.done ? "success" : "neutral"} />
        <Modal
          open={state.modalOpen}
          title="How to play"
          onClose={() => {
            dispatch({ type: "toggle-modal" });
          }}
        >
          <p>This fixture exercises every skin primitive for Gate 2.</p>
        </Modal>
      </>
    );
  },
};
