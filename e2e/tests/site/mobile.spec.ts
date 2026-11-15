import { expect, test } from "@playwright/test";
import { clickToOpen } from "../../helpers/page.ts";
import { TEXT } from "../../stack/content.ts";

test("on a phone, the menu opens and leads to its pages", async ({ page }) => {
  await page.goto("/");
  const menu = page.getByRole("dialog");
  await clickToOpen(page.getByRole("button", { name: "Ava menüü" }), menu);
  await menu.getByRole("link", { name: "Kontakt" }).click();
  await expect(
    page.getByRole("heading", { name: TEXT.contactTitle }),
  ).toBeVisible();
  await expect(menu).toBeHidden();
});
