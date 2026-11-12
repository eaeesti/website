import type { MetadataRoute } from "next";
import type { StrapiPage } from "@/types/generated/strapi";
import { pagePath, type Locale } from "./locale";
import { siteUrl } from "./url";

export type SitemapPage = Pick<StrapiPage, "documentId" | "slug" | "updatedAt">;

/**
 * The sitemap's entries for CMS pages. A page's translations share its
 * documentId in Strapi, so each entry names the page in every language it
 * has (hreflang), as the pages' own <link rel="alternate"> do.
 */
export function pageSitemapEntries(
  pagesByLocale: { locale: Locale; pages: SitemapPage[] }[],
): MetadataRoute.Sitemap {
  const languagesByDocument = new Map<
    string,
    Partial<Record<Locale, string>>
  >();
  for (const { locale, pages } of pagesByLocale) {
    for (const page of pages) {
      const languages = languagesByDocument.get(page.documentId) ?? {};
      languages[locale] = siteUrl(pagePath(page.slug, locale));
      languagesByDocument.set(page.documentId, languages);
    }
  }

  return pagesByLocale.flatMap(({ locale, pages }) =>
    pages.map((page) => {
      const languages = languagesByDocument.get(page.documentId) ?? {};
      return {
        url: siteUrl(pagePath(page.slug, locale)),
        lastModified: page.updatedAt ?? undefined,
        ...(Object.keys(languages).length > 1
          ? { alternates: { languages } }
          : {}),
      };
    }),
  );
}
