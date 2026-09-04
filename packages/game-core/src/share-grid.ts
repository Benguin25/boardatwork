/**
 * Shared building blocks for each game's `shareGrid()` (SPEC §2: "one line
 * per check, emoji-only, no letters"). Games compose these into their own
 * `share.ts`; this module holds no game-specific emoji meaning.
 */
export const SHARE_EMOJI = {
  correct: "🟩",
  partial: "🟨",
  wrong: "⬛",
  hint: "💡",
} as const;

/** Joins per-cell emoji marks into a single share-grid line. */
export function shareLine(marks: readonly string[]): string {
  return marks.join("");
}

/** 💡 suffix for a line, one bulb per hint used on that check (empty if none). */
export function hintSuffix(hintsUsed: number): string {
  if (hintsUsed <= 0) {
    return "";
  }
  return ` ${SHARE_EMOJI.hint.repeat(hintsUsed)}`;
}

export function shareGridHeader(
  gameName: string,
  dateKey: string,
  checksUsed: number,
  totalChecks: number,
): string {
  return `${gameName} ${dateKey} ${String(checksUsed)}/${String(totalChecks)}`;
}

/** Assembles a header, blank line, per-check lines, and an optional footer (e.g. a challenge link). */
export function buildShareGrid(
  header: string,
  lines: readonly string[],
  footer?: string,
): string {
  const parts = [header, "", ...lines];
  if (footer !== undefined) {
    parts.push("", footer);
  }
  return parts.join("\n");
}
