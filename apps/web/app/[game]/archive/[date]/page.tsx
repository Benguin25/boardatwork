"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { isValidDateKey } from "@boardatwork/game-core";
import { GamePageShell } from "@/components/shell/GamePageShell";
import { gameRegistry } from "@/games/registry";

/**
 * SPEC §3.1: `/[game]/archive/[date]`, "signed-in only" once identity
 * exists (ADR-0001 — out of scope for this local-only run). Reuses the
 * same daily puzzle/result path as `/[game]`, just for a past date.
 */
export default function ArchiveGamePage({
  params,
}: {
  params: Promise<{ game: string; date: string }>;
}): React.ReactElement {
  const { game: gameId, date } = use(params);
  const game = gameRegistry.find((g) => g.id === gameId);
  if (!game || !isValidDateKey(date) || date > new Date().toISOString().slice(0, 10)) {
    notFound();
  }
  return <GamePageShell game={game} source={{ kind: "daily", dateKey: date }} />;
}
