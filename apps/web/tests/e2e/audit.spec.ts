import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { localDateKey, weekdayDifficulty } from "@boardatwork/game-core";
import { auditGame } from "../../games/audit";

// SPEC §2.2 registration note: `games/registry.ts` is merged centrally, not
// edited by this task, so `/audit` doesn't resolve yet. This suite
// exercises the game through the internal `/dev/games/audit` route (see
// that route's doc comment) — identical behaviour to what `/audit` will
// serve once the registry wires it up.
const ROUTE = "/audit";

const dateKey = localDateKey();
const seed = auditGame.dailySeed(dateKey);
const difficulty = weekdayDifficulty(dateKey);
const puzzle = auditGame.generate(seed, difficulty);

async function dismissHowToPlay(page: Page): Promise<void> {
  // The how-to-play modal auto-opens after an async "any results yet?"
  // check, so give it a moment to appear (with normal Playwright
  // auto-waiting) rather than deciding it's absent on a single snapshot.
  await page
    .getByRole("button", { name: "Close" })
    .click({ timeout: 2000 })
    .catch(() => undefined);
}

/**
 * Every skin renders the Grid primitive as an HTML `<table>` with one
 * `<button>` per cell in row-major order (matching `puzzle.alteredCells`'
 * indexing) — unlike Braid's rope, each skin builds its OWN aria-label
 * format for a grid cell (e.g. Sheets uses "A1: 42", others "Row 1, column
 * 1: 42"), so matching on `table button` position is the one thing that's
 * stable across skins here, not the accessible name.
 */
function gridButtons(page: Page) {
  return page.locator("table button");
}

async function flagAlteredCells(page: Page): Promise<void> {
  const buttons = gridButtons(page);
  for (const index of puzzle.alteredCells) {
    await buttons.nth(index).click();
  }
}

test("completes the Audit daily in the Play skin", async ({ page }) => {
  await page.goto(ROUTE);
  await dismissHowToPlay(page);
  await flagAlteredCells(page);
  await page.getByRole("button", { name: "Check" }).click();
  await expect(page.getByRole("heading", { name: "Nice work" })).toBeVisible();
});

test("completes the Audit daily in its home disguise (Sheets)", async ({ page }) => {
  await page.goto(ROUTE);
  await dismissHowToPlay(page);
  await page.keyboard.press("Escape"); // -> Work mode, covered
  await page.getByRole("button").first().click(); // exit the cover
  await page.getByRole("button", { name: /Disguise:/ }).click();
  await page.getByRole("button", { name: "Sheets" }).click();
  await flagAlteredCells(page);
  await page.getByRole("button", { name: "Check" }).click();
  await expect(page.getByRole("heading", { name: "Nice work" })).toBeVisible();
});

const OTHER_SKINS = ["docs", "slides", "slack", "jira", "outlook", "notion", "terminal"];

for (const skin of OTHER_SKINS) {
  test(`smoke-renders Audit in the ${skin} disguise`, async ({ page }) => {
    await page.goto(ROUTE);
    await dismissHowToPlay(page);
    await page.keyboard.press("Escape");
    await page.getByRole("button").first().click();
    await page.getByRole("button", { name: /Disguise:/ }).click();
    await page.getByRole("button", { name: new RegExp(`^${skin}$`, "i") }).click();

    await expect(gridButtons(page)).toHaveCount(puzzle.displayedGrid.length);
    await expect(page.getByRole("button", { name: "Check" })).toBeVisible();

    const violations = await new AxeBuilder({ page }).analyze();
    expect(violations.violations, JSON.stringify(violations.violations, null, 2)).toEqual([]);
  });
}
