import { expect, test } from "@playwright/test";

test("Esc toggles Play <-> Work mode, opening Work already covered", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: /Play mode/ })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: /Work mode/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Disguise:/ })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: /Play mode/ })).toBeVisible();
});

test("disguise picker changes the active skin and persists across reload", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Escape"); // -> Work mode
  await page.getByRole("button", { name: /Disguise:/ }).click();
  await page.getByRole("button", { name: "Docs" }).click();
  await expect(page.getByRole("button", { name: "Disguise: Docs" })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("button", { name: "Disguise: Docs" })).toBeVisible();
});
