"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { encodeChallengeCode } from "@boardatwork/game-core";
import type { AnyGameModule } from "@/games/types";
import { useGameSession, type PuzzleSource } from "@/games/useGameSession";
import { getStorage } from "@/lib/storage";
import { useShellStore } from "@/lib/shell-store";
import { getSkin } from "@/skins/registry";
import { Header } from "./Header";

const CONTENT_VERSION = 1;

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Hosts one game (daily, practice, or a challenge) inside the active
 * skin's chrome. Shared by every `/[game]*` route so puzzle loading,
 * result persistence, the how-to-play/results modals, and share/challenge
 * flows are identical across all six games (SPEC §3.1).
 */
export function GamePageShell({
  game,
  source,
  challengeFrom,
}: {
  game: AnyGameModule;
  source: PuzzleSource;
  /** Set on `/[game]/p/[code]`: who sent the challenge and their result (SPEC §3.3). */
  challengeFrom?: { by: string; r: number | null };
}): React.ReactElement {
  const router = useRouter();
  const mode = useShellStore((s) => s.mode);
  const skinId = useShellStore((s) => s.skin);
  const covered = useShellStore((s) => s.covered);
  const toggleCovered = useShellStore((s) => s.toggleCovered);
  const hydrate = useShellStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const skin = mode === "work" ? getSkin(skinId) : getSkin("play");
  const session = useGameSession(game, source);

  const [howToPlayOpen, setHowToPlayOpen] = useState(false);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [checkedFirstVisit, setCheckedFirstVisit] = useState(false);
  const [senderName, setSenderName] = useState("A friend");
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  useEffect(() => {
    if (source.kind !== "daily" || checkedFirstVisit) {
      return;
    }
    void getStorage()
      .listResults(game.id)
      .then((list) => {
        if (list.length === 0) {
          setHowToPlayOpen(true);
        }
        setCheckedFirstVisit(true);
      });
  }, [game.id, source.kind, checkedFirstVisit]);

  useEffect(() => {
    void getStorage()
      .getSettings()
      .then((settings) => {
        if (settings.nickname) {
          setSenderName(settings.nickname);
        }
      });
  }, []);

  useEffect(() => {
    if (session.ready && session.isDone) {
      setResultsOpen(true);
    }
  }, [session.ready, session.isDone]);

  if (mode === "work" && covered) {
    return <skin.Cover onExit={toggleCovered} />;
  }

  const shareText = game.shareGrid(session.state);
  const challengeCode = encodeChallengeCode({
    game: game.id,
    seed: session.seed,
    difficulty: session.difficulty,
    contentVersion: CONTENT_VERSION,
    by: senderName || "A friend",
    r: session.score.won ? session.score.checksUsed : null,
  });
  const challengeUrl =
    typeof window === "undefined"
      ? ""
      : `${window.location.origin}/${game.id}/p/${challengeCode}`;

  const chromeProps =
    mode === "work"
      ? { title: game.meta.name, onTitleClick: toggleCovered }
      : { title: game.meta.name };

  return (
    <>
      <Header />
      <skin.Chrome {...chromeProps}>
        <div className="flex flex-col gap-6">
          <skin.Actions
            actions={[
              {
                id: "how-to-play",
                label: "How to play",
                variant: "secondary",
                onClick: () => {
                  setHowToPlayOpen(true);
                },
              },
              ...(source.kind === "daily"
                ? [
                    {
                      id: "practice",
                      label: "Practice",
                      variant: "secondary" as const,
                      onClick: () => {
                        window.location.assign(`/${game.id}/practice`);
                      },
                    },
                  ]
                : []),
            ]}
          />
          {challengeFrom !== undefined && (
            <skin.Feedback
              message={
                challengeFrom.r !== null
                  ? `${challengeFrom.by} cleared this in ${String(challengeFrom.r)}/${String(game.meta.checks)}. Your turn.`
                  : `${challengeFrom.by} sent you this one.`
              }
              tone="neutral"
            />
          )}
          {game.render(session.state, session.dispatch, skin)}
        </div>

        <skin.Modal
          open={howToPlayOpen}
          title={`How to play ${game.meta.name}`}
          onClose={() => {
            setHowToPlayOpen(false);
          }}
        >
          {game.help}
        </skin.Modal>

        <skin.Modal
          open={resultsOpen}
          title={session.score.won ? "Nice work" : "Results"}
          onClose={() => {
            setResultsOpen(false);
          }}
        >
          <div className="flex flex-col gap-4 text-sm">
            <p>
              {session.score.points}/{session.score.maxPoints} points ·{" "}
              {session.score.checksUsed} checks · {session.score.hintsUsed}{" "}
              hints
            </p>
            <pre className="whitespace-pre-wrap rounded border border-neutral-300 p-3 font-mono text-xs">
              {shareText}
            </pre>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  void copyToClipboard(shareText).then((ok) => {
                    setCopyStatus(ok ? "Copied result." : "Copy failed.");
                  });
                }}
                className="rounded-full bg-black px-4 py-1.5 text-sm font-semibold text-white"
              >
                Share result
              </button>
              <button
                type="button"
                onClick={() => {
                  void copyToClipboard(challengeUrl).then((ok) => {
                    setCopyStatus(
                      ok ? "Copied challenge link." : "Copy failed.",
                    );
                  });
                }}
                className="rounded-full border-2 border-black px-4 py-1.5 text-sm font-semibold"
              >
                Challenge link
              </button>
              <button
                type="button"
                onClick={() => {
                  const counter = Math.floor(Math.random() * 1_000_000) + 1;
                  router.push(`/${game.id}/practice?n=${String(counter)}`);
                }}
                className="rounded-full border-2 border-black px-4 py-1.5 text-sm font-semibold"
              >
                Play another
              </button>
            </div>
            {copyStatus !== null && (
              <p
                role="status"
                aria-live="polite"
                className="text-xs text-neutral-500"
              >
                {copyStatus}
              </p>
            )}
            <label className="flex flex-col gap-1 text-xs text-neutral-500">
              Your name (used on challenge links)
              <input
                value={senderName}
                onChange={(e) => {
                  const value = e.target.value;
                  setSenderName(value);
                  void getStorage()
                    .getSettings()
                    .then((settings) =>
                      getStorage().saveSettings(
                        value
                          ? { ...settings, nickname: value }
                          : { mode: settings.mode, skin: settings.skin },
                      ),
                    );
                }}
                className="rounded border border-neutral-300 px-2 py-1 text-sm text-black"
              />
            </label>
          </div>
        </skin.Modal>
      </skin.Chrome>
    </>
  );
}
