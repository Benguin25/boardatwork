import { z } from "zod";

const WORD_PATTERN = /^[A-Z]{4,9}$/;

export const BraidWordSetSchema = z
  .object({
    theme: z.string().min(4).max(120),
    words: z.array(z.string().regex(WORD_PATTERN)).min(2).max(3),
    difficulty: z.enum(["easy", "medium", "hard", "triple"]),
  })
  .refine((entry) => (entry.difficulty === "triple" ? entry.words.length === 3 : entry.words.length === 2), {
    message: '"triple" entries need exactly 3 words; other difficulties need exactly 2',
  })
  .refine((entry) => new Set(entry.words).size === entry.words.length, {
    message: "words in a set must be distinct",
  });

export const BraidContentSchema = z
  .array(BraidWordSetSchema)
  .min(200)
  .refine(
    (entries) => {
      const tags = new Set(entries.map((entry) => entry.difficulty));
      return (["easy", "medium", "hard", "triple"] as const).every((tag) => tags.has(tag));
    },
    { message: "content pack must include at least one entry for each of easy/medium/hard/triple" },
  );
