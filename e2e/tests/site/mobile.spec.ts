import { expect, test } from "@playwright/test";
import { clickToOpen } from "../../helpers/page.ts";
import { TEXT } from "../../stack/content.ts";

test("on a phone, the menu opens and leads to its pages", async ({ page }) => {
  await page.goto("/");
  // The dialog's own element has no size: what shows is the panel in it.
  const contact = page.getByRole("dialog").getByRole("link", {
    name: "Kontakt",
  });
  await clickToOpen(page.getByRole("button", { name: "Ava menüü" }), contact);
  await contact.click();
  await expect(
    page.getByRole("heading", { name: TEXT.contactTitle, exact: true }),
  ).toBeVisible();
  await expect(contact).toBeHidden();
});
