import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { localDateKey, weekdayDifficulty } from "@boardatwork/game-core";
import { RULES } from "@boardatwork/rules";
import { policyGame } from "../../games/policy";

// SPEC §2.4 registration note: `games/registry.ts` is merged centrally, not
// edited by this task, so `/policy` doesn't resolve yet. This suite
// exercises the game through the internal `/dev/games/policy` route (see
// that route's doc comment) — identical behaviour to what `/policy` will
// serve once the registry wires it up.
const ROUTE = "/dev/games/policy";

const dateKey = localDateKey();
const seed = policyGame.dailySeed(dateKey);
const difficulty = weekdayDifficulty(dateKey);
const puzzle = policyGame.generate(seed, difficulty);
const trueRule = RULES.find((r) => r.id === puzzle.trueRuleId);
if (!trueRule) {
  throw new Error(`Unknown rule id "${puzzle.trueRuleId}"`);
}
const trueRuleDescription = trueRule.description;
const MIN_PROBES = 5;

async function dismissHowToPlay(page: Page): Promise<void> {
  // The how-to-play modal auto-opens after an async "any results yet?"
  // check, so give it a moment to appear (with normal Playwright
  // auto-waiting) rather than deciding it's absent on a single snapshot.
  await page
    .getByRole("button", { name: "Close" })
    .click({ timeout: 2000 })
    .catch(() => undefined);
}

async function makeProbes(page: Page, count: number): Promise<void> {
  for (let i = 0; i < count; i += 1) {
    const word = puzzle.probeCandidates[i] as string;
    await page.getByRole("button", { name: `Probe the word ${word}` }).click();
  }
}

async function guessCorrectly(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Guess the rule" }).click();
  await page.getByRole("dialog").getByRole("button", { name: trueRuleDescription }).click();
}

test("completes the Policy daily in the Play skin", async ({ page }) => {
  await page.goto(ROUTE);
  await dismissHowToPlay(page);
  await makeProbes(page, MIN_PROBES);
  await guessCorrectly(page);
  await expect(page.getByRole("heading", { name: "Nice work" })).toBeVisible();
});

test("completes the Policy daily in its home disguise (Slack)", async ({ page }) => {
  await page.goto(ROUTE);
  await dismissHowToPlay(page);
  await page.keyboard.press("Escape"); // -> Work mode, covered
  await page.getByRole("button").first().click(); // exit the cover
  await page.getByRole("button", { name: /Disguise:/ }).click();
  await page.getByRole("button", { name: "Slack" }).click();
  await makeProbes(page, MIN_PROBES);
  await guessCorrectly(page);
  await expect(page.getByRole("heading", { name: "Nice work" })).toBeVisible();
});

const OTHER_SKINS = ["docs", "sheets", "slides", "jira", "outlook", "notion", "terminal"];

for (const skin of OTHER_SKINS) {
  test(`smoke-renders Policy in the ${skin} disguise`, async ({ page }) => {
    await page.goto(ROUTE);
    await dismissHowToPlay(page);
    await page.keyboard.press("Escape");
    await page.getByRole("button").first().click();
    await page.getByRole("button", { name: /Disguise:/ }).click();
    await page.getByRole("button", { name: new RegExp(`^${skin}$`, "i") }).click();

    await expect(page.getByRole("button", { name: `Probe the word ${puzzle.probeCandidates[0]}` })).toBeVisible();
    await expect(page.getByRole("button", { name: "Guess the rule" })).toBeVisible();

    const violations = await new AxeBuilder({ page }).analyze();
    expect(violations.violations, JSON.stringify(violations.violations, null, 2)).toEqual([]);
  });
}
