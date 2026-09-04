import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { localDateKey, weekdayDifficulty } from "@boardatwork/game-core";
import { proofGame } from "../../games/proof";

// SPEC §2.3 registration note: `games/registry.ts` is merged centrally, not
// edited by this task, so `/proof` doesn't resolve yet. This suite
// exercises the game through the internal `/dev/games/proof` route (see
// that route's doc comment) — identical behaviour to what `/proof` will
// serve once the registry wires it up.
const ROUTE = "/proof";

const dateKey = localDateKey();
const seed = proofGame.dailySeed(dateKey);
const difficulty = weekdayDifficulty(dateKey);
const puzzle = proofGame.generate(seed, difficulty);

/**
 * Passage buttons render each word's own text as their accessible name
 * (GameView, not the skin, decides that text — every skin's `Passage`
 * primitive renders `{word.text}` verbatim), so a word is matched by its
 * exact text plus which occurrence of that text it is in reading order.
 * That "occurrence of this exact text" pattern is stable across skins,
 * the same way Braid's test matches its rope by an aria-label pattern.
 */
function occurrenceOf(words: readonly string[], targetIndex: number): number {
  const text = words[targetIndex];
  let count = 0;
  for (let i = 0; i < targetIndex; i += 1) {
    if (words[i] === text) {
      count += 1;
    }
  }
  return count;
}

async function dismissHowToPlay(page: Page): Promise<void> {
  // The how-to-play modal auto-opens after an async "any results yet?"
  // check, so give it a moment to appear (with normal Playwright
  // auto-waiting) rather than deciding it's absent on a single snapshot.
  await page
    .getByRole("button", { name: "Close" })
    .click({ timeout: 2000 })
    .catch(() => undefined);
}

async function flagImpostors(page: Page): Promise<void> {
  for (const index of puzzle.impostorIndices) {
    const text = puzzle.words[index] as string;
    const occurrence = occurrenceOf(puzzle.words, index);
    await page.getByRole("button", { name: text, exact: true }).nth(occurrence).click();
  }
}

test("completes the Proof daily in the Play skin", async ({ page }) => {
  await page.goto(ROUTE);
  await dismissHowToPlay(page);
  await flagImpostors(page);
  await page.getByRole("button", { name: "Check" }).click();
  await expect(page.getByRole("heading", { name: "Nice work" })).toBeVisible();
});

test("completes the Proof daily in its home disguise (Docs)", async ({ page }) => {
  await page.goto(ROUTE);
  await dismissHowToPlay(page);
  await page.keyboard.press("Escape"); // -> Work mode, covered
  await page.getByRole("button").first().click(); // exit the cover
  await page.getByRole("button", { name: /Disguise:/ }).click();
  await page.getByRole("button", { name: "Docs" }).click();
  await flagImpostors(page);
  await page.getByRole("button", { name: "Check" }).click();
  await expect(page.getByRole("heading", { name: "Nice work" })).toBeVisible();
});

const OTHER_SKINS = ["sheets", "slides", "slack", "jira", "outlook", "notion", "terminal"];

for (const skin of OTHER_SKINS) {
  test(`smoke-renders Proof in the ${skin} disguise`, async ({ page }) => {
    await page.goto(ROUTE);
    await dismissHowToPlay(page);
    await page.keyboard.press("Escape");
    await page.getByRole("button").first().click();
    await page.getByRole("button", { name: /Disguise:/ }).click();
    await page.getByRole("button", { name: new RegExp(`^${skin}$`, "i") }).click();

    // Every passage word renders as its own button (GameView's contract,
    // not the skin's), so the total button count is a stable smoke check
    // across skins even though each skin renders the passage differently.
    await expect(page.getByRole("button", { name: "Check" })).toBeVisible();
    const wordButtonCount = await page.getByRole("button").count();
    expect(wordButtonCount).toBeGreaterThanOrEqual(puzzle.words.length);

    const violations = await new AxeBuilder({ page }).analyze();
    expect(violations.violations, JSON.stringify(violations.violations, null, 2)).toEqual([]);
  });
}
