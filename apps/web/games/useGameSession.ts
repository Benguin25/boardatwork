"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { localDateKey, weekdayDifficulty, type Difficulty, type Score } from "@boardatwork/game-core";
import { getProgressStore, getStorage } from "@/lib/storage";
import type { GameModule } from "./types";

export type PuzzleSource =
  /** `dateKey` defaults to today; the archive route (SPEC §3.1) passes a past date. */
  | { kind: "daily"; dateKey?: string }
  | { kind: "practice"; counter: number }
  | { kind: "challenge"; seed: number; difficulty: Difficulty };

export interface GameSession<S, M> {
  state: S;
  dispatch: (move: M) => void;
  isDone: boolean;
  score: Score;
  /** True once the daily result has been loaded/hydrated (always true for practice/challenge). */
  ready: boolean;
  dateKey: string;
  seed: number;
  difficulty: Difficulty;
}

/**
 * Owns puzzle generation, move dispatch, and daily-result persistence for
 * one game session. Every dispatched move is appended to a log and, for a
 * completed daily puzzle, saved via `Storage.saveResult` alongside the
 * score — the same log a future server route would replay to verify the
 * result (ADR-0002). Revisiting a completed daily reconstructs the exact
 * final state by replaying the saved moves through `game.reduce`, rather
 * than storing state directly, so this hook exercises the same replay path
 * a server verifier would use.
 */
export function useGameSession<P, S, M>(
  game: GameModule<P, S, M>,
  source: PuzzleSource,
): GameSession<S, M> {
  const today = localDateKey();
  const dateKey = source.kind === "daily" ? (source.dateKey ?? today) : today;

  const { seed, difficulty } = useMemo((): { seed: number; difficulty: Difficulty } => {
    if (source.kind === "daily") {
      return { seed: game.dailySeed(dateKey), difficulty: weekdayDifficulty(dateKey) };
    }
    if (source.kind === "practice") {
      return { seed: game.practiceSeed(source.counter), difficulty: weekdayDifficulty(dateKey) };
    }
    return { seed: source.seed, difficulty: source.difficulty };
  }, [source, dateKey, game]);

  const puzzle = useMemo(() => game.generate(seed, difficulty), [game, seed, difficulty]);

  const [state, setState] = useState<S>(() => game.init(puzzle));
  const [ready, setReady] = useState(source.kind !== "daily");
  const doneRef = useRef(false);
  const movesRef = useRef<M[]>([]);
  const savedRef = useRef(false);

  useEffect(() => {
    setState(game.init(puzzle));
    doneRef.current = false;
    movesRef.current = [];
    savedRef.current = false;
    setReady(source.kind !== "daily");

    if (source.kind !== "daily") {
      return;
    }
    let cancelled = false;
    void getStorage()
      .getResult(game.id, dateKey)
      .then((result) => {
        if (cancelled || !result) {
          if (!cancelled) {
            setReady(true);
          }
          return;
        }
        // Boundary cast: `moves` is `unknown[]` in storage (game-agnostic
        // schema); these are exactly the moves this session's own dispatch
        // wrote, so replaying them through this game's own reducer is safe.
        const moves = result.moves as M[];
        let replayed = game.init(puzzle);
        for (const move of moves) {
          replayed = game.reduce(replayed, move);
        }
        movesRef.current = moves;
        doneRef.current = true;
        savedRef.current = true;
        setState(replayed);
        setReady(true);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `game` is a static module reference, not reactive state
  }, [puzzle, source.kind, dateKey]);

  const isDone = game.isDone(state);
  const score = game.score(state);

  useEffect(() => {
    if (source.kind !== "daily" || !isDone || savedRef.current || !ready) {
      return;
    }
    savedRef.current = true;
    void getStorage().saveResult({
      game: game.id,
      dateKey,
      difficulty,
      checksUsed: score.checksUsed,
      hintsUsed: score.hintsUsed,
      won: score.won,
      score,
      moves: movesRef.current,
      completedAt: new Date().toISOString(),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `game`/`score` object identity churns every render; the primitive fields above are the real deps
  }, [isDone, ready, source.kind, dateKey, difficulty]);

  function dispatch(move: M): void {
    if (doneRef.current) {
      return;
    }
    movesRef.current = [...movesRef.current, move];
    setState((current) => game.reduce(current, move));
    if (source.kind === "daily") {
      // Presentation-only breadcrumb so the home page can say "in
      // progress"; the authoritative record is still the saved result.
      void getProgressStore().save({
        game: game.id,
        dateKey,
        movesPlayed: movesRef.current.length,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  return { state, dispatch, isDone, score, ready, dateKey, seed, difficulty };
}
