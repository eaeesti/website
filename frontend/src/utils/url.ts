// webcal: subscribes a calendar app to an iCal feed.
const SAFE_PROTOCOLS = ["http:", "https:", "mailto:", "tel:", "webcal:"];

/**
 * Links come from the CMS. Anything that isn't a relative path, an anchor or
 * a known protocol (e.g. "javascript:") is dropped.
 */
export function safeHref(href: string | null | undefined): string {
  const value = href?.trim();
  if (!value) return "#";
  if (value.startsWith("#")) return value;
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  try {
    return SAFE_PROTOCOLS.includes(new URL(value).protocol) ? value : "#";
  } catch {
    return "#";
  }
}

/** A link to another website, as opposed to this site, mail or phone. */
export function isExternalUrl(href: string | null | undefined): boolean {
  return /^https?:\/\//i.test(href?.trim() ?? "");
}

/** Absolute URL on this site, for metadata that must not be relative. */
export function siteUrl(path = "/"): string {
  const base = (
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ).replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
