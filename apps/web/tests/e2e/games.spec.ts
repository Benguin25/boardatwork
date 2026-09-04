import { expect, test } from "@playwright/test";
import { GAMES, enterWorkMode, openGame } from "./helpers/app";
import { HOME_DISGUISE, SOLVERS } from "./helpers/solve";

/**
 * Gate D / SPEC §4.9: every game is played to completion through the UI,
 * once in the Play skin and once in the disguise it "lives" in — the same
 * moves, the same result, only the chrome differs.
 */
for (const game of GAMES) {
  test(`${game}: completes the daily in the Play skin`, async ({ page }) => {
    await openGame(page, game);
    await SOLVERS[game]!(page);
    const results = page.getByRole("dialog");
    await expect(results).toBeVisible();
    await expect(results.getByRole("button", { name: "Share result" })).toBeVisible();
  });

  test(`${game}: completes the daily in its home disguise (${HOME_DISGUISE[game]})`, async ({
    page,
  }) => {
    await openGame(page, game);
    await enterWorkMode(page, HOME_DISGUISE[game]);
    await SOLVERS[game]!(page);
    const results = page.getByRole("dialog");
    await expect(results).toBeVisible();
    await expect(results.getByRole("button", { name: "Share result" })).toBeVisible();
  });
}
