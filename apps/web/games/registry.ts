import type { AnyGameModule } from "./types";

/**
 * The six shipped games (SPEC §2), populated in Stage 3. Empty for now —
 * the home page renders whatever is registered here, so it naturally
 * grows as each game lands with no shell changes.
 */
export const gameRegistry: readonly AnyGameModule[] = [];
