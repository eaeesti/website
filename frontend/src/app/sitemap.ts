import type { MetadataRoute } from "next";
import { categoryPath, postPath } from "@/utils/blog";
import { LOCALES, pagePath } from "@/utils/locale";
import { getCategories, getPageSlugs, getPostSlugs } from "@/utils/strapi";
import { siteUrl } from "@/utils/url";

// Built per request from cached Strapi data, so the build never needs Strapi.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [pagesByLocale, posts, categories] = await Promise.all([
    Promise.all(
      LOCALES.map(async (locale) => ({
        locale,
        slugs: await getPageSlugs(locale),
      })),
    ),
    getPostSlugs(),
    getCategories(),
  ]);

  const pages = pagesByLocale.flatMap(({ locale, slugs }) =>
    slugs.map((page) => ({
      url: siteUrl(pagePath(page.slug, locale)),
      lastModified: page.updatedAt ?? undefined,
    })),
  );

  return [
    ...pages,
    ...posts.map((post) => ({
      url: siteUrl(postPath(post.slug)),
      lastModified: post.updatedAt ?? undefined,
    })),
    ...categories.map((category) => ({
      url: siteUrl(categoryPath(category.slug)),
    })),
  ];
}
