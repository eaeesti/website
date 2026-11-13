import type { Metadata } from "next";
import type {
  StrapiGlobal,
  StrapiMedia,
  StrapiPage,
} from "@/types/generated/strapi";
import type { Locale } from "./locale";
import { isExternalUrl, siteUrl } from "./url";

/** og:locale, as Facebook and others expect it. */
const OPEN_GRAPH_LOCALES: Record<Locale, string> = { et: "et_EE", en: "en_US" };

type ShareImage = Pick<
  StrapiMedia,
  "url" | "width" | "height" | "alternativeText"
>;

/**
 * The site's own share cards (public/share/): the home page's hero at
 * 1200×630. The home page is shared with them, and so is any page with no
 * image of its own or in Site settings. Sites cache link previews by the
 * image's address, so give a changed card a new file name.
 */
export const SITE_SHARE_IMAGES: Record<Locale, ShareImage> = {
  et: {
    url: "/share/et.jpg",
    width: 1200,
    height: 630,
    alternativeText: "Efektiivne Altruism Eesti: Teeme head paremini!",
  },
  en: {
    url: "/share/en.jpg",
    width: 1200,
    height: 630,
    alternativeText: "Effective Altruism Estonia: Let’s do good better!",
  },
};

/**
 * The photo a page opens with (its hero or header), to share the page with
 * when it has no share image of its own.
 */
export function leadImage(
  sections: StrapiPage["sections"] | null | undefined,
): StrapiMedia | null {
  const first = sections?.[0];
  return first?.__component === "sections.hero-section" ||
    first?.__component === "sections.header-section"
    ? first.image
    : null;
}

interface PageMetadataInput {
  locale: Locale;
  /** Without the site name; the root layout's title template adds it. */
  title: string | null | undefined;
  description?: string | null;
  image?: ShareImage | null;
  /** The page's canonical path. */
  path: string;
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
    languages,
    isHome = false,
    type = "website",
    publishedTime,
  }: PageMetadataInput,
): Metadata {
  const siteName = global?.siteName ?? "Efektiivne Altruism Eesti";
  const shareImage =
    image ?? global?.metadata?.shareImage ?? SITE_SHARE_IMAGES[locale];
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
          url: shareImage.url,
          width: shareImage.width ?? undefined,
          height: shareImage.height ?? undefined,
          alt: shareImage.alternativeText ?? undefined,
        },
      ],
    },
  };
}

/**
 * Who runs the site, for search engines (schema.org), on the home page: its
 * name, address, logo, email and social media accounts. "<" is escaped so no
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
