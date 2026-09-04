"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { encodeChallengeCode, type GameStats } from "@boardatwork/game-core";
import {
  NAV_HOW_TO_PLAY,
  NAV_MAKE_ONE,
  NAV_STATS,
} from "@/components/primitives/nav";
import type { ChromeNavItem } from "@/components/primitives/types";
import type { AnyGameModule } from "@/games/types";
import { useGameSession, type PuzzleSource } from "@/games/useGameSession";
import { formatPuzzleDate, puzzleNumber } from "@/lib/dates";
import { getStorage } from "@/lib/storage";
import { useShellStore } from "@/lib/shell-store";
import { getDisguise, playSkin } from "@/skins/registry";
import { DisguisePicker } from "./DisguisePicker";

const CONTENT_VERSION = 1;

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function resultHeadline(won: boolean, checksUsed: number): string {
  return won ? `Solved in ${String(checksUsed)}.` : "Not solved.";
}

/**
 * Hosts one game (daily, practice, or a challenge) inside the active
 * skin's chrome. Shared by every `/[game]*` route so puzzle loading,
 * result persistence, the how-to-play/stats/make-one modals, and the
 * share/challenge flows are identical across all six games (SPEC §3.1).
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
  const disguise = useShellStore((s) => s.disguise);
  const covered = useShellStore((s) => s.covered);
  const nickname = useShellStore((s) => s.nickname);
  const setNickname = useShellStore((s) => s.setNickname);
  const toggleCovered = useShellStore((s) => s.toggleCovered);
  const setMode = useShellStore((s) => s.setMode);
  const hydrate = useShellStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const skin = mode === "work" ? getDisguise(disguise) : playSkin;
  const session = useGameSession(game, source);

  const [howToPlayOpen, setHowToPlayOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [makeOneOpen, setMakeOneOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [checkedFirstVisit, setCheckedFirstVisit] = useState(false);
  const [stats, setStats] = useState<GameStats | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [madeLink, setMadeLink] = useState<string | null>(null);

  const senderName = nickname ?? "A friend";

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
    void getStorage().getStats(game.id).then(setStats);
  }, [game.id, session.isDone]);

  useEffect(() => {
    if (session.ready && session.isDone) {
      setStatsOpen(true);
    }
  }, [session.ready, session.isDone]);

  const shareText = game.shareGrid(session.state);

  const challengeUrl = (seed: number): string => {
    const code = encodeChallengeCode({
      game: game.id,
      seed,
      difficulty: session.difficulty,
      contentVersion: CONTENT_VERSION,
      by: senderName,
      r: session.score.won ? session.score.checksUsed : null,
    });
    return typeof window === "undefined" ? "" : `${window.location.origin}/${game.id}/p/${code}`;
  };

  const openPicker = useCallback(() => {
    setPickerOpen(true);
  }, []);

  const nav: readonly ChromeNavItem[] = [
    {
      id: NAV_HOW_TO_PLAY,
      label: "How to play",
      onClick: () => {
        setHowToPlayOpen(true);
      },
    },
    {
      id: NAV_STATS,
      label: "Stats",
      onClick: () => {
        setStatsOpen(true);
      },
    },
    {
      id: NAV_MAKE_ONE,
      label: "Make one",
      onClick: () => {
        setMakeOneOpen(true);
      },
    },
  ];

  if (mode === "work" && covered) {
    return <skin.Cover onExit={toggleCovered} />;
  }

  const subtitle =
    source.kind === "daily"
      ? `#${String(puzzleNumber(session.dateKey))}`
      : source.kind === "practice"
        ? "practice"
        : `from ${challengeFrom?.by ?? "a friend"}`;

  const notice =
    challengeFrom === undefined
      ? undefined
      : challengeFrom.r !== null
        ? `${challengeFrom.by} cleared this in ${String(challengeFrom.r)} of ${String(game.meta.checks)}. Your turn.`
        : `${challengeFrom.by} sent you this one.`;

  return (
    <>
      <skin.Chrome
        title={game.meta.name}
        subtitle={subtitle}
        meta={formatPuzzleDate(session.dateKey)}
        {...(notice !== undefined ? { notice } : {})}
        nav={nav}
        {...(mode === "work" ? { onTitleClick: toggleCovered } : {})}
        onChangeDisguise={openPicker}
        {...(mode === "work"
          ? {
              onExitMode: () => {
                setMode("play");
              },
            }
          : {})}
      >
        {game.render(session.state, session.dispatch, skin)}

        <skin.Modal
          open={howToPlayOpen}
          title="How to play"
          onClose={() => {
            setHowToPlayOpen(false);
          }}
        >
          <div className="text-left text-[15px] leading-[1.55]">{game.help}</div>
        </skin.Modal>

        <skin.Modal
          open={statsOpen}
          title={
            session.isDone
              ? resultHeadline(session.score.won, session.score.checksUsed)
              : "Statistics"
          }
          onClose={() => {
            setStatsOpen(false);
          }}
        >
          <div className="text-center">
            {session.isDone && (
              <p className="mb-3.5 text-[15px] leading-[1.5] text-[var(--muted)]">
                {session.score.points} of {session.score.maxPoints} points ·{" "}
                {session.score.hintsUsed} hints
              </p>
            )}
            <dl className="my-4 flex justify-center gap-[22px]">
              {[
                { id: "played", label: "Played", value: stats?.played ?? 0 },
                {
                  id: "win",
                  label: "Win %",
                  value:
                    stats && stats.played > 0
                      ? Math.round((100 * stats.won) / stats.played)
                      : 0,
                },
                { id: "streak", label: "Streak", value: stats?.currentStreak ?? 0 },
                { id: "best", label: "Best", value: stats?.bestStreak ?? 0 },
              ].map((item) => (
                <div key={item.id}>
                  <dd className="text-[30px] font-normal">{item.value}</dd>
                  <dt className="text-[12px] text-[var(--muted)]">{item.label}</dt>
                </div>
              ))}
            </dl>
            {session.isDone && (
              <pre className="my-2.5 mb-[18px] whitespace-pre-wrap font-[inherit] tracking-[2px]">
                {shareText}
              </pre>
            )}
            <div className="flex flex-wrap justify-center gap-2.5">
              {session.isDone && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      void copyToClipboard(shareText).then((ok) => {
                        setCopyStatus(ok ? "Copied result." : "Copy failed.");
                      });
                    }}
                    className="rounded-full border border-current bg-[var(--ink)] px-[26px] py-[14px] text-[16px] font-semibold text-white"
                  >
                    Share result
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void copyToClipboard(challengeUrl(session.seed)).then((ok) => {
                        setCopyStatus(ok ? "Copied challenge link." : "Copy failed.");
                      });
                    }}
                    className="rounded-full border border-current px-[26px] py-[14px] text-[16px] font-semibold"
                  >
                    Challenge link
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => {
                  const counter = Math.floor(Math.random() * 1_000_000) + 1;
                  router.push(`/${game.id}/practice?n=${String(counter)}`);
                }}
                className="rounded-full border border-current px-[26px] py-[14px] text-[16px] font-semibold"
              >
                Play another
              </button>
            </div>
            {copyStatus !== null && (
              <p role="status" aria-live="polite" className="mt-3 text-[13px] text-[var(--muted)]">
                {copyStatus}
              </p>
            )}
          </div>
        </skin.Modal>

        <skin.Modal
          open={makeOneOpen}
          title="Make one"
          onClose={() => {
            setMakeOneOpen(false);
          }}
        >
          <p className="mb-3.5 text-[15px] leading-[1.5] text-[var(--muted)]">
            Send someone a fresh {game.meta.name}. They get the same puzzle you would,
            with your name on it.
          </p>
          <label className="mb-1 mt-3 block text-left text-[13px] text-[var(--muted)]" htmlFor="make-name">
            Your name
          </label>
          <input
            id="make-name"
            value={nickname ?? ""}
            placeholder="Zach"
            onChange={(event) => {
              setNickname(event.target.value);
            }}
            className="w-full rounded-[6px] border border-[#888] px-3.5 py-3 text-[15px]"
          />
          {madeLink !== null && (
            <div className="mt-2.5 flex items-center gap-2 rounded-[6px] bg-[#f3f3f3] px-3 py-2.5 text-[13px]">
              <span className="flex-1 truncate text-left text-[var(--muted)]">{madeLink}</span>
              <button
                type="button"
                onClick={() => {
                  void copyToClipboard(madeLink).then((ok) => {
                    setCopyStatus(ok ? "Copied link." : "Copy failed.");
                  });
                }}
                className="rounded-full border border-current px-4 py-2 text-[13px] font-semibold"
              >
                Copy
              </button>
            </div>
          )}
          <div className="mt-4 flex justify-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                setMadeLink(
                  challengeUrl(game.practiceSeed(Math.floor(Math.random() * 1_000_000) + 1)),
                );
              }}
              className="rounded-full border border-current bg-[var(--ink)] px-[26px] py-[14px] text-[16px] font-semibold text-white"
            >
              Get link
            </button>
          </div>
          {copyStatus !== null && (
            <p role="status" aria-live="polite" className="mt-3 text-[13px] text-[var(--muted)]">
              {copyStatus}
            </p>
          )}
        </skin.Modal>
      </skin.Chrome>
      {pickerOpen && (
        <DisguisePicker
          onClose={() => {
            setPickerOpen(false);
          }}
        />
      )}
    </>
  );
}
