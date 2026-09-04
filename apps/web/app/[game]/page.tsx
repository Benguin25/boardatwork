"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { GamePageShell } from "@/components/shell/GamePageShell";
import { gameRegistry } from "@/games/registry";

export default function DailyGamePage({
  params,
}: {
  params: Promise<{ game: string }>;
}): React.ReactElement {
  const { game: gameId } = use(params);
  const game = gameRegistry.find((g) => g.id === gameId);
  if (!game) {
    notFound();
  }
  return <GamePageShell game={game} source={{ kind: "daily" }} />;
}
