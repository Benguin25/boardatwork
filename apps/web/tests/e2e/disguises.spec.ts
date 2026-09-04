import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import {
  DISGUISES,
  GAMES,
  changeDisguise,
  enterWorkMode,
  hasHorizontalOverflow,
  openGame,
  type Disguise,
} from "./helpers/app";

/**
 * Gate C: the chrome checklist from `docs/design/disguises.md`, as DOM
 * assertions. These are the things a passer-by has to see for the
 * disguise to hold, so they are asserted for every game in every disguise.
 */
const CHECKLIST: Record<Disguise, readonly string[]> = {
  docs: ["docs-icon", "docs-menus", "docs-share", "docs-toolbar", "docs-comment"],
  sheets: [
    "sheets-icon",
    "sheets-menus",
    "sheets-toolbar",
    "sheets-formula-bar",
    "sheets-columns",
    "sheets-rows",
    "sheets-tabs",
  ],
  slides: ["slides-icon", "slides-menus", "slides-filmstrip", "slides-notes", "slides-counter"],
  slack: ["slack-icon", "slack-sidebar", "slack-topic", "slack-message", "slack-thread", "slack-composer"],
  jira: ["jira-icon", "jira-sidebar", "jira-create", "jira-columns", "jira-detail"],
  outlook: ["outlook-icon", "outlook-ribbon", "outlook-folders", "outlook-list", "outlook-reading"],
  notion: ["notion-icon", "notion-sidebar", "notion-title", "notion-callout", "notion-meta"],
  terminal: ["terminal-icon", "terminal-tabs", "terminal-prompt", "terminal-status"],
};

for (const game of GAMES) {
  test(`${game} renders in all eight disguises`, async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") {
        consoleErrors.push(message.text());
      }
    });
    page.on("pageerror", (error) => {
      consoleErrors.push(`pageerror: ${error.message}`);
    });

    await openGame(page, game);
    await enterWorkMode(page, "docs");

    for (const disguise of DISGUISES) {
      if (disguise !== "docs") {
        await changeDisguise(page, disguise);
      }

      for (const marker of CHECKLIST[disguise]) {
        await expect(
          page.getByTestId(marker),
          `${game} in ${disguise}: missing ${marker}`,
        ).toBeVisible();
      }

      expect(
        await hasHorizontalOverflow(page),
        `${game} in ${disguise} scrolls horizontally`,
      ).toBe(false);

      const { violations } = await new AxeBuilder({ page }).analyze();
      expect(violations, `${game} in ${disguise}: ${JSON.stringify(violations, null, 2)}`).toEqual(
        [],
      );
    }

    expect(consoleErrors, consoleErrors.join("\n")).toEqual([]);
  });
}
