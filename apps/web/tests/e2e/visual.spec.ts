import { expect, test, type Page } from "@playwright/test";
import { DESKTOP, MOBILE } from "./helpers/parity";
import { GAMES, enterWorkMode, hasHorizontalOverflow, type Disguise } from "./helpers/app";

/**
 * Regression baselines, committed to `docs/design/current` so the same
 * files are both the gate and the screens a reviewer looks at.
 *
 * Everything is screenshotted from an archive date
 * rather than "today", so the seed, the weekday difficulty and the puzzle
 * number are all pinned and the baselines stay valid tomorrow.
 *
 * Tagged `@visual` so `npm run e2e` and `npm run visual` can run the two
 * suites separately from one Playwright config.
 */
const ARCHIVE_DATE = "2025-09-01";
const SKINS = ["play", "docs", "sheets", "slack"] as const;
const VIEWPORTS = [
  ["desktop", DESKTOP],
  ["mobile", MOBILE],
] as const;

/** Absorbs subpixel antialiasing without hiding a real layout change. */
const TOLERANCE = { maxDiffPixelRatio: 0.01 };

async function shoot(page: Page, name: string): Promise<void> {
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  expect(await hasHorizontalOverflow(page), `${name} scrolls horizontally`).toBe(false);
  await expect(page).toHaveScreenshot(`${name}.png`, TOLERANCE);
}

async function openArchive(page: Page, game: string): Promise<void> {
  await page.goto(`/${game}/archive/${ARCHIVE_DATE}`);
  await expect(page.getByTestId("chrome-play")).toBeVisible();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
}

for (const game of GAMES) {
  for (const skin of SKINS) {
    for (const [label, viewport] of VIEWPORTS) {
      test(`@visual ${game} in ${skin} at ${label}`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await openArchive(page, game);
        if (skin !== "play") {
          await enterWorkMode(page, skin as Disguise);
          // Keep the pointer off the chrome so no hover state is baked in.
          await page.mouse.move(2, viewport.height - 2);
        }
        await shoot(page, `${game}-${skin}-${label}`);
      });
    }
  }
}

for (const [label, viewport] of VIEWPORTS) {
  test(`@visual home in play at ${label}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Board at Work" })).toBeVisible();
    await shoot(page, `home-play-${label}`);
  });

  test(`@visual home in docs at ${label}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await page.getByRole("button", { name: /^Disguise:/ }).click();
    await page.getByRole("button", { name: "Docs", exact: true }).click();
    await expect(page.getByTestId("cover-docs")).toBeVisible();
    await page.getByRole("heading", { level: 1 }).getByRole("button").click();
    await expect(page.getByTestId("chrome-docs")).toBeVisible();
    await page.mouse.move(2, viewport.height - 2);
    await shoot(page, `home-docs-${label}`);
  });
}

for (const modal of ["How to play", "Stats", "Make one"] as const) {
  test(`@visual the ${modal} modal in the Play skin`, async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await openArchive(page, "braid");
    await page.getByRole("button", { name: modal }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.mouse.move(2, DESKTOP.height - 2);
    await shoot(page, `modal-${modal.toLowerCase().replaceAll(" ", "-")}`);
  });
}
