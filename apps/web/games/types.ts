import type { ReactNode } from "react";
import type { Game } from "@boardatwork/game-core";
import type { SkinPrimitives } from "@/components/primitives/types";
import type { DisguiseId } from "@/lib/disguises";

/**
 * The pure `Game` (ADR-0002) plus the one thing that needs React and a
 * skin: `render`. Kept separate from `Game` itself so `packages/game-core`
 * never depends on React or `SkinPrimitives` (ADR-0003).
 */
export interface GameModule<P, S, M> extends Game<P, S, M> {
  /** Disguise this game "lives" in (SPEC §2, per-game "Work disguise"). */
  homeSkin: DisguiseId;
  /** Static "how to play" copy shown from the header and on first play. */
  help: ReactNode;
  /**
   * Deterministic seed for the daily puzzle on `dateKey` (SPEC §4.6: "seed =
   * hash(game, date)"). A plain wrapper around `hashSeed(id, dateKey)` for
   * most games; a game may fold extra deterministic variants into the seed
   * (e.g. Braid encodes its Sunday "3-word" SPEC §2.1 rule in a low bit)
   * as long as it stays a pure function of `dateKey`.
   */
  dailySeed(dateKey: string): number;
  /** Deterministic seed for the `counter`-th practice puzzle (SPEC §4.6: never written to results). */
  practiceSeed(counter: number): number;
  render(state: S, dispatch: (move: M) => void, skin: SkinPrimitives): ReactNode;
}

/** Type-erased view of a `GameModule` for registries/home listings. */
export type AnyGameModule = GameModule<unknown, unknown, unknown>;
