"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { decodeChallengeCode } from "@boardatwork/game-core";
import { GamePageShell } from "@/components/shell/GamePageShell";
import { gameRegistry } from "@/games/registry";

export default function ChallengeGamePage({
  params,
}: {
  params: Promise<{ game: string; code: string }>;
}): React.ReactElement {
  const { game: gameId, code } = use(params);
  const game = gameRegistry.find((g) => g.id === gameId);
  if (!game) {
    notFound();
  }
  let payload;
  try {
    payload = decodeChallengeCode(code);
  } catch {
    notFound();
  }
  return (
    <GamePageShell
      game={game}
      source={{ kind: "challenge", seed: payload.seed, difficulty: payload.difficulty }}
      challengeFrom={{ by: payload.by, r: payload.r }}
    />
  );
}
