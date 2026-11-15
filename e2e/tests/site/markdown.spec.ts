import { expect, test } from "@playwright/test";
import { TEXT } from "../../stack/content.ts";

test("each page has a Markdown version at its address with .md", async ({
  request,
}) => {
  const response = await request.get("/meist.md");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("text/markdown");
  const markdown = await response.text();
  expect(markdown).toMatch(new RegExp(`^# ${TEXT.aboutTitle}`, "m"));
  expect(markdown).toContain(TEXT.memberName);
  expect(markdown).toContain(TEXT.question);
  // Addresses are written so that harvesters don't read them.
  expect(markdown).not.toContain(TEXT.memberEmail);

  expect(await (await request.get("/index.md")).text()).toContain(
    TEXT.heroTitle,
  );
  expect(await (await request.get("/en/about.md")).text()).toContain(
    TEXT.enAboutTitle,
  );
  const post = await (await request.get("/blogi/kuidas-valida.md")).text();
  expect(post).toContain(`## ${TEXT.postHeading}`);
  expect(post).toMatch(/^[-*] Kuidas\?$/m);
});

test("a page's own address answers in Markdown to those who ask for it", async ({
  request,
}) => {
  const markdown = await request.get("/meist", {
    headers: { Accept: "text/markdown" },
  });
  expect(markdown.headers()["content-type"]).toContain("text/markdown");
  expect(markdown.headers().vary).toContain("Accept");
  expect(await markdown.text()).toMatch(/^# /m);

  const html = await request.get("/meist");
  expect(html.headers()["content-type"]).toContain("text/html");
});

test("pages point to their Markdown version", async ({ page }) => {
  await page.goto("/meist");
  await expect(
    page.locator('link[rel="alternate"][type="text/markdown"]'),
  ).toHaveAttribute("href", /\/meist\.md$/);
});

test("llms.txt lists the pages and the posts", async ({ request }) => {
  const response = await request.get("/llms.txt");
  expect(response.status()).toBe(200);
  const text = await response.text();
  expect(text).toContain(TEXT.siteName);
  expect(text).toContain("/meist.md");
  expect(text).toContain("/blogi/kuidas-valida.md");
  expect(text).toContain("text/markdown");
});
