import { expect, test, type Page } from "@playwright/test";

/** A first visit auto-opens How to play; close it before exercising Esc. */
async function dismissIntro(page: Page): Promise<void> {
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
}

/**
 * Stage A regression: pressing `Esc` in Play mode used to leave the page on
 * the Play skin's placeholder cover ("Loading…") forever, because the
 * persisted disguise defaulted to the non-disguise `play` skin. Work mode
 * must land on a real disguise — Docs by default — inside 2s.
 */
test("Esc on /braid shows the Docs chrome within 2s", async ({ page }) => {
  await page.goto("/braid");
  await expect(page.getByRole("heading", { name: /^Braid/ })).toBeVisible();
  await dismissIntro(page);

  await page.keyboard.press("Escape");

  // Work mode opens covered (SPEC §3.1), so the Docs chrome arrives as the
  // cover first; clicking the document title reveals the puzzle in it.
  await expect(page.getByTestId("cover-docs")).toBeVisible({ timeout: 2000 });
  await page.getByRole("heading", { level: 1 }).getByRole("button").click();
  await expect(page.getByTestId("chrome-docs")).toBeVisible({ timeout: 2000 });
  await expect(page.getByText("Loading…")).toBeHidden();
});

test("Esc round-trips Play -> Work (covered) -> Play", async ({ page }) => {
  await page.goto("/braid");
  await dismissIntro(page);

  await page.keyboard.press("Escape");
  // Work mode opens already covered (SPEC §3.1): fake content, no puzzle.
  await expect(page.getByTestId("cover-docs")).toBeVisible({ timeout: 2000 });
  await expect(page.getByRole("group", { name: "Braided letters" })).toBeHidden();

  await page.keyboard.press("Escape");
  await expect(page.getByTestId("chrome-play")).toBeVisible({ timeout: 2000 });
  await expect(page.getByRole("group", { name: "Braided letters" })).toBeVisible();
});

test("the disguise picker cycles through all eight disguises", async ({ page }) => {
  const disguises = [
    "docs",
    "sheets",
    "slides",
    "slack",
    "jira",
    "outlook",
    "notion",
    "terminal",
  ] as const;
  const names = {
    docs: "Docs",
    sheets: "Sheets",
    slides: "Slides",
    slack: "Slack",
    jira: "Jira",
    outlook: "Outlook",
    notion: "Notion",
    terminal: "Terminal",
  } as const;

  await page.goto("/braid");
  await dismissIntro(page);

  // The Play skin's footer control opens the picker and enters Work mode.
  await page.getByRole("button", { name: "Work mode" }).click();
  await expect(page.getByTestId("disguise-picker")).toBeVisible();
  await page.getByRole("button", { name: names.docs }).click();
  await expect(page.getByTestId("cover-docs")).toBeVisible({ timeout: 2000 });

  // Uncover once; changing disguise from here keeps the puzzle showing.
  await page.getByRole("heading", { level: 1 }).getByRole("button").click();
  await expect(page.getByTestId("chrome-docs")).toBeVisible({ timeout: 2000 });

  for (const id of disguises) {
    await page.getByTestId("skin-settings").first().click();
    await page.getByRole("menuitem", { name: "Change disguise" }).click();
    await expect(page.getByTestId("disguise-picker")).toBeVisible();
    await page.getByRole("button", { name: names[id] }).click();
    await expect(page.getByTestId(`chrome-${id}`)).toBeVisible({ timeout: 2000 });
  }
});
