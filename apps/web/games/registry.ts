import { braidGame } from "./braid";
import type { AnyGameModule } from "./types";

/**
 * The six shipped games (SPEC §2), populated across Stage 3. The home page
 * renders whatever is registered here, so it grows as each game lands
 * with no shell changes.
 */
export const gameRegistry: readonly AnyGameModule[] = [braidGame as unknown as AnyGameModule];
