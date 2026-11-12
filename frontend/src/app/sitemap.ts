import type { MetadataRoute } from "next";
import { categoryPath, postPath } from "@/utils/blog";
import { LOCALES } from "@/utils/locale";
import { pageSitemapEntries } from "@/utils/sitemap";
import { getCategories, getPageSlugs, getPostSlugs } from "@/utils/strapi";
import { siteUrl } from "@/utils/url";

// Built per request from cached Strapi data, so the build never needs Strapi.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [pagesByLocale, posts, categories] = await Promise.all([
    Promise.all(
      LOCALES.map(async (locale) => ({
        locale,
        pages: await getPageSlugs(locale),
      })),
    ),
    getPostSlugs(),
    getCategories(),
  ]);

  return [
    ...pageSitemapEntries(pagesByLocale),
    ...posts.map((post) => ({
      url: siteUrl(postPath(post.slug)),
      lastModified: post.updatedAt ?? undefined,
    })),
    ...categories.map((category) => ({
      url: siteUrl(categoryPath(category.slug)),
    })),
  ];
}
