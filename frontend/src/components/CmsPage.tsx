import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import type { StrapiPage } from "@/types/generated/strapi";
import { listingPagePath } from "@/utils/blog";
import type { Locale } from "@/utils/locale";
import { isLocale, pagePath, slugFromSegments } from "@/utils/locale";
import { parseListingSegments } from "@/utils/route";
import { buildPageMetadata, leadImage, organizationJsonLd } from "@/utils/seo";
import { getGlobal, getPage, getPosts } from "@/utils/strapi";
import SiteShell from "./layout/SiteShell";
import Sections from "./sections/Sections";

interface CmsPageProps {
  locale: Locale;
  segments: string[] | undefined;
}

/** The page in every language it exists in, keyed by locale. */
function languagePaths(
  page: StrapiPage,
  locale: Locale,
): Partial<Record<Locale, string>> {
  const paths: Partial<Record<Locale, string>> = {
    [locale]: pagePath(page.slug, locale),
  };
  for (const localization of page.localizations ?? []) {
    if (isLocale(localization.locale) && localization.slug) {
      paths[localization.locale] = pagePath(
        localization.slug,
        localization.locale,
      );
    }
  }
  return paths;
}

/**
 * Whether listing page `pageNumber` exists: the page must have a paginated
 * blog posts section, and enough posts to fill that many pages.
 */
async function listingPageExists(
  page: StrapiPage,
  pageNumber: number,
): Promise<boolean> {
  if (pageNumber === 1) return true;
  const listing = page.sections.find(
    (section) =>
      section.__component === "sections.blog-posts-section" &&
      section.showPagination,
  );
  if (!listing || listing.__component !== "sections.blog-posts-section")
    return false;
  const { pagination } = await getPosts({
    page: pageNumber,
    pageSize: listing.postsPerPage ?? 12,
  });
  return pageNumber <= pagination.pageCount;
}

/** A page built in Strapi from sections, at /slug or /en/slug. */
export default async function CmsPage({ locale, segments }: CmsPageProps) {
  const route = parseListingSegments(segments);
  if (!route) notFound();

  const slug = slugFromSegments(route.segments);
  const path = pagePath(slug, locale);
  if (route.explicitFirstPage) permanentRedirect(path);

  const [global, page] = await Promise.all([
    getGlobal(locale),
    getPage(slug, locale),
  ]);
  if (!page || !(await listingPageExists(page, route.pageNumber))) notFound();

  const otherLanguages = Object.entries(languagePaths(page, locale)).filter(
    ([pathLocale]) => pathLocale !== locale,
  );

  return (
    <SiteShell
      global={global}
      locale={locale}
      path={listingPagePath(path, route.pageNumber)}
      alternatePath={otherLanguages[0]?.[1] ?? null}
    >
      {slug === "/" && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: organizationJsonLd(global) }}
        />
      )}
      <Sections
        sections={page.sections}
        context={{ locale, global, path, pageNumber: route.pageNumber }}
      />
    </SiteShell>
  );
}

export async function cmsPageMetadata({
  locale,
  segments,
}: CmsPageProps): Promise<Metadata> {
  const route = parseListingSegments(segments);
  if (!route) return {};

  const slug = slugFromSegments(route.segments);
  const [global, page] = await Promise.all([
    getGlobal(locale),
    getPage(slug, locale),
  ]);
  if (!page) return {};

  return buildPageMetadata(global, {
    locale,
    title: page.metadata?.title ?? page.name,
    description: page.metadata?.description,
    image: page.metadata?.shareImage ?? leadImage(page.sections),
    path: listingPagePath(pagePath(slug, locale), route.pageNumber),
    languages: route.pageNumber === 1 ? languagePaths(page, locale) : undefined,
    isHome: slug === "/" && !page.metadata?.title,
  });
}
