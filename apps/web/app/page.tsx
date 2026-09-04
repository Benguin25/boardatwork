"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Header } from "@/components/shell/Header";
import { DisguisePicker } from "@/components/shell/DisguisePicker";
import { gameRegistry } from "@/games/registry";
import { formatPuzzleDate, localDateKey, puzzleNumber } from "@/lib/dates";
import { getProgressStore, getStorage } from "@/lib/storage";
import { useShellStore } from "@/lib/shell-store";
import { getDisguise } from "@/skins/registry";

type PuzzleStatus =
  | { kind: "unplayed" }
  | { kind: "in-progress" }
  | { kind: "done"; score: string };

function statusLabel(status: PuzzleStatus): string {
  switch (status.kind) {
    case "done":
      return `Done · ${status.score}`;
    case "in-progress":
      return "In progress";
    default:
      return "Unplayed";
  }
}

export default function HomePage(): React.ReactElement {
  const mode = useShellStore((s) => s.mode);
  const disguise = useShellStore((s) => s.disguise);
  const covered = useShellStore((s) => s.covered);
  const toggleCovered = useShellStore((s) => s.toggleCovered);
  const setMode = useShellStore((s) => s.setMode);
  const hydrate = useShellStore((s) => s.hydrate);

  const [today, setToday] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Record<string, PuzzleStatus>>({});
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const dateKey = localDateKey();
    setToday(dateKey);
    void Promise.all(
      gameRegistry.map(async (game): Promise<[string, PuzzleStatus]> => {
        const result = await getStorage().getResult(game.id, dateKey);
        if (result) {
          return [
            game.id,
            {
              kind: "done",
              score: `${String(result.score.points)}/${String(result.score.maxPoints)}`,
            },
          ];
        }
        const progress = await getProgressStore().get(game.id, dateKey);
        return [game.id, progress ? { kind: "in-progress" } : { kind: "unplayed" }];
      }),
    ).then((entries) => {
      setStatuses(Object.fromEntries(entries));
    });
  }, []);

  const dateLine =
    today === null
      ? "Today's puzzles"
      : `${formatPuzzleDate(today)} · #${String(puzzleNumber(today))}`;

  const list = (
    <ul>
      {gameRegistry.map((game) => {
        const status = statuses[game.id] ?? { kind: "unplayed" as const };
        return (
          <li key={game.id} className="border-b border-[var(--line)]">
            <Link
              href={`/${game.id}`}
              className="flex items-baseline gap-3 py-3.5 hover:bg-black/5"
            >
              <span className="text-[20px] font-bold tracking-[-0.02em]">
                {game.meta.name}
              </span>
              <span className="flex-1 text-[14px] text-[var(--muted)]">
                {game.meta.tagline}
              </span>
              <span className="text-[13px] text-[var(--muted)]">{statusLabel(status)}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );

  if (mode === "work") {
    const skin = getDisguise(disguise);
    if (covered) {
      return <skin.Cover onExit={toggleCovered} />;
    }
    return (
      <>
        <skin.Chrome
          title="Board at Work"
          meta={dateLine}
          nav={[]}
          onTitleClick={toggleCovered}
          onChangeDisguise={() => {
            setPickerOpen(true);
          }}
          onExitMode={() => {
            setMode("play");
          }}
        >
          {list}
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

  return (
    <div className="skin-play min-h-screen">
      <Header />
      <main className="mx-auto max-w-[var(--column)] px-[18px] pb-20 pt-7">
        <p className="mb-[10px] text-[14px] text-[var(--muted)]">{dateLine}</p>
        <h2 className="mb-[6px] text-[20px] font-bold leading-[1.3]">
          Six puzzles. Nobody has to know.
        </h2>
        <p className="mb-[22px] text-[14px] text-[var(--muted)]">
          Two to five minutes each. Esc hides them all.
        </p>
        {list}
      </main>
    </div>
  );
}
