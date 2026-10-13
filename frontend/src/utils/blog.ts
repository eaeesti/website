import type { StrapiBlogPost } from "@/types/generated/strapi";

/**
 * The blog's URLs, kept from the old Webflow site. The blog index itself is a
 * CMS page with the slug "blogi" that contains a blog posts section.
 */
export const BLOG_PATH = "/blogi";
export const CATEGORY_PATH = "/rubriik";

/** Listing pages after the first: /blogi/lk/2, /rubriik/filosoofia/lk/3. */
export const PAGE_SEGMENT = "lk";

export function postPath(slug: string): string {
  return `${BLOG_PATH}/${slug}`;
}

export function categoryPath(slug: string): string {
  return `${CATEGORY_PATH}/${slug}`;
}

export function listingPagePath(basePath: string, page: number): string {
  return page <= 1 ? basePath : `${basePath}/${PAGE_SEGMENT}/${page}`;
}

/**
 * The page number from a /lk/[page] segment. Only canonical positive integers
 * count: "02", "1.5" and "-1" are not pages.
 */
export function parsePageNumber(raw: string): number | null {
  if (!/^[1-9]\d{0,3}$/.test(raw)) return null;
  return Number(raw);
}

/**
 * The credit line shown on a post. An explicit byline wins, because the old
 * site has credits like "toimetas Jete Jõgi" that aren't plain author names.
 */
export function bylineText(
  post: Pick<StrapiBlogPost, "byline" | "authors">,
): string | null {
  const byline = post.byline?.trim();
  if (byline) return byline;
  const names = (post.authors ?? [])
    .map((author) => author.name)
    .filter(Boolean);
  return names.length > 0 ? names.join(", ") : null;
}

/**
 * Which page numbers to show: always the first and last, plus the current
 * page and its neighbours, with null marking a gap.
 */
export function visiblePages(
  page: number,
  pageCount: number,
): (number | null)[] {
  const pages = new Set([1, pageCount, page - 1, page, page + 1]);
  const sorted = [...pages]
    .filter((p) => p >= 1 && p <= pageCount)
    .toSorted((a, b) => a - b);

  const result: (number | null)[] = [];
  sorted.forEach((p, index) => {
    if (index > 0 && p - sorted[index - 1] > 1) result.push(null);
    result.push(p);
  });
  return result;
}
