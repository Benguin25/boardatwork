import { auditGame } from "./audit";
import { braidGame } from "./braid";
import { forecastGame } from "./forecast";
import { orgGame } from "./org";
import { policyGame } from "./policy";
import { proofGame } from "./proof";
import type { AnyGameModule } from "./types";

/**
 * The six shipped games (SPEC §2). `GameModule<P, S, M>` is invariant in
 * its type params, so a heterogeneous registry needs a per-entry
 * type-erasing cast to `AnyGameModule` — each game's own file is still
 * fully type-checked against `GameModule` at its own definition site.
 */
export const gameRegistry: readonly AnyGameModule[] = [
  braidGame as unknown as AnyGameModule,
  auditGame as unknown as AnyGameModule,
  proofGame as unknown as AnyGameModule,
  forecastGame as unknown as AnyGameModule,
  orgGame as unknown as AnyGameModule,
  policyGame as unknown as AnyGameModule,
];
