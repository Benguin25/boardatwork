"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Header } from "@/components/shell/Header";
import { gameRegistry } from "@/games/registry";
import { formatPuzzleDate, localDateKey, puzzleNumber } from "@/lib/dates";
import { getProgressStore, getStorage } from "@/lib/storage";

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
  const [today, setToday] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Record<string, PuzzleStatus>>({});

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

  return (
    <div className="skin-play min-h-screen">
      <Header />
      <main className="mx-auto max-w-[var(--column)] px-[18px] pb-20 pt-7">
        <p className="mb-[10px] text-[14px] text-[var(--muted)]">
          {today === null
            ? "Today's puzzles"
            : `${formatPuzzleDate(today)} · #${String(puzzleNumber(today))}`}
        </p>
        <h1 className="mb-[6px] text-[20px] font-bold leading-[1.3]">
          Six puzzles. Nobody has to know.
        </h1>
        <p className="mb-[22px] text-[14px] text-[var(--muted)]">
          Two to five minutes each. Esc hides them all.
        </p>
        <ul>
          {gameRegistry.map((game) => {
            const status = statuses[game.id] ?? { kind: "unplayed" as const };
            return (
              <li key={game.id} className="border-b border-[var(--line)]">
                <Link
                  href={`/${game.id}`}
                  className="flex items-baseline gap-3 py-3.5 hover:bg-[#f0f0f0]"
                >
                  <span className="text-[20px] font-bold tracking-[-0.02em]">
                    {game.meta.name}
                  </span>
                  <span className="flex-1 text-[14px] text-[var(--muted)]">
                    {game.meta.tagline}
                  </span>
                  <span className="text-[13px] text-[var(--muted)]">
                    {statusLabel(status)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}
