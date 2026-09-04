import { RULES } from "@boardatwork/rules";
import type {
  ActionItem,
  LogEntry,
  SkinPrimitives,
  TextRunItem,
} from "@/components/primitives/types";
import {
  MAX_HINTS,
  MIN_PROBES_TO_GUESS,
  canGuess,
  type PolicyMove,
  type PolicyState,
} from "./engine";

function ruleById(id: string) {
  const rule = RULES.find((r) => r.id === id);
  if (!rule) {
    throw new Error(`Unknown rule id "${id}"`);
  }
  return rule;
}

const PROBE_PREFIX = "probe-";

/**
 * `SkinPrimitives` has no free-text input (adding one would mean touching
 * every skin for one game). So "type a word to probe" is modelled as
 * tapping one of a small, deterministic set of candidate words drawn from
 * the puzzle's own word pool (`puzzle.probeCandidates`) — a defensible
 * simplification of SPEC's mechanic-neutral "friends submit words", and one
 * that keeps probing fully replayable through `PolicyMove`.
 */
export function render(
  state: PolicyState,
  dispatch: (move: PolicyMove) => void,
  skin: SkinPrimitives,
): React.ReactNode {
  const { Prompt, TextRun, Log, Actions, Feedback, Modal, Passes } = skin;

  const probedWords = new Set(state.probes.map((probe) => probe.word));
  const availableWords = state.puzzle.probeCandidates.filter(
    (word) => !probedWords.has(word),
  );

  const probeItems: TextRunItem[] = availableWords.map((word) => ({
    id: `${PROBE_PREFIX}${word}`,
    text: word,
    ariaLabel: `Probe the word ${word}`,
  }));

  const transcript: LogEntry[] = [
    ...state.puzzle.examples.map((word, i) => ({
      id: `example-${String(i)}`,
      author: "Host",
      text: word,
      status: "yes" as const,
    })),
    ...state.probes.map((probe, i) => ({
      id: `probe-log-${String(i)}`,
      author: "You",
      text: probe.word,
      status: probe.satisfies ? ("yes" as const) : ("no" as const),
    })),
  ];

  const candidateActions: ActionItem[] = state.puzzle.candidateIds
    .filter((id) => !state.eliminatedIds.includes(id))
    .map((id) => ({
      id: `guess-${id}`,
      label: ruleById(id).description,
      disabled: state.done,
      onClick: () => {
        dispatch({ type: "guess", ruleId: id });
      },
    }));

  return (
    <>
      <Prompt
        headline="One rule decides every word. Probe until you can name it."
        note={`${String(state.probes.length)} probes · ${String(MIN_PROBES_TO_GUESS)} needed before guessing`}
      />
      <Log entries={transcript} ariaLabel="Probe log" />
      <TextRun
        items={probeItems}
        ariaLabel="Words you can probe"
        onSelect={(id) => {
          dispatch({ type: "probe", word: id.slice(PROBE_PREFIX.length) });
        }}
      />
      <Passes label="Probes" used={state.probes.length} total={MIN_PROBES_TO_GUESS} />
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
            id: "guess",
            label: "Guess the rule",
            variant: "primary",
            disabled: !canGuess(state),
            onClick: () => {
              dispatch({ type: "toggle-guess-modal" });
            },
          },
        ]}
      />
      <Feedback
        message={state.message}
        tone={state.done ? (state.won ? "success" : "error") : "neutral"}
      />
      <Modal
        open={state.guessModalOpen}
        title="Guess the rule"
        onClose={() => {
          dispatch({ type: "toggle-guess-modal" });
        }}
      >
        <p className="mb-3 text-left">Which rule fit every probe so far?</p>
        <Actions actions={candidateActions} />
      </Modal>
    </>
  );
}
