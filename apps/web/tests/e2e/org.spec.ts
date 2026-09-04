import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { localDateKey, weekdayDifficulty } from "@boardatwork/game-core";
import { orgGame } from "../../games/org";

// SPEC §2.6 registration note: `games/registry.ts` is merged centrally, not
// edited by this task, so `/org` doesn't resolve yet. This suite exercises
// the game through the internal `/dev/games/org` route (see that route's
// doc comment) — identical behaviour to what `/org` will serve once the
// registry wires it up.
const ROUTE = "/dev/games/org";

const dateKey = localDateKey();
const seed = orgGame.dailySeed(dateKey);
const difficulty = weekdayDifficulty(dateKey);
const puzzle = orgGame.generate(seed, difficulty);

async function dismissHowToPlay(page: Page): Promise<void> {
  // The how-to-play modal auto-opens after an async "any results yet?"
  // check, so give it a moment to appear (with normal Playwright
  // auto-waiting) rather than deciding it's absent on a single snapshot.
  await page
    .getByRole("button", { name: "Close" })
    .click({ timeout: 2000 })
    .catch(() => undefined);
}

/** Marks every person's true role and true team "yes" by clicking each cell once (empty -> yes). */
async function solveGrid(page: Page): Promise<void> {
  for (let p = 0; p < puzzle.people.length; p += 1) {
    const person = puzzle.people[p] as string;
    const roleIdx = puzzle.solution.role[p] as number;
    const teamIdx = puzzle.solution.team[p] as number;
    const roleLabel = `${puzzle.roles[roleIdx] as string} lead`;
    const teamLabel = puzzle.teams[teamIdx] as string;
    await page.getByRole("button", { name: `${person}, ${roleLabel}: empty` }).click();
    await page.getByRole("button", { name: `${person}, ${teamLabel}: empty` }).click();
  }
}

test("completes the Org daily in the Play skin", async ({ page }) => {
  await page.goto(ROUTE);
  await dismissHowToPlay(page);
  await solveGrid(page);
  await page.getByRole("button", { name: "Check" }).click();
  await expect(page.getByRole("heading", { name: "Nice work" })).toBeVisible();
});

test("completes the Org daily in its home disguise (Slides)", async ({ page }) => {
  await page.goto(ROUTE);
  await dismissHowToPlay(page);
  await page.keyboard.press("Escape"); // -> Work mode, covered
  await page.getByRole("button").first().click(); // exit the cover
  await page.getByRole("button", { name: /Disguise:/ }).click();
  await page.getByRole("button", { name: "Slides" }).click();
  await solveGrid(page);
  await page.getByRole("button", { name: "Check" }).click();
  await expect(page.getByRole("heading", { name: "Nice work" })).toBeVisible();
});

const OTHER_SKINS = ["docs", "sheets", "slack", "jira", "outlook", "notion", "terminal"];

for (const skin of OTHER_SKINS) {
  test(`smoke-renders Org in the ${skin} disguise`, async ({ page }) => {
    await page.goto(ROUTE);
    await dismissHowToPlay(page);
    await page.keyboard.press("Escape");
    await page.getByRole("button").first().click();
    await page.getByRole("button", { name: /Disguise:/ }).click();
    await page.getByRole("button", { name: new RegExp(`^${skin}$`, "i") }).click();

    // The grid's accessible-name pattern (built by GameView, not the skin)
    // is stable across skins even though each skin picks its own layout —
    // 5 people x 10 columns (role UNION team) = 50 addressable cells.
    await expect(page.getByRole("button", { name: /: (empty|yes|no)$/ })).toHaveCount(50);
    await expect(page.getByRole("button", { name: "Check" })).toBeVisible();

    const violations = await new AxeBuilder({ page }).analyze();
    expect(violations.violations, JSON.stringify(violations.violations, null, 2)).toEqual([]);
  });
}
