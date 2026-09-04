import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Locator, Page } from "@playwright/test";

const here = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(here, "../../..");
const repoRoot = path.resolve(webRoot, "../..");

export const PROTOTYPE_PATH = path.join(repoRoot, "reference-braid-prototype.html");
export const PROTOTYPE_URL = `file://${PROTOTYPE_PATH}`;

export const DESKTOP = { width: 1280, height: 800 } as const;
export const MOBILE = { width: 390, height: 844 } as const;

function fontDataUri(file: string): string {
  const bytes = readFileSync(path.join(webRoot, "public/fonts", file));
  return `data:font/woff2;base64,${bytes.toString("base64")}`;
}

/**
 * The prototype pulls Libre Franklin from Google Fonts; the app self-hosts
 * the same faces. Serve the app's copies to the prototype too, so a pixel
 * diff measures layout and colour rather than which CDN answered.
 */
export async function serveVendoredFonts(page: Page): Promise<void> {
  const css = `
@font-face{font-family:"Libre Franklin";font-style:normal;font-weight:100 900;font-display:block;src:url(${fontDataUri("libre-franklin-latin.woff2")}) format("woff2");}
@font-face{font-family:"Libre Franklin";font-style:italic;font-weight:100 900;font-display:block;src:url(${fontDataUri("libre-franklin-latin-italic.woff2")}) format("woff2");}
`;
  await page.route("https://fonts.googleapis.com/**", (route) =>
    route.fulfill({ status: 200, contentType: "text/css", body: css }),
  );
  await page.route("https://fonts.gstatic.com/**", (route) => route.abort());
}

/**
 * Pins the prototype's clock so `loadDaily()` always picks the same entry
 * from its `PUZZLES` table — the app's comparison puzzle is chosen to match
 * its shape (two six-letter words, twelve tiles).
 */
/**
 * Pins `Date.now()` so the prototype's `loadDaily()` always picks the same
 * entry from its `PUZZLES` table — the app's comparison puzzle is chosen to
 * match its shape (two six-letter words, twelve tiles). The visible date
 * line is masked out of the diff either way.
 */
export async function pinClock(page: Page, epochMs: number): Promise<void> {
  await page.addInitScript((fixed: number) => {
    Date.now = () => fixed;
  }, epochMs);
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Bounding boxes for every element each selector matches, in viewport coordinates. */
export async function rectsFor(page: Page, selectors: readonly string[]): Promise<Rect[]> {
  const rects: Rect[] = [];
  for (const selector of selectors) {
    const matches: Locator[] = await page.locator(selector).all();
    for (const match of matches) {
      const box = await match.boundingBox();
      if (box) {
        rects.push(box);
      }
    }
  }
  return rects;
}

/**
 * Percentage of pixels that differ between two same-size PNGs, after
 * blanking `masks` on both. Runs in the browser (canvas) so the comparison
 * needs no image-decoding dependency.
 */
export async function diffPercent(
  page: Page,
  a: Buffer,
  b: Buffer,
  masks: readonly Rect[],
): Promise<number> {
  await page.setContent("<body></body>");
  return page.evaluate(
    async ([aData, bData, maskList]: [string, string, Rect[]]) => {
      async function toCanvas(dataUrl: string): Promise<CanvasRenderingContext2D> {
        const image = new Image();
        await new Promise<void>((resolve, reject) => {
          image.onload = () => {
            resolve();
          };
          image.onerror = () => {
            reject(new Error("decode failed"));
          };
          image.src = dataUrl;
        });
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext("2d");
        if (!context) {
          throw new Error("no 2d context");
        }
        context.drawImage(image, 0, 0);
        context.fillStyle = "#000";
        for (const mask of maskList) {
          context.fillRect(
            Math.floor(mask.x) - 2,
            Math.floor(mask.y) - 2,
            Math.ceil(mask.width) + 4,
            Math.ceil(mask.height) + 4,
          );
        }
        return context;
      }

      const left = await toCanvas(aData);
      const right = await toCanvas(bData);
      const width = Math.min(left.canvas.width, right.canvas.width);
      const height = Math.min(left.canvas.height, right.canvas.height);
      const leftData = left.getImageData(0, 0, width, height).data;
      const rightData = right.getImageData(0, 0, width, height).data;

      let differing = 0;
      for (let i = 0; i < leftData.length; i += 4) {
        // A per-channel tolerance absorbs subpixel antialiasing; anything
        // a reviewer would notice is far above it.
        if (
          Math.abs(leftData[i]! - rightData[i]!) > 24 ||
          Math.abs(leftData[i + 1]! - rightData[i + 1]!) > 24 ||
          Math.abs(leftData[i + 2]! - rightData[i + 2]!) > 24
        ) {
          differing += 1;
        }
      }
      return (100 * differing) / (width * height);
    },
    [
      `data:image/png;base64,${a.toString("base64")}`,
      `data:image/png;base64,${b.toString("base64")}`,
      masks as Rect[],
    ] as [string, string, Rect[]],
  );
}
