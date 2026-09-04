import { z } from "zod";

/**
 * SPEC §2.3 calls for ≥120 reviewed passages across the whole content team
 * eventually; this pack ships 25 hand-written, hand-verified passages for
 * the initial build (see `content/proof.json`). Raise `.min()` below as
 * more passages are authored and reviewed.
 */
export const MIN_PROOF_PASSAGES = 25;

/**
 * A passage's `words` are the FULL text already split into tokens in
 * reading order, with any trailing punctuation attached to the word it
 * follows (e.g. "sat." rather than "sat" + "."), matching how Braid keeps
 * its content simple. `impostorIndices` names exactly 5 of those tokens as
 * the real, one-edit-away words that were swapped in for the original
 * (SPEC §2.3: "cat → cot, there → three").
 */
export const ProofPassageSchema = z
  .object({
    id: z.string().min(1),
    words: z.array(z.string().min(1)).min(1),
    impostorIndices: z.array(z.number().int().min(0)).length(5),
    difficulty: z.enum(["easy", "medium", "hard"]),
  })
  .refine((entry) => new Set(entry.impostorIndices).size === entry.impostorIndices.length, {
    message: "impostorIndices must be 5 distinct indices",
  })
  .refine((entry) => entry.impostorIndices.every((i) => i < entry.words.length), {
    message: "every impostorIndex must be within range of words",
  });

export const ProofContentSchema = z
  .array(ProofPassageSchema)
  .min(MIN_PROOF_PASSAGES)
  .refine((entries) => new Set(entries.map((entry) => entry.id)).size === entries.length, {
    message: "passage ids must be unique",
  })
  .refine(
    (entries) => {
      const tags = new Set(entries.map((entry) => entry.difficulty));
      return (["easy", "medium", "hard"] as const).every((tag) => tags.has(tag));
    },
    { message: "content pack must include at least one entry for each of easy/medium/hard" },
  );
