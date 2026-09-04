import { expect, type Page } from "@playwright/test";

export const DISGUISES = [
  "docs",
  "sheets",
  "slides",
  "slack",
  "jira",
  "outlook",
  "notion",
  "terminal",
] as const;

export type Disguise = (typeof DISGUISES)[number];

export const DISGUISE_NAME: Record<Disguise, string> = {
  docs: "Docs",
  sheets: "Sheets",
  slides: "Slides",
  slack: "Slack",
  jira: "Jira",
  outlook: "Outlook",
  notion: "Notion",
  terminal: "Terminal",
};

export const GAMES = ["braid", "audit", "proof", "forecast", "org", "policy"] as const;

/** Opens a game's daily and dismisses the first-visit How to play modal. */
export async function openGame(page: Page, game: string): Promise<void> {
  await page.goto(`/${game}`);
  await expect(page.getByTestId("chrome-play")).toBeVisible();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
}

/** Reveals the puzzle when Work mode has just opened in its cover state. */
async function uncover(page: Page): Promise<void> {
  await page.getByRole("heading", { level: 1 }).getByRole("button").first().click();
}

/** From Play mode: the footer's "Work mode" control opens the disguise picker. */
export async function enterWorkMode(page: Page, disguise: Disguise): Promise<void> {
  await page.getByRole("button", { name: "Work mode" }).click();
  await expect(page.getByTestId("disguise-picker")).toBeVisible();
  await page.getByRole("button", { name: DISGUISE_NAME[disguise], exact: true }).click();
  await expect(page.getByTestId(`cover-${disguise}`)).toBeVisible();
  await uncover(page);
  await expect(page.getByTestId(`chrome-${disguise}`)).toBeVisible();
}

/** From Work mode, uncovered: swap disguise through that app's settings menu. */
export async function changeDisguise(page: Page, disguise: Disguise): Promise<void> {
  await page.getByTestId("skin-settings").first().click();
  await page.getByRole("menuitem", { name: "Change disguise" }).click();
  await expect(page.getByTestId("disguise-picker")).toBeVisible();
  await page.getByRole("button", { name: DISGUISE_NAME[disguise], exact: true }).click();
  await expect(page.getByTestId(`chrome-${disguise}`)).toBeVisible();
}

/** True when the document scrolls sideways — never acceptable (SPEC §4.8). */
export async function hasHorizontalOverflow(page: Page): Promise<boolean> {
  return page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
}
