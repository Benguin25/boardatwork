import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test, type Page } from "@playwright/test";
import {
  DESKTOP,
  MOBILE,
  PROTOTYPE_URL,
  diffPercent,
  pinClock,
  rectsFor,
  serveVendoredFonts,
} from "./helpers/parity";
import { enterWorkMode } from "./helpers/app";

const here = path.dirname(fileURLToPath(import.meta.url));
const referenceDir = path.resolve(here, "../../../../docs/design/reference");

/**
 * 2025-09-10T12:00Z lands on the prototype's SATURN / URANUS entry: two
 * six-letter words, twelve tiles. The 2025-09-01 daily (BADGER / FERRET)
 * has exactly that shape — and an archive date pins both the seed and the
 * weekday difficulty — so the two pages lay out identically and the diff
 * measures design, not content.
 */
const PINNED_CLOCK = Date.UTC(2025, 8, 10, 12);
const APP_PLAY_URL = "/braid/archive/2025-09-01";

/** The prototype's own markup for the parts that hold puzzle content. */
const PROTOTYPE_CONTENT = [
  "#p-label",
  "#p-date",
  '#play [data-role="theme"]',
  '#play [data-role="lens"]',
  '#play [data-role="rope"]',
  '#play [data-role="strands"]',
  '#play [data-role="msg"]',
];

const APP_CONTENT = [
  '[data-testid="play-subtitle"]',
  '[data-testid="play-date"]',
  '[data-testid="play-prompt"]',
  '[role="group"][aria-label="Braided letters"]',
  '[data-testid="play-strands"]',
  '[role="status"]',
];

async function openPrototype(page: Page): Promise<void> {
  await serveVendoredFonts(page);
  await pinClock(page, PINNED_CLOCK);
  await page.goto(PROTOTYPE_URL);
  await page.evaluate(() => {
    document.querySelectorAll(".modal.open").forEach((m) => {
      m.classList.remove("open");
    });
  });
  await expect(page.locator(".modal.open")).toHaveCount(0);
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
}

async function openApp(page: Page): Promise<void> {
  await page.goto(APP_PLAY_URL);
  await expect(page.getByTestId("chrome-play")).toBeVisible();
  // A first visit auto-opens How to play (as the prototype does); both are
  // dismissed before the comparison. Waiting for it first keeps the
  // comparison deterministic — dismissing "if visible" races the effect
  // that opens it.
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("group", { name: "Braided letters" })).toBeVisible();
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
}

/**
 * Work-mode content: the meta line, the puzzle itself, the body copy, and
 * the comment body/actions. The page frame, the section headings, the
 * chrome and the comment card frame stay in the comparison.
 */
const PROTOTYPE_WORK_CONTENT = [
  "#w-meta",
  ".w-rope",
  "#wgame p",
  "#wgame ul",
  ".cmt .body",
  ".cmt .acts",
];

const APP_WORK_CONTENT = [
  ".doc-page > div",
  ".doc-page p",
  ".doc-page ul",
  '[data-testid="docs-comment"] > div:nth-of-type(2)',
  '[data-testid="docs-comment"] > div:nth-of-type(3)',
];

for (const [name, viewport] of [
  ["desktop", DESKTOP],
  ["mobile", MOBILE],
] as const) {
  test(`Play skin matches the prototype at ${String(viewport.width)}x${String(viewport.height)}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);

    await openPrototype(page);
    const prototypeShot = await page.screenshot();
    const prototypeMasks = await rectsFor(page, PROTOTYPE_CONTENT);
    await mkdir(referenceDir, { recursive: true });
    await writeFile(path.join(referenceDir, `prototype-play-${name}.png`), prototypeShot);

    await openApp(page);
    const appShot = await page.screenshot();
    const appMasks = await rectsFor(page, APP_CONTENT);

    const percent = await diffPercent(page, prototypeShot, appShot, [
      ...prototypeMasks,
      ...appMasks,
    ]);
    console.log(`GATE B diff (play, ${name}): ${percent.toFixed(2)}%`);
    expect(percent).toBeLessThanOrEqual(2);
  });
}

test("Docs disguise matches the prototype at 1280x800", async ({ page }) => {
  await page.setViewportSize(DESKTOP);

  await serveVendoredFonts(page);
  await pinClock(page, PINNED_CLOCK);
  await page.goto(`${PROTOTYPE_URL}?mode=work`);
  await page.evaluate(() => {
    document.querySelectorAll(".modal.open").forEach((m) => {
      m.classList.remove("open");
    });
  });
  await expect(page.locator(".modal.open")).toHaveCount(0);
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  const prototypeShot = await page.screenshot();
  const prototypeMasks = await rectsFor(page, PROTOTYPE_WORK_CONTENT);
  await mkdir(referenceDir, { recursive: true });
  await writeFile(path.join(referenceDir, "prototype-docs-desktop.png"), prototypeShot);

  await openApp(page);
  await enterWorkMode(page, "docs");
  // The pointer is left over the document title after uncovering; its hover
  // outline is not part of the design.
  await page.mouse.move(4, 780);
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  const appShot = await page.screenshot();
  const appMasks = await rectsFor(page, APP_WORK_CONTENT);

  const percent = await diffPercent(page, prototypeShot, appShot, [
    ...prototypeMasks,
    ...appMasks,
  ]);
  console.log(`GATE C diff (docs, desktop): ${percent.toFixed(2)}%`);
  expect(percent).toBeLessThanOrEqual(2);
});
