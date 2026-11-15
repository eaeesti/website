import { expect, test } from "@playwright/test";
import { ADMINS } from "../../stack/config.ts";

test("Strapi's admin signs in and lists the pages to edit", async ({
  page,
}) => {
  test.setTimeout(90 * 1000);
  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "EA Estonia's website" }),
  ).toBeVisible({ timeout: 30 * 1000 });

  await page.getByLabel("Email").fill(ADMINS.ui.email);
  await page
    .getByRole("textbox", { name: "Password" })
    .fill(ADMINS.ui.password);
  await page.getByRole("button", { name: "Login" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/admin/auth"));

  await page.goto("/admin/content-manager/collection-types/api::page.page");
  await expect(
    page.getByRole("gridcell", { name: "About", exact: true }).first(),
  ).toBeVisible({ timeout: 30 * 1000 });
});
