import { describe, expect, it } from "vitest";
import { createRng, hashSeed } from "../src/rng";

describe("createRng", () => {
  it("is deterministic: same seed -> identical sequence across 1000 seeds", () => {
    for (let seed = 0; seed < 1000; seed += 1) {
      const a = createRng(seed);
      const b = createRng(seed);
      const seqA = Array.from({ length: 20 }, () => a.next());
      const seqB = Array.from({ length: 20 }, () => b.next());
      expect(seqA).toEqual(seqB);
    }
  });

  it("produces values in [0, 1)", () => {
    const rng = createRng(42);
    for (let i = 0; i < 2000; i += 1) {
      const value = rng.next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it("different seeds diverge", () => {
    const a = createRng(1);
    const b = createRng(2);
    expect(a.next()).not.toBe(b.next());
  });

  it("handles a zero seed without getting stuck at zero", () => {
    const rng = createRng(0);
    const values = new Set(Array.from({ length: 50 }, () => rng.next()));
    expect(values.size).toBeGreaterThan(1);
  });

  it("nextInt returns integers within [0, max)", () => {
    const rng = createRng(7);
    for (let i = 0; i < 500; i += 1) {
      const value = rng.nextInt(10);
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(10);
    }
  });

  it("nextInt rejects non-positive or non-integer bounds", () => {
    const rng = createRng(1);
    expect(() => rng.nextInt(0)).toThrow(RangeError);
    expect(() => rng.nextInt(-3)).toThrow(RangeError);
    expect(() => rng.nextInt(1.5)).toThrow(RangeError);
  });

  it("pick returns an element from the array", () => {
    const rng = createRng(3);
    const items = ["a", "b", "c"];
    for (let i = 0; i < 100; i += 1) {
      expect(items).toContain(rng.pick(items));
    }
  });

  it("pick rejects an empty array", () => {
    const rng = createRng(3);
    expect(() => rng.pick([])).toThrow(RangeError);
  });

  it("shuffle returns a permutation without mutating the input", () => {
    const rng = createRng(11);
    const items = [1, 2, 3, 4, 5];
    const original = [...items];
    const shuffled = rng.shuffle(items);
    expect(items).toEqual(original);
    expect(shuffled).toHaveLength(items.length);
    expect([...shuffled].sort()).toEqual([...items].sort());
  });

  it("shuffle on a large-enough set eventually reorders elements", () => {
    const items = Array.from({ length: 20 }, (_, i) => i);
    let sawChange = false;
    for (let seed = 0; seed < 20; seed += 1) {
      const rng = createRng(seed);
      const shuffled = rng.shuffle(items);
      if (shuffled.some((value, i) => value !== items[i])) {
        sawChange = true;
        break;
      }
    }
    expect(sawChange).toBe(true);
  });

  it("weightedPick favors higher-weighted items over many draws", () => {
    const rng = createRng(99);
    const counts = { heavy: 0, light: 0 };
    for (let i = 0; i < 2000; i += 1) {
      const value = rng.weightedPick([
        { value: "heavy", weight: 9 },
        { value: "light", weight: 1 },
      ]);
      counts[value as "heavy" | "light"] += 1;
    }
    expect(counts.heavy).toBeGreaterThan(counts.light * 3);
  });

  it("weightedPick with a single item always returns it", () => {
    const rng = createRng(5);
    expect(rng.weightedPick([{ value: "only", weight: 1 }])).toBe("only");
  });

  it("weightedPick rejects an empty list", () => {
    const rng = createRng(5);
    expect(() => rng.weightedPick([])).toThrow(RangeError);
  });

  it("weightedPick rejects non-positive weights", () => {
    const rng = createRng(5);
    expect(() =>
      rng.weightedPick([
        { value: "a", weight: 1 },
        { value: "b", weight: 0 },
      ]),
    ).toThrow(RangeError);
  });
});

describe("hashSeed", () => {
  it("is deterministic for the same parts", () => {
    expect(hashSeed("braid", "2026-09-04")).toBe(hashSeed("braid", "2026-09-04"));
  });

  it("differs for different parts", () => {
    expect(hashSeed("braid", "2026-09-04")).not.toBe(hashSeed("braid", "2026-09-05"));
    expect(hashSeed("braid", "2026-09-04")).not.toBe(hashSeed("audit", "2026-09-04"));
  });

  it("returns a non-negative 32-bit integer", () => {
    const hash = hashSeed("proof", 42, "2026-01-01");
    expect(Number.isInteger(hash)).toBe(true);
    expect(hash).toBeGreaterThanOrEqual(0);
    expect(hash).toBeLessThanOrEqual(0xffffffff);
  });
});
