import type { Metadata } from "next";
import type {
  StrapiGlobal,
  StrapiMedia,
  StrapiPage,
} from "@/types/generated/strapi";
import type { Locale } from "./locale";
import { markdownPath } from "./markdown";
import { isExternalUrl, siteUrl } from "./url";

/** og:locale, as Facebook and others expect it. */
const OPEN_GRAPH_LOCALES: Record<Locale, string> = { et: "et_EE", en: "en_US" };

/** An uploaded share image, or a share card (utils/share-card.ts). */
export type ShareImage = Pick<
  StrapiMedia,
  "url" | "width" | "height" | "alternativeText"
>;

/** The section a page opens with, if it's a hero or a header. */
export function leadSection(
  sections: StrapiPage["sections"] | null | undefined,
) {
  const first = sections?.[0];
  return first?.__component === "sections.hero-section" ||
    first?.__component === "sections.header-section"
    ? first
    : null;
}

/** The photo a page opens with (its hero's or header's). */
export function leadImage(
  sections: StrapiPage["sections"] | null | undefined,
): StrapiMedia | null {
  return leadSection(sections)?.image ?? null;
}

interface PageMetadataInput {
  locale: Locale;
  /** Without the site name; the root layout's title template adds it. */
  title: string | null | undefined;
  description?: string | null;
  /** The page's own share image, or else its share card. */
  image: ShareImage;
  /** The page's canonical path. */
  path: string;
  /** The path its Markdown version is named after (no /lk/2 suffix). */
  basePath?: string;
  /** The same page in each language that has it. */
  languages?: Partial<Record<Locale, string>>;
  /** Show only the site name as the title, e.g. on the home page. */
  isHome?: boolean;
  type?: "website" | "article";
  publishedTime?: string | null;
}

export function buildPageMetadata(
  global: StrapiGlobal | null,
  {
    locale,
    title,
    description,
    image,
    path,
    basePath = path,
    languages,
    isHome = false,
    type = "website",
    publishedTime,
  }: PageMetadataInput,
): Metadata {
  const siteName = global?.siteName ?? "Efektiivne Altruism Eesti";
  const resolvedDescription =
    description ?? global?.metadata?.description ?? undefined;

  return {
    title: isHome || !title ? { absolute: siteName } : title,
    description: resolvedDescription,
    alternates: {
      canonical: path,
      ...(languages && Object.keys(languages).length > 1
        ? // Estonian is the default for visitors whose language isn't listed.
          { languages: { ...languages, "x-default": languages.et } }
        : {}),
      // Tells AI agents where the page's Markdown version is.
      types: { "text/markdown": markdownPath(basePath) },
    },
    openGraph: {
      type,
      siteName,
      title: isHome || !title ? siteName : title,
      description: resolvedDescription,
      url: path,
      locale: OPEN_GRAPH_LOCALES[locale],
      alternateLocale: Object.keys(languages ?? {})
        .filter(
          (code): code is Locale =>
            code !== locale && code in OPEN_GRAPH_LOCALES,
        )
        .map((code) => OPEN_GRAPH_LOCALES[code]),
      ...(publishedTime ? { publishedTime } : {}),
      images: [
        {
          url: image.url,
          width: image.width ?? undefined,
          height: image.height ?? undefined,
          alt: image.alternativeText ?? undefined,
        },
      ],
    },
  };
}

/**
 * Who runs the site, for search engines (schema.org), on the home page: its
 * name, website, logo, email and social media accounts. "<" is escaped so no
 * value can close the script tag.
 */
export function organizationJsonLd(global: StrapiGlobal | null): string {
  const logo = global?.appleTouchIcon ?? global?.favicon;
  const email = global?.footer?.email;
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: global?.siteName ?? "Efektiivne Altruism Eesti",
    url: siteUrl("/"),
    ...(logo ? { logo: siteUrl(logo.url) } : {}),
    ...(email ? { email } : {}),
    sameAs: (global?.footer?.socialMediaLinks ?? [])
      .map((link) => link.href.trim())
      .filter(isExternalUrl),
  };
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
