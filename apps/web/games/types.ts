import type { ReactNode } from "react";
import type { Game } from "@boardatwork/game-core";
import type { SkinPrimitives } from "@/components/primitives/types";

/**
 * The pure `Game` (ADR-0002) plus the one thing that needs React and a
 * skin: `render`. Kept separate from `Game` itself so `packages/game-core`
 * never depends on React or `SkinPrimitives` (ADR-0003).
 */
export interface GameModule<P, S, M> extends Game<P, S, M> {
  /** Disguise this game "lives" in on the home page (SPEC §2, per-game "Work disguise"). */
  homeSkin: string;
  render(state: S, dispatch: (move: M) => void, skin: SkinPrimitives): ReactNode;
}

/** Type-erased view of a `GameModule` for registries/home listings. */
export type AnyGameModule = GameModule<unknown, unknown, unknown>;
