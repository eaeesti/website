import { expect, test } from "@playwright/test";
import { StrapiAdmin } from "../../helpers/strapi-admin.ts";
import { ADMINS } from "../../stack/config.ts";
import { TEXT } from "../../stack/content.ts";

test("a change published in Strapi shows on the site at once", async ({
  page,
}) => {
  // Visited first, so the site has the page in its cache: without Strapi's
  // call to /api/revalidate, it would keep showing it for an hour.
  await page.goto("/muudetav");
  await expect(
    page.getByRole("heading", { name: TEXT.editableTitle }),
  ).toBeVisible();

  const newTitle = "Uus pealkiri";
  const admin = await StrapiAdmin.signIn(
    ADMINS.publisher.email,
    ADMINS.publisher.password,
  );
  await admin.editAndPublishPage("muudetav", (draft) => ({
    ...draft,
    sections: (Array.isArray(draft.sections) ? draft.sections : []).map(
      (section) => ({ ...section, title: newTitle }),
    ),
  }));

  await expect(async () => {
    await page.reload();
    await expect(page.getByRole("heading", { name: newTitle })).toBeVisible({
      timeout: 1000,
    });
  }).toPass({ timeout: 15_000 });
});
