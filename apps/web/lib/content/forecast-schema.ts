import { z } from "zod";

/**
 * One estimation question (SPEC §2.4): a fact-checkable numeric value with
 * a source, a unit label, and a slider range that must bracket the true
 * answer. `min <= answer <= max` is enforced below since the slider (or a
 * typed-number fallback) can only ever land inside `[min, max]`.
 */
export const ForecastQuestionSchema = z
  .object({
    id: z.string().min(1).max(80),
    question: z.string().min(8).max(240),
    answer: z.number().finite(),
    unit: z.string().max(20),
    sourceUrl: z.string().url(),
    min: z.number().finite(),
    max: z.number().finite(),
    difficulty: z.enum(["easy", "medium", "hard"]),
  })
  .refine((entry) => entry.min <= entry.answer && entry.answer <= entry.max, {
    message: "answer must be within [min, max]",
  })
  .refine((entry) => entry.min < entry.max, {
    message: "min must be strictly less than max (the slider needs a real range)",
  });

export const ForecastContentSchema = z
  .array(ForecastQuestionSchema)
  .min(60)
  .refine((entries) => new Set(entries.map((entry) => entry.id)).size === entries.length, {
    message: "question ids must be unique across the content pack",
  })
  .refine(
    (entries) => {
      const tags = new Set(entries.map((entry) => entry.difficulty));
      return (["easy", "medium", "hard"] as const).every((tag) => tags.has(tag));
    },
    { message: "content pack must include at least one entry for each of easy/medium/hard" },
  );

export type ForecastQuestion = z.infer<typeof ForecastQuestionSchema>;
