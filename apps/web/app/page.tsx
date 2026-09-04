"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { localDateKey } from "@boardatwork/game-core";
import { Header } from "@/components/shell/Header";
import { getStorage } from "@/lib/storage";
import { gameRegistry } from "@/games/registry";

interface PuzzleStatus {
  gameId: string;
  name: string;
  tagline: string;
  status: "unplayed" | "done";
  score?: string | undefined;
}

export default function HomePage(): React.ReactElement {
  const [statuses, setStatuses] = useState<PuzzleStatus[] | null>(null);

  useEffect(() => {
    const today = localDateKey();
    void Promise.all(
      gameRegistry.map(async (game) => {
        const result = await getStorage().getResult(game.id, today);
        const status: PuzzleStatus = {
          gameId: game.id,
          name: game.meta.name,
          tagline: game.meta.tagline,
          status: result ? "done" : "unplayed",
          score: result ? `${String(result.score.points)}/${String(result.score.maxPoints)}` : undefined,
        };
        return status;
      }),
    ).then(setStatuses);
  }, []);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-3xl font-bold">Board at Work</h1>
        <p className="mt-2 text-neutral-600">
          Daily puzzle games that look like work.
        </p>
        <ul className="mt-8 flex flex-col gap-3">
          {gameRegistry.length === 0 && (
            <li className="text-neutral-500">No games yet — check back soon.</li>
          )}
          {(statuses ?? gameRegistry.map((g) => ({ gameId: g.id, name: g.meta.name, tagline: g.meta.tagline, status: "unplayed" as const }))).map(
            (item) => (
              <li key={item.gameId}>
                <Link
                  href={`/${item.gameId}`}
                  className="flex items-center justify-between rounded border border-neutral-200 px-4 py-3 hover:border-neutral-400"
                >
                  <span>
                    <span className="font-semibold">{item.name}</span>
                    <span className="ml-2 text-sm text-neutral-500">{item.tagline}</span>
                  </span>
                  <span className="text-sm text-neutral-500">
                    {item.status === "done" ? `Done · ${item.score ?? ""}` : "Unplayed"}
                  </span>
                </Link>
              </li>
            ),
          )}
        </ul>
      </main>
    </div>
  );
}
