import { RULES } from "@boardatwork/rules";
import type { ActionItem, SkinPrimitives, TextRunItem } from "@/components/primitives/types";
import { canGuess, MAX_HINTS, MIN_PROBES_TO_GUESS, type PolicyMove, type PolicyState } from "./engine";

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
  const { TextRun, Actions, Feedback, Log, Modal, Passes } = skin;

  const probedWords = new Set(state.probes.map((p) => p.word));
  const availableWords = state.puzzle.probeCandidates.filter((word) => !probedWords.has(word));

  const probeItems: TextRunItem[] = availableWords.map((word) => ({
    id: `${PROBE_PREFIX}${word}`,
    text: word,
    ariaLabel: `Probe the word ${word}`,
  }));

  const candidateActions: ActionItem[] = state.puzzle.candidateIds
    .filter((id) => !state.eliminatedIds.includes(id))
    .map((id) => {
      const rule = ruleById(id);
      return {
        id: `guess-${id}`,
        label: rule.description,
        disabled: state.done,
        onClick: () => {
          dispatch({ type: "guess", ruleId: id });
        },
      };
    });

  return (
    <div className="flex flex-col gap-6">
      <Log entries={state.log} />
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">
          {availableWords.length > 0 ? "Tap a word to probe it against the rule:" : "No more words to probe."}
        </p>
        <TextRun
          items={probeItems}
          onSelect={(id) => {
            dispatch({ type: "probe", word: id.slice(PROBE_PREFIX.length) });
          }}
        />
      </div>
      <div className="flex flex-wrap gap-4">
        <Passes label="Probes" used={state.probes.length} total={MIN_PROBES_TO_GUESS} />
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
      <Feedback message={state.message} tone={state.done ? (state.won ? "success" : "error") : "neutral"} />
      <Modal
        open={state.guessModalOpen}
        title="Guess the rule"
        onClose={() => {
          dispatch({ type: "toggle-guess-modal" });
        }}
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm">Which rule fit every probe so far?</p>
          <Actions actions={candidateActions} />
        </div>
      </Modal>
    </div>
  );
}
