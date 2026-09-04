import { expect, type Page } from "@playwright/test";
import { localDateKey, weekdayDifficulty } from "@boardatwork/game-core";
import { RULES } from "@boardatwork/rules";
import { auditGame } from "../../../games/audit";
import { braidGame } from "../../../games/braid";
import { forecastGame } from "../../../games/forecast";
import { orgGame } from "../../../games/org";
import { policyGame } from "../../../games/policy";
import { proofGame } from "../../../games/proof";

/**
 * Solvers that drive each game's daily to a win through the UI only. They
 * read the puzzle from the same deterministic generator the app uses
 * (`dailySeed(today)` + the weekday difficulty), so they stay correct
 * whatever day the suite runs.
 */
const dateKey = localDateKey();
const difficulty = weekdayDifficulty(dateKey);

const MIN_PROBES = 5;

/** A grid cell in any skin: every `Grid` renders one `<button>` per cell, row-major. */
function gridButtons(page: Page) {
  return page.locator("table button");
}

async function setSlider(page: Page, value: number): Promise<void> {
  await page.getByRole("slider").evaluate((el, target) => {
    const input = el as HTMLInputElement;
    const nativeSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    )?.set;
    nativeSetter?.call(input, String(target));
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, value);
}

/** Which occurrence of this exact word text `targetIndex` is, in reading order. */
function occurrenceOf(words: readonly string[], targetIndex: number): number {
  const text = words[targetIndex];
  let count = 0;
  for (let i = 0; i < targetIndex; i += 1) {
    if (words[i] === text) {
      count += 1;
    }
  }
  return count;
}

async function solveBraid(page: Page): Promise<void> {
  const puzzle = braidGame.generate(braidGame.dailySeed(dateKey), difficulty);
  const letters = page.getByRole("button", { name: /, (unassigned|strand \d)$/ });
  for (let i = 0; i < puzzle.letters.length; i += 1) {
    const target = puzzle.letters[i]!.src;
    for (let click = 0; click <= target; click += 1) {
      await letters.nth(i).click();
    }
  }
  await page.getByRole("button", { name: "Check" }).click();
}

async function solveAudit(page: Page): Promise<void> {
  const puzzle = auditGame.generate(auditGame.dailySeed(dateKey), difficulty);
  const buttons = gridButtons(page);
  for (const index of puzzle.alteredCells) {
    await buttons.nth(index).click();
  }
  await page.getByRole("button", { name: "Check" }).click();
}

async function solveProof(page: Page): Promise<void> {
  const puzzle = proofGame.generate(proofGame.dailySeed(dateKey), difficulty);
  for (const index of puzzle.impostorIndices) {
    const text = puzzle.words[index]!;
    await page
      .getByRole("button", { name: text, exact: true })
      .nth(occurrenceOf(puzzle.words, index))
      .click();
  }
  await page.getByRole("button", { name: "Check" }).click();
}

async function solveForecast(page: Page): Promise<void> {
  const puzzle = forecastGame.generate(forecastGame.dailySeed(dateKey), difficulty);
  for (let i = 0; i < puzzle.questions.length; i += 1) {
    await setSlider(page, puzzle.questions[i]!.answer);
    await page.getByRole("button", { name: "Submit" }).click();
    if (i < puzzle.questions.length - 1) {
      // Each answer is scored on screen before the next question appears.
      await page.getByRole("button", { name: /^Next question/ }).click();
    }
  }
}

async function solveOrg(page: Page): Promise<void> {
  const puzzle = orgGame.generate(orgGame.dailySeed(dateKey), difficulty);
  for (let p = 0; p < puzzle.people.length; p += 1) {
    const person = puzzle.people[p]!;
    const roleLabel = `${puzzle.roles[puzzle.solution.role[p]!]!} lead`;
    const teamLabel = puzzle.teams[puzzle.solution.team[p]!]!;
    await page.getByRole("button", { name: `${person}, ${roleLabel}: empty` }).click();
    await page.getByRole("button", { name: `${person}, ${teamLabel}: empty` }).click();
  }
  await page.getByRole("button", { name: "Check" }).click();
}

async function solvePolicy(page: Page): Promise<void> {
  const puzzle = policyGame.generate(policyGame.dailySeed(dateKey), difficulty);
  const rule = RULES.find((r) => r.id === puzzle.trueRuleId);
  if (!rule) {
    throw new Error(`Unknown rule id "${puzzle.trueRuleId}"`);
  }
  for (let i = 0; i < MIN_PROBES; i += 1) {
    const chip = page.getByRole("button", {
      name: `Probe the word ${puzzle.probeCandidates[i]!}`,
    });
    // Probing removes the chip and reflows the rest, so a coordinate click
    // can land on whichever chip slid into that spot; dispatch instead.
    await expect(chip).toBeVisible();
    await chip.dispatchEvent("click");
    await expect(chip).toBeHidden();
  }
  await page.getByRole("button", { name: "Guess the rule" }).click();
  await page.getByRole("dialog").getByRole("button", { name: rule.description }).click();
}

export const SOLVERS: Record<string, (page: Page) => Promise<void>> = {
  braid: solveBraid,
  audit: solveAudit,
  proof: solveProof,
  forecast: solveForecast,
  org: solveOrg,
  policy: solvePolicy,
};

export const HOME_DISGUISE = {
  braid: braidGame.homeSkin,
  audit: auditGame.homeSkin,
  proof: proofGame.homeSkin,
  forecast: forecastGame.homeSkin,
  org: orgGame.homeSkin,
  policy: policyGame.homeSkin,
} as const;
