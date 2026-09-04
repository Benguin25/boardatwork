import { z } from "zod";

/**
 * The eight Work-mode disguises (SPEC §3.1). The Play skin is deliberately
 * *not* in this list: it is the un-disguised look, not something you can
 * hide behind. Conflating the two is what broke Work mode — the persisted
 * disguise defaulted to `"play"`, so `Esc` rendered the Play skin's
 * placeholder cover forever (ADR-0006).
 */
export const DISGUISE_IDS = [
  "docs",
  "sheets",
  "slides",
  "slack",
  "jira",
  "outlook",
  "notion",
  "terminal",
] as const;

export type DisguiseId = (typeof DISGUISE_IDS)[number];

export const DEFAULT_DISGUISE: DisguiseId = "docs";

const DisguiseIdSchema = z.enum(DISGUISE_IDS);

/**
 * Boundary validation for a disguise id read from `Storage`, a URL, or any
 * other untrusted source (CLAUDE.md: "trust nothing from outside the
 * engine"). Anything unrecognised — including the legacy `"play"` value —
 * resolves to the default disguise rather than a dead render.
 */
export function resolveDisguise(value: unknown): DisguiseId {
  const parsed = DisguiseIdSchema.safeParse(value);
  return parsed.success ? parsed.data : DEFAULT_DISGUISE;
}
