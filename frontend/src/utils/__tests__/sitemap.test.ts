import { describe, expect, it } from "vitest";
import { pageSitemapEntries } from "../sitemap";

describe("pageSitemapEntries", () => {
  it("names each page's translations", () => {
    const entries = pageSitemapEntries([
      {
        locale: "et",
        pages: [
          { documentId: "home", slug: "/", updatedAt: "2026-11-01" },
          { documentId: "about", slug: "meist", updatedAt: null },
          { documentId: "et-only", slug: "uritused", updatedAt: null },
        ],
      },
      {
        locale: "en",
        pages: [
          { documentId: "home", slug: "/", updatedAt: null },
          { documentId: "about", slug: "about", updatedAt: null },
        ],
      },
    ]);
    const about = {
      et: "http://localhost:3003/meist",
      en: "http://localhost:3003/en/about",
    };
    expect(entries).toEqual([
      {
        url: "http://localhost:3003/",
        lastModified: "2026-11-01",
        alternates: {
          languages: {
            et: "http://localhost:3003/",
            en: "http://localhost:3003/en",
          },
        },
      },
      {
        url: about.et,
        lastModified: undefined,
        alternates: { languages: about },
      },
      { url: "http://localhost:3003/uritused", lastModified: undefined },
      {
        url: "http://localhost:3003/en",
        lastModified: undefined,
        alternates: {
          languages: {
            et: "http://localhost:3003/",
            en: "http://localhost:3003/en",
          },
        },
      },
      {
        url: about.en,
        lastModified: undefined,
        alternates: { languages: about },
      },
    ]);
  });
});
