import { z } from "zod";
import { InvalidChallengeCodeError } from "./errors";
import { DifficultySchema } from "./schemas";

/** SPEC §4.6: `/[game]/p/[code]` where code = base64url of `{seed, difficulty, contentVersion, by, r}`. */
export const ChallengePayloadSchema = z.object({
  game: z.string().min(1),
  seed: z.number().int(),
  difficulty: DifficultySchema,
  contentVersion: z.number().int().nonnegative(),
  by: z.string().min(1).max(40),
  r: z.number(),
});

export type ChallengePayload = z.infer<typeof ChallengePayloadSchema>;

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(input: string): Uint8Array {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  let binary: string;
  try {
    binary = atob(padded);
  } catch {
    throw new InvalidChallengeCodeError("not valid base64url");
  }
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function encodeChallengeCode(payload: ChallengePayload): string {
  const json = JSON.stringify(payload);
  return toBase64Url(new TextEncoder().encode(json));
}

export function decodeChallengeCode(code: string): ChallengePayload {
  const bytes = fromBase64Url(code);
  let json: string;
  try {
    json = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new InvalidChallengeCodeError("not valid UTF-8");
  }
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    throw new InvalidChallengeCodeError("not valid JSON");
  }
  const parsed = ChallengePayloadSchema.safeParse(raw);
  if (!parsed.success) {
    throw new InvalidChallengeCodeError(parsed.error.message);
  }
  return parsed.data;
}

/**
 * Signing seam (ADR-0004): unsigned for now. `sign`/`verify` are already
 * shaped for a future HMAC implementation so call sites never change when
 * one is added — only these two functions are swapped out.
 */
export type ChallengeSigner = (code: string) => string;
export type ChallengeVerifier = (code: string, signature: string) => boolean;

export const identitySign: ChallengeSigner = (code) => code;
export const identityVerify: ChallengeVerifier = (code, signature) =>
  signature === code;
