import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { localDateKey, weekdayDifficulty } from "@boardatwork/game-core";
import { forecastGame } from "../../games/forecast";

// SPEC §2.4 registration note: `games/registry.ts` is merged centrally, not
// edited by this task, so `/forecast` doesn't resolve yet. This suite
// exercises the game through the internal `/dev/games/forecast` route
// (see that route's doc comment) — identical behaviour to what `/forecast`
// will serve once the registry wires it up.
const ROUTE = "/dev/games/forecast";

const dateKey = localDateKey();
const seed = forecastGame.dailySeed(dateKey);
const difficulty = weekdayDifficulty(dateKey);
const puzzle = forecastGame.generate(seed, difficulty);

async function dismissHowToPlay(page: Page): Promise<void> {
  // The how-to-play modal auto-opens after an async "any results yet?"
  // check, so give it a moment to appear (with normal Playwright
  // auto-waiting) rather than deciding it's absent on a single snapshot.
  await page
    .getByRole("button", { name: "Close" })
    .click({ timeout: 2000 })
    .catch(() => undefined);
}

/** Sets the range slider's value using the input element's native setter, so React's change tracking sees the update (a plain `.value =` assignment does not). */
async function setSlider(page: Page, value: number): Promise<void> {
  await page.getByRole("slider").evaluate((el, v) => {
    const input = el as HTMLInputElement;
    const nativeSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    )?.set;
    nativeSetter?.call(input, String(v));
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, value);
}

async function answerAllQuestions(page: Page): Promise<void> {
  for (const question of puzzle.questions) {
    await setSlider(page, question.answer);
    await page.getByRole("button", { name: "Submit" }).click();
  }
}

test("completes the Forecast daily in the Play skin", async ({ page }) => {
  await page.goto(ROUTE);
  await dismissHowToPlay(page);
  await answerAllQuestions(page);
  await expect(page.getByRole("heading", { name: "Nice work" })).toBeVisible();
});

test("completes the Forecast daily in its home disguise (Sheets)", async ({ page }) => {
  await page.goto(ROUTE);
  await dismissHowToPlay(page);
  await page.keyboard.press("Escape"); // -> Work mode, covered
  await page.getByRole("button").first().click(); // exit the cover
  await page.getByRole("button", { name: /Disguise:/ }).click();
  await page.getByRole("button", { name: "Sheets" }).click();
  await answerAllQuestions(page);
  await expect(page.getByRole("heading", { name: "Nice work" })).toBeVisible();
});

const OTHER_SKINS = ["docs", "slides", "slack", "jira", "outlook", "notion", "terminal"];

for (const skin of OTHER_SKINS) {
  test(`smoke-renders Forecast in the ${skin} disguise`, async ({ page }) => {
    await page.goto(ROUTE);
    await dismissHowToPlay(page);
    await page.keyboard.press("Escape");
    await page.getByRole("button").first().click();
    await page.getByRole("button", { name: /Disguise:/ }).click();
    await page.getByRole("button", { name: new RegExp(`^${skin}$`, "i") }).click();

    await expect(page.getByRole("slider")).toBeVisible();
    await expect(page.getByRole("button", { name: "Submit" })).toBeVisible();

    const violations = await new AxeBuilder({ page }).analyze();
    expect(violations.violations, JSON.stringify(violations.violations, null, 2)).toEqual([]);
  });
}
