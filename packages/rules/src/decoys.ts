import type { Rng } from "@boardatwork/game-core";
import { RULES, type Rule } from "./rules";

/**
 * Deterministically picks `count` decoy rules — distinct from each other and
 * from `trueRuleId` — using the puzzle's own seeded `Rng` (never a fresh
 * unseeded shuffle), so the same seed always produces the same candidate
 * set (CLAUDE.md "Determinism").
 */
export function pickDecoyRules(trueRuleId: string, rng: Rng, count: number): Rule[] {
  const pool = RULES.filter((rule) => rule.id !== trueRuleId);
  if (count < 0 || count > pool.length) {
    throw new RangeError(
      `pickDecoyRules: count must be between 0 and ${String(pool.length)} (got ${String(count)})`,
    );
  }
  return rng.shuffle(pool).slice(0, count);
}
