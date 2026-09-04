import { z } from "zod";

export const DifficultySchema = z.enum(["easy", "medium", "hard"]);
