import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { localDateKey, weekdayDifficulty } from "@boardatwork/game-core";
import { braidGame } from "../../games/braid";

const dateKey = localDateKey();
const seed = braidGame.dailySeed(dateKey);
const difficulty = weekdayDifficulty(dateKey);
const puzzle = braidGame.generate(seed, difficulty);

async function dismissHowToPlay(page: Page): Promise<void> {
  // The how-to-play modal auto-opens after an async "any results yet?"
  // check, so give it a moment to appear (with normal Playwright
  // auto-waiting) rather than deciding it's absent on a single snapshot.
  await page
    .getByRole("button", { name: "Close" })
    .click({ timeout: 2000 })
    .catch(() => undefined);
}

async function solveRope(page: Page): Promise<void> {
  const buttons = page.getByRole("button", { name: /, (unassigned|strand \d)$/ });
  for (let i = 0; i < puzzle.letters.length; i += 1) {
    const target = puzzle.letters[i]!.src;
    for (let click = 0; click <= target; click += 1) {
      await buttons.nth(i).click();
    }
  }
}

test("completes the Braid daily in the Play skin", async ({ page }) => {
  await page.goto("/braid");
  await dismissHowToPlay(page);
  await solveRope(page);
  await page.getByRole("button", { name: "Check" }).click();
  await expect(page.getByRole("heading", { name: "Nice work" })).toBeVisible();
});

test("completes the Braid daily in its home disguise (Docs)", async ({ page }) => {
  await page.goto("/braid");
  await dismissHowToPlay(page);
  await page.keyboard.press("Escape"); // -> Work mode, covered
  await page.getByRole("button").first().click(); // exit the cover
  await page.getByRole("button", { name: /Disguise:/ }).click();
  await page.getByRole("button", { name: "Docs" }).click();
  await solveRope(page);
  await page.getByRole("button", { name: "Check" }).click();
  await expect(page.getByRole("heading", { name: "Nice work" })).toBeVisible();
});

const OTHER_SKINS = ["sheets", "slides", "slack", "jira", "outlook", "notion", "terminal"];

for (const skin of OTHER_SKINS) {
  test(`smoke-renders Braid in the ${skin} disguise`, async ({ page }) => {
    await page.goto("/braid");
    await dismissHowToPlay(page);
    await page.keyboard.press("Escape");
    await page.getByRole("button").first().click();
    await page.getByRole("button", { name: /Disguise:/ }).click();
    await page.getByRole("button", { name: new RegExp(`^${skin}$`, "i") }).click();

    // The rope's accessible-name pattern (built by GameView, not the skin)
    // is stable across skins even though each skin picks its own group
    // label ("Letters", "Issue chips", ...), so match on that instead.
    await expect(page.getByRole("button", { name: /, (unassigned|strand \d)$/ })).toHaveCount(
      puzzle.letters.length,
    );
    await expect(page.getByRole("button", { name: "Check" })).toBeVisible();

    const violations = await new AxeBuilder({ page }).analyze();
    expect(violations.violations, JSON.stringify(violations.violations, null, 2)).toEqual([]);
  });
}
