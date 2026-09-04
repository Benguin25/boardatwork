import { expect, test } from "@playwright/test";
import { GAMES } from "./helpers/app";

test("home page lists today's six puzzles with their status", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Board at Work", level: 1 })).toBeVisible();
  for (const game of GAMES) {
    await expect(page.getByRole("link", { name: new RegExp(game, "i") })).toBeVisible();
  }
  await expect(page.getByText("Unplayed").first()).toBeVisible();
});
