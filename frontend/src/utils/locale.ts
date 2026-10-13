export const LOCALES = ["et", "en"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "et";

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/** The other language, for the language switch. */
export function otherLocale(locale: Locale): Locale {
  return locale === "et" ? "en" : "et";
}

/** Estonian pages live at the root, English ones under /en. */
export function localePrefix(locale: Locale): string {
  return locale === "en" ? "/en" : "";
}

/**
 * The URL path of a CMS page. The home page has the slug "/".
 * Keep in sync with pagePath() in backend/config/admin.js.
 */
export function pagePath(
  slug: string | null | undefined,
  locale: Locale,
): string {
  const prefix = localePrefix(locale);
  if (!slug || slug === "/") return prefix || "/";
  return `${prefix}/${slug}`;
}

/** Catch-all route segments to a page slug: [] → "/", ["a", "b"] → "a/b". */
export function slugFromSegments(segments: string[] | undefined): string {
  if (!segments || segments.length === 0) return "/";
  return segments.map((segment) => decodeURIComponent(segment)).join("/");
}
