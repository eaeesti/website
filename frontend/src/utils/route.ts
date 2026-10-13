import { PAGE_SEGMENT, parsePageNumber } from "./blog";

export interface ListingRoute {
  /** The path segments of the page itself, without the /lk/N suffix. */
  segments: string[];
  pageNumber: number;
  /** The URL spelled out page 1 (/blogi/lk/1), which should redirect. */
  explicitFirstPage: boolean;
}

/**
 * Splits a trailing /lk/N off a catch-all route, so /blogi/lk/2 renders the
 * "blogi" page showing page 2 of its post listing. Returns null when the
 * suffix is there but N isn't a page number.
 */
export function parseListingSegments(
  segments: string[] | undefined,
): ListingRoute | null {
  const all = segments ?? [];
  if (all.length < 2 || all[all.length - 2] !== PAGE_SEGMENT) {
    return { segments: all, pageNumber: 1, explicitFirstPage: false };
  }
  const pageNumber = parsePageNumber(all[all.length - 1]);
  if (pageNumber === null) return null;
  return {
    segments: all.slice(0, -2),
    pageNumber,
    explicitFirstPage: pageNumber === 1,
  };
}
