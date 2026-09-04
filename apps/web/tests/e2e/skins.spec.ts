import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const SKIN_IDS = [
  "play",
  "docs",
  "sheets",
  "slides",
  "slack",
  "jira",
  "outlook",
  "notion",
  "terminal",
] as const;

for (const skin of SKIN_IDS) {
  test(`${skin} skin renders the placeholder game and toggles its cover state`, async ({ page }) => {
    await page.goto(`/dev/skins/${skin}`);

    // Chrome renders a level-one heading whose accessible name is clickable
    // (SPEC §3.1: clicking the document title flips to the cover state).
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible();
    const titleButton = heading.getByRole("button");
    await expect(titleButton).toBeVisible();

    // Every primitive from the placeholder fixture renders as an
    // interactive control, and Feedback is a live-region status.
    await expect(page.getByRole("button", { name: "How to play" })).toBeVisible();
    await expect(page.getByRole("status")).toBeVisible();
    const buttonCountBeforeCover = await page.getByRole("button").count();
    expect(buttonCountBeforeCover).toBeGreaterThan(10);

    let violations = await new AxeBuilder({ page }).analyze();
    expect(violations.violations, JSON.stringify(violations.violations, null, 2)).toEqual([]);

    // Clicking the title flips to the cover state: the puzzle (and its
    // "How to play" action) is gone, replaced by plain fake content. The
    // cover may have its own <h1> (e.g. a blank document title), so the
    // signal is the puzzle content disappearing, not the heading itself.
    await titleButton.click();
    await expect(page.getByRole("button", { name: "How to play" })).toBeHidden();
    const exitButton = page.getByRole("button").first();
    await expect(exitButton).toBeVisible();

    violations = await new AxeBuilder({ page }).analyze();
    expect(violations.violations, JSON.stringify(violations.violations, null, 2)).toEqual([]);

    // The cover state offers a visible, labeled way back to the disguise.
    await exitButton.click();
    await expect(page.getByRole("button", { name: "How to play" })).toBeVisible();
  });
}
