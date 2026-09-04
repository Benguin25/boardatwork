import type { ChromeNavItem } from "./types";

/**
 * Stable ids for the shell's chrome nav, so a skin can place a specific
 * shell action where its app would put it (Docs hangs "Make one" off the
 * Share pill) without inspecting labels or knowing which game is loaded.
 */
export const NAV_HOW_TO_PLAY = "how-to-play";
export const NAV_STATS = "stats";
export const NAV_MAKE_ONE = "make-one";

export function findNav(
  nav: readonly ChromeNavItem[],
  id: string,
): ChromeNavItem | undefined {
  return nav.find((item) => item.id === id);
}
