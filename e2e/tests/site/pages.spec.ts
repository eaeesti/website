import { expect, test } from "@playwright/test";
import { clickToOpen, watchErrors } from "../../helpers/page.ts";
import { TEXT } from "../../stack/content.ts";

test.describe("every page", () => {
  const pages: [string, string][] = [
    ["/", TEXT.heroTitle],
    ["/meist", TEXT.aboutTitle],
    ["/kontakt", TEXT.contactTitle],
    ["/anneta", TEXT.donateTitle],
    ["/annetatud", TEXT.thanksTitle],
    ["/uritused", TEXT.eventsTitle],
    ["/taskuhaaling", TEXT.podcastTitle],
    ["/blogi", TEXT.blogTitle],
    ["/blogi/lk/2", TEXT.blogTitle],
    ["/blogi/karjaar-mis-loeb", TEXT.postTitles[1]],
    ["/rubriik/karjaar", TEXT.categoryName],
    ["/en", TEXT.enHeroTitle],
    ["/en/about", TEXT.enAboutTitle],
  ];

  for (const [path, heading] of pages) {
    test(`${path} shows its content, without errors`, async ({ page }) => {
      const errors = watchErrors(page);
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(
        page.getByRole("heading", { name: heading }).first(),
      ).toBeVisible();
      await expect(page.getByRole("contentinfo")).toBeVisible();
      await page.waitForLoadState("networkidle");
      expect(errors).toEqual([]);
    });
  }
});

test("the home page shows each of its sections", async ({ page }) => {
  await page.goto("/");
  const main = page.getByRole("main");
  await expect(main.getByText(TEXT.heroSubtitle)).toBeVisible();
  await expect(main.getByRole("link", { name: TEXT.heroButton })).toBeVisible();
  await expect(main.getByText(TEXT.cardTitle)).toBeVisible();
  await expect(main.getByText(TEXT.testimonialText)).toBeVisible();
  await expect(main.getByText(TEXT.partnerText)).toBeVisible();
  await expect(main.getByRole("link", { name: TEXT.ctaButton })).toBeVisible();
  // The two newest posts, and a link to the rest.
  await expect(
    main.getByRole("heading", { name: TEXT.latestPostsTitle }),
  ).toBeVisible();
  await expect(main.getByText(TEXT.postTitles[2])).toBeVisible();
  await expect(main.getByText(TEXT.postTitles[1])).toBeVisible();
  await expect(main.getByText(TEXT.postTitles[0])).toHaveCount(0);
  await expect(
    main.getByRole("link", { name: TEXT.allPostsButton }),
  ).toBeVisible();
});

test("uploaded images load through the site", async ({ page }) => {
  await page.goto("/meist");
  const image = page.getByRole("img", { name: "Sinine ring" }).first();
  await expect(image).toBeVisible();
  await expect
    .poll(() =>
      image.evaluate((img) =>
        img instanceof HTMLImageElement ? img.naturalWidth : 0,
      ),
    )
    .toBeGreaterThan(0);
});

test("the about page shows its team and answers", async ({ page }) => {
  await page.goto("/meist");
  await expect(page.getByText(TEXT.memberName)).toBeVisible();
  await expect(page.getByText(TEXT.memberRole)).toBeVisible();
  await expect(page.getByText(TEXT.answer)).toBeHidden();
  await page.getByText(TEXT.question).click();
  await expect(page.getByText(TEXT.answer)).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Breadcrumbs" }),
  ).toContainText("Avaleht");
});

test("the events page shows the calendar's events", async ({ page }) => {
  await page.goto("/uritused");
  await expect(page.getByText(TEXT.upcomingEvent)).toBeVisible();
  await expect(page.getByText(TEXT.pastEvent)).toBeVisible();
  await expect(page.getByText(TEXT.noEvents)).toHaveCount(0);
});

test("the podcast page lists episodes and loads embeds only when asked", async ({
  page,
}) => {
  // Nothing leaves the machine, even when the embed loads.
  await page.route(/youtube/, (route) => route.abort());
  await page.goto("/taskuhaaling");
  await expect(page.getByText(TEXT.episodeTitle)).toBeVisible();
  await expect(
    page.getByRole("heading", { name: TEXT.newsletterTitle }),
  ).toBeVisible();

  const video = page.locator('iframe[src*="youtube-nocookie.com/embed/"]');
  await expect(video).toHaveCount(0);
  await page.getByRole("button", { name: "Vaata videot" }).click();
  await expect(video).toHaveCount(1);
});

test("the blog lists posts a page at a time, and by category", async ({
  page,
}) => {
  await page.goto("/blogi");
  const main = page.getByRole("main");
  await expect(main.getByText(TEXT.postTitles[2])).toBeVisible();
  await expect(main.getByText(TEXT.postTitles[0])).toHaveCount(0);
  await page
    .getByRole("navigation", { name: "Pagination" })
    .getByRole("link", { name: "2" })
    .click();
  await page.waitForURL("**/blogi/lk/2");
  await expect(main.getByText(TEXT.postTitles[0])).toBeVisible();

  await page.goto("/rubriik/karjaar");
  await expect(main.getByText(TEXT.postTitles[1])).toBeVisible();
  await expect(main.getByText(TEXT.postTitles[2])).toHaveCount(0);
});

test("a blog post shows its body and author", async ({ page }) => {
  await page.goto("/blogi/kuidas-valida");
  await expect(
    page.getByRole("heading", { name: TEXT.postHeading }),
  ).toBeVisible();
  await expect(
    page.getByRole("listitem").filter({ hasText: "Kuidas?" }),
  ).toBeVisible();
  await expect(page.getByText(TEXT.authorName).first()).toBeVisible();
});

test("the page title and description come from the page's metadata", async ({
  page,
}) => {
  await page.goto("/meist");
  await expect(page).toHaveTitle(/About/);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    "Kes me oleme.",
  );
  await expect(page.locator("html")).toHaveAttribute("lang", "et");
});

test("an address that isn't a page answers 404 with the not-found page", async ({
  page,
}) => {
  const response = await page.goto("/pole-sellist-lehte");
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { name: TEXT.notFoundTitle }),
  ).toBeVisible();
  await page.getByRole("link", { name: TEXT.notFoundButton }).click();
  await expect(
    page.getByRole("heading", { name: TEXT.heroTitle }),
  ).toBeVisible();
});

test("old addresses lead to their pages", async ({ page }) => {
  await page.goto("/about");
  await page.waitForURL("**/meist");
  await page.goto("/et/kontakt");
  await page.waitForURL("**/kontakt");
  await expect(
    page.getByRole("heading", { name: TEXT.contactTitle }),
  ).toBeVisible();
});

test("the navigation bar, its menus and the language switch lead to their pages", async ({
  page,
}) => {
  await page.goto("/");
  const nav = page.getByRole("navigation").first();
  await clickToOpen(
    nav.getByRole("button", { name: "Tegevused" }),
    page.getByRole("link", { name: "Üritused" }),
  );
  await page.getByRole("link", { name: "Üritused" }).click();
  await expect(
    page.getByRole("heading", { name: TEXT.eventsTitle }),
  ).toBeVisible();

  await nav.getByRole("link", { name: "Meist" }).click();
  await expect(
    page.getByRole("heading", { name: TEXT.aboutTitle }),
  ).toBeVisible();
  await page.getByRole("link", { name: "In English" }).first().click();
  await page.waitForURL("**/en/about");
  await expect(
    page.getByRole("heading", { name: TEXT.enAboutTitle }),
  ).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("the footer links to the organisation's GitHub", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("contentinfo").getByRole("link", { name: "GitHub" }),
  ).toHaveAttribute("href", "https://github.com/e2e");
});
