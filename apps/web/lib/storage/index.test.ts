import { describe, expect, it } from "vitest";
import { getStorage } from "./index";
import { LocalStorageAdapter } from "./local-adapter";

describe("getStorage", () => {
  it("returns a LocalStorageAdapter in a browser-like environment and memoizes it", () => {
    const a = getStorage();
    const b = getStorage();
    expect(a).toBeInstanceOf(LocalStorageAdapter);
    expect(a).toBe(b);
  });
});
