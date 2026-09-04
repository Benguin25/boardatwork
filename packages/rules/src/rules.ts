/**
 * The rule predicate library that powers Policy (SPEC §2.5): each `Rule` is
 * a pure `(word: string) => boolean` test over a lowercase English word,
 * plus a short human-readable `description` shown to players as the "rule
 * text". Every predicate defensively normalizes its input (lowercases and
 * strips anything outside a-z) even though callers are expected to already
 * pass lowercase a-z words — CLAUDE.md "Validate at boundaries".
 */

export interface Rule {
  id: string;
  description: string;
  test: (word: string) => boolean;
}

const VOWELS = new Set(["a", "e", "i", "o", "u"]);

/** Lowercases and strips everything but a-z, so every predicate is robust to stray input. */
function norm(word: string): string {
  return word.toLowerCase().replace(/[^a-z]/g, "");
}

function isVowel(ch: string): boolean {
  return VOWELS.has(ch);
}

function countVowelOccurrences(w: string): number {
  let n = 0;
  for (const ch of w) {
    if (isVowel(ch)) {
      n += 1;
    }
  }
  return n;
}

function distinctVowels(w: string): Set<string> {
  const set = new Set<string>();
  for (const ch of w) {
    if (isVowel(ch)) {
      set.add(ch);
    }
  }
  return set;
}

function letterCounts(w: string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const ch of w) {
    counts.set(ch, (counts.get(ch) ?? 0) + 1);
  }
  return counts;
}

function isPrime(n: number): boolean {
  if (n < 2) {
    return false;
  }
  for (let d = 2; d * d <= n; d += 1) {
    if (n % d === 0) {
      return false;
    }
  }
  return true;
}

function isPerfectSquare(n: number): boolean {
  if (n < 1) {
    return false;
  }
  const root = Math.round(Math.sqrt(n));
  return root * root === n;
}

function everyChar(w: string, allowed: string): boolean {
  if (w.length === 0) {
    return false;
  }
  const set = new Set(allowed);
  return Array.from(w).every((ch) => set.has(ch));
}

function hasAdjacentPair(w: string, matches: (a: string, b: string) => boolean): boolean {
  for (let i = 1; i < w.length; i += 1) {
    if (matches(w[i - 1] as string, w[i] as string)) {
      return true;
    }
  }
  return false;
}

const LEFT_HAND = "qwertasdfgzxcvb";
const RIGHT_HAND = "yuiophjklnm";
const TOP_ROW = "qwertyuiop";
const HOME_ROW = "asdfghjkl";

export const RULES: readonly Rule[] = [
  // --- Letter-pattern rules ---
  {
    id: "double-letter",
    description: "Contains a double letter (the same letter twice in a row)",
    test: (word) => hasAdjacentPair(norm(word), (a, b) => a === b),
  },
  {
    id: "same-first-last",
    description: "Starts and ends with the same letter",
    test: (word) => {
      const w = norm(word);
      return w.length > 0 && w[0] === w[w.length - 1];
    },
  },
  {
    id: "no-vowels-except-e",
    description: "The only vowel used is E (A, I, O and U never appear)",
    test: (word) => {
      const w = norm(word);
      return w.length > 0 && !Array.from(w).some((ch) => isVowel(ch) && ch !== "e");
    },
  },
  {
    id: "all-five-vowels",
    description: "Contains all five vowels (A, E, I, O, U) at least once each",
    test: (word) => distinctVowels(norm(word)).size === 5,
  },
  {
    id: "isogram",
    description: "Every letter appears exactly once (no repeated letters)",
    test: (word) => {
      const w = norm(word);
      if (w.length === 0) {
        return false;
      }
      return new Set(w).size === w.length;
    },
  },
  {
    id: "more-consonants-than-vowels",
    description: "Has more consonants than vowels",
    test: (word) => {
      const w = norm(word);
      return w.length - countVowelOccurrences(w) > countVowelOccurrences(w);
    },
  },
  {
    id: "no-letter-more-than-twice",
    description: "No letter appears more than twice",
    test: (word) => {
      const w = norm(word);
      return w.length > 0 && [...letterCounts(w).values()].every((n) => n <= 2);
    },
  },
  {
    id: "three-distinct-vowels",
    description: "Contains three or more distinct vowels",
    test: (word) => distinctVowels(norm(word)).size >= 3,
  },
  {
    id: "double-vowel",
    description: "Contains the same vowel twice in a row (like \"oo\" or \"ee\")",
    test: (word) => hasAdjacentPair(norm(word), (a, b) => a === b && isVowel(a)),
  },
  {
    id: "double-consonant",
    description: "Contains the same consonant twice in a row",
    test: (word) => hasAdjacentPair(norm(word), (a, b) => a === b && !isVowel(a)),
  },

  // --- Alphabet-position rules ---
  {
    id: "alphabetical-order",
    description: "Letters are in alphabetical order (each one is A-or-later than the one before)",
    test: (word) => {
      const w = norm(word);
      if (w.length === 0) {
        return false;
      }
      for (let i = 1; i < w.length; i += 1) {
        if ((w[i] as string) < (w[i - 1] as string)) {
          return false;
        }
      }
      return true;
    },
  },
  {
    id: "reverse-alphabetical-order",
    description: "Letters are in reverse alphabetical order",
    test: (word) => {
      const w = norm(word);
      if (w.length === 0) {
        return false;
      }
      for (let i = 1; i < w.length; i += 1) {
        if ((w[i] as string) > (w[i - 1] as string)) {
          return false;
        }
      }
      return true;
    },
  },
  {
    id: "first-half-alphabet",
    description: "Uses only letters from the first half of the alphabet (A-M)",
    test: (word) => everyChar(norm(word), "abcdefghijklm"),
  },
  {
    id: "second-half-alphabet",
    description: "Uses only letters from the second half of the alphabet (N-Z)",
    test: (word) => everyChar(norm(word), "nopqrstuvwxyz"),
  },
  {
    id: "has-second-half-letter",
    description: "Contains at least one letter from the second half of the alphabet (N-Z)",
    test: (word) => Array.from(norm(word)).some((ch) => ch >= "n"),
  },
  {
    id: "first-before-last",
    description: "The first letter comes earlier in the alphabet than the last letter",
    test: (word) => {
      const w = norm(word);
      return w.length > 1 && (w[0] as string) < (w[w.length - 1] as string);
    },
  },
  {
    id: "contains-q-or-z",
    description: "Contains the letter Q or Z",
    test: (word) => Array.from(norm(word)).some((ch) => ch === "q" || ch === "z"),
  },

  // --- Keyboard-layout rules (QWERTY) ---
  {
    id: "left-hand-only",
    description: "Can be typed with the left hand only (QWERTY touch typing)",
    test: (word) => everyChar(norm(word), LEFT_HAND),
  },
  {
    id: "right-hand-only",
    description: "Can be typed with the right hand only (QWERTY touch typing)",
    test: (word) => everyChar(norm(word), RIGHT_HAND),
  },
  {
    id: "top-row-only",
    description: "Uses only letters from the top QWERTY row (QWERTYUIOP)",
    test: (word) => everyChar(norm(word), TOP_ROW),
  },
  {
    id: "home-row-only",
    description: "Uses only letters from the home QWERTY row (ASDFGHJKL)",
    test: (word) => everyChar(norm(word), HOME_ROW),
  },

  // --- Length / structure rules ---
  {
    id: "palindrome",
    description: "Is a palindrome (reads the same backwards)",
    test: (word) => {
      const w = norm(word);
      return w.length > 0 && w === Array.from(w).reverse().join("");
    },
  },
  {
    id: "prime-length",
    description: "The number of letters is a prime number",
    test: (word) => isPrime(norm(word).length),
  },
  {
    id: "even-length",
    description: "The number of letters is even",
    test: (word) => {
      const w = norm(word);
      return w.length > 0 && w.length % 2 === 0;
    },
  },
  {
    id: "odd-length",
    description: "The number of letters is odd",
    test: (word) => norm(word).length % 2 === 1,
  },
  {
    id: "starts-vowel-ends-consonant",
    description: "Starts with a vowel and ends with a consonant",
    test: (word) => {
      const w = norm(word);
      return w.length > 1 && isVowel(w[0] as string) && !isVowel(w[w.length - 1] as string);
    },
  },
  {
    id: "starts-consonant-ends-vowel",
    description: "Starts with a consonant and ends with a vowel",
    test: (word) => {
      const w = norm(word);
      return w.length > 1 && !isVowel(w[0] as string) && isVowel(w[w.length - 1] as string);
    },
  },
  {
    id: "multiple-of-three-length",
    description: "The number of letters is a multiple of 3",
    test: (word) => {
      const w = norm(word);
      return w.length > 0 && w.length % 3 === 0;
    },
  },
  {
    id: "long-word",
    description: "Has 7 or more letters",
    test: (word) => norm(word).length >= 7,
  },
  {
    id: "short-word",
    description: "Has 4 or fewer letters",
    test: (word) => {
      const w = norm(word);
      return w.length > 0 && w.length <= 4;
    },
  },
  {
    id: "square-length",
    description: "The number of letters is a perfect square (1, 4, 9, 16, ...)",
    test: (word) => isPerfectSquare(norm(word).length),
  },
  {
    id: "second-letter-vowel",
    description: "The second letter is a vowel",
    test: (word) => {
      const w = norm(word);
      return w.length >= 2 && isVowel(w[1] as string);
    },
  },
  {
    id: "second-last-letter-vowel",
    description: "The second-to-last letter is a vowel",
    test: (word) => {
      const w = norm(word);
      return w.length >= 2 && isVowel(w[w.length - 2] as string);
    },
  },

  // --- Numeric / count rules ---
  {
    id: "exactly-one-vowel",
    description: "Contains exactly one vowel",
    test: (word) => countVowelOccurrences(norm(word)) === 1,
  },
  {
    id: "exactly-two-vowels",
    description: "Contains exactly two vowels",
    test: (word) => countVowelOccurrences(norm(word)) === 2,
  },
  {
    id: "no-vowels",
    description: "Contains no vowels (A, E, I, O, U) at all",
    test: (word) => {
      const w = norm(word);
      return w.length > 0 && countVowelOccurrences(w) === 0;
    },
  },
  {
    id: "more-unique-than-repeated",
    description: "Has more letters that appear once than letters that repeat",
    test: (word) => {
      const w = norm(word);
      if (w.length === 0) {
        return false;
      }
      const counts = [...letterCounts(w).values()];
      const uniqueLetters = counts.filter((n) => n === 1).length;
      const repeatedLetters = counts.filter((n) => n > 1).length;
      return uniqueLetters > repeatedLetters;
    },
  },
  {
    id: "contains-no-e",
    description: "Never uses the letter E",
    test: (word) => {
      const w = norm(word);
      return w.length > 0 && !w.includes("e");
    },
  },
  {
    id: "ends-with-e",
    description: "Ends with the letter E",
    test: (word) => {
      const w = norm(word);
      return w.length > 0 && w.endsWith("e");
    },
  },
  {
    id: "contains-y",
    description: "Contains the letter Y",
    test: (word) => norm(word).includes("y"),
  },
  {
    id: "consonant-cluster",
    description: "Contains three consonants in a row",
    test: (word) => {
      const w = norm(word);
      for (let i = 2; i < w.length; i += 1) {
        if (!isVowel(w[i - 2] as string) && !isVowel(w[i - 1] as string) && !isVowel(w[i] as string)) {
          return true;
        }
      }
      return false;
    },
  },
  {
    id: "vowel-heavy",
    description: "At least half the letters are vowels",
    test: (word) => {
      const w = norm(word);
      return w.length > 0 && countVowelOccurrences(w) * 2 >= w.length;
    },
  },
  {
    id: "no-double-letters",
    description: "Never has the same letter twice in a row",
    test: (word) => {
      const w = norm(word);
      return w.length > 0 && !hasAdjacentPair(w, (a, b) => a === b);
    },
  },
];
