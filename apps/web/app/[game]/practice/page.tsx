"use client";

import { Suspense, use } from "react";
import { notFound } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { GamePageShell } from "@/components/shell/GamePageShell";
import { gameRegistry } from "@/games/registry";

function PracticeGameInner({ gameId }: { gameId: string }): React.ReactElement {
  const game = gameRegistry.find((g) => g.id === gameId);
  if (!game) {
    notFound();
  }
  const searchParams = useSearchParams();
  const counter = Number(searchParams.get("n") ?? "1") || 1;
  return <GamePageShell game={game} source={{ kind: "practice", counter }} />;
}

export default function PracticeGamePage({
  params,
}: {
  params: Promise<{ game: string }>;
}): React.ReactElement {
  const { game: gameId } = use(params);
  return (
    <Suspense fallback={null}>
      <PracticeGameInner gameId={gameId} />
    </Suspense>
  );
}
