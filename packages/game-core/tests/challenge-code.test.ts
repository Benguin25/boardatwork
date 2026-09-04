import { describe, expect, it } from "vitest";
import {
  type ChallengePayload,
  decodeChallengeCode,
  encodeChallengeCode,
  identitySign,
  identityVerify,
} from "../src/challenge-code";
import { InvalidChallengeCodeError } from "../src/errors";

function rawBase64UrlOfBytes(bytes: readonly number[]): string {
  const binary = String.fromCharCode(...bytes);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function rawBase64UrlOfText(text: string): string {
  return rawBase64UrlOfBytes([...new TextEncoder().encode(text)]);
}

describe("encodeChallengeCode / decodeChallengeCode", () => {
  const payload: ChallengePayload = {
    game: "braid",
    seed: 123456,
    difficulty: "medium",
    contentVersion: 1,
    by: "Zach",
    r: 4,
  };

  it("round-trips a payload", () => {
    const code = encodeChallengeCode(payload);
    expect(decodeChallengeCode(code)).toEqual(payload);
  });

  it("produces a URL-safe string with no padding", () => {
    const code = encodeChallengeCode(payload);
    expect(code).not.toMatch(/[+/=]/);
  });

  it("throws on invalid base64url", () => {
    expect(() => decodeChallengeCode("@@@not-base64@@@")).toThrow(
      InvalidChallengeCodeError,
    );
  });

  it("throws on bytes that are not valid UTF-8", () => {
    const invalidUtf8 = rawBase64UrlOfBytes([0x80, 0x80]);
    expect(() => decodeChallengeCode(invalidUtf8)).toThrow(
      InvalidChallengeCodeError,
    );
  });

  it("throws on valid UTF-8 that is not JSON", () => {
    const notJson = rawBase64UrlOfText("not json at all");
    expect(() => decodeChallengeCode(notJson)).toThrow(InvalidChallengeCodeError);
  });

  it("throws on JSON that doesn't match the schema", () => {
    const wrongShape = rawBase64UrlOfText(JSON.stringify({ foo: 1 }));
    expect(() => decodeChallengeCode(wrongShape)).toThrow(
      InvalidChallengeCodeError,
    );
  });
});

describe("identitySign / identityVerify", () => {
  it("sign is a no-op identity", () => {
    expect(identitySign("abc")).toBe("abc");
  });

  it("verify accepts the code as its own signature", () => {
    expect(identityVerify("abc", "abc")).toBe(true);
    expect(identityVerify("abc", "xyz")).toBe(false);
  });
});
