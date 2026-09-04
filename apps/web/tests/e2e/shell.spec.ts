import { expect, test } from "@playwright/test";

test("Esc toggles Play <-> Work mode, opening Work already covered", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: /Play mode/ })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.getByTestId("cover-docs")).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: /Play mode/ })).toBeVisible();
});

test("the disguise picker changes the disguise and persists across reload", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /^Disguise:/ }).click();
  await expect(page.getByTestId("disguise-picker")).toBeVisible();
  await page.getByRole("button", { name: "Slack", exact: true }).click();

  // Picking a disguise also enters Work mode, which opens covered.
  await expect(page.getByTestId("cover-slack")).toBeVisible();

  await page.reload();
  await expect(page.getByTestId("cover-slack")).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Disguise: Slack" })).toBeVisible();
});
