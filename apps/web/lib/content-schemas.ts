import type { ZodTypeAny } from "zod";
import { BraidContentSchema } from "./content/braid-schema";
import { ProofContentSchema } from "./content/proof-schema";
import { ForecastContentSchema } from "./content/forecast-schema";

/**
 * Registry of content-pack schemas keyed by game id. Populated as each
 * game's content pack is added; `content:check` validates every JSON file
 * under `content/<gameId>` (or `content/<gameId>.json`) against the schema
 * registered here.
 */
export const contentSchemas: Record<string, ZodTypeAny> = {
  braid: BraidContentSchema,
  forecast: ForecastContentSchema,
  proof: ProofContentSchema,
};
