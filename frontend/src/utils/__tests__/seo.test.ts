import { describe, expect, it } from "vitest";
import type { Locale } from "../locale";
import { buildPageMetadata } from "../seo";

const LOCALES: Locale[] = ["et", "en"];

describe("buildPageMetadata", () => {
  it("shares a page with its own image", () => {
    const metadata = buildPageMetadata(null, {
      locale: "et",
      title: "Üritused",
      path: "/uritused",
      image: {
        url: "/uploads/photo.jpg",
        width: 1600,
        height: 900,
        alternativeText: null,
      },
    });
    expect(metadata.openGraph).toMatchObject({
      images: [{ url: "/uploads/photo.jpg", width: 1600, height: 900 }],
    });
  });

  it("falls back to the site's share card in the page's language", () => {
    for (const locale of LOCALES) {
      const metadata = buildPageMetadata(null, {
        locale,
        title: null,
        path: locale === "et" ? "/" : "/en",
        isHome: true,
      });
      expect(metadata.openGraph).toMatchObject({
        images: [{ url: `/share/${locale}.jpg`, width: 1200, height: 630 }],
      });
    }
  });
});
