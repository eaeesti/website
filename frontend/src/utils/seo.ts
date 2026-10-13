import type { Metadata } from "next";
import type { StrapiGlobal, StrapiMedia } from "@/types/generated/strapi";
import type { Locale } from "./locale";

interface PageMetadataInput {
  /** Without the site name; the root layout's title template adds it. */
  title: string | null | undefined;
  description?: string | null;
  image?: StrapiMedia | null;
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
  const shareImage = image ?? global?.metadata?.shareImage;
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
      ...(publishedTime ? { publishedTime } : {}),
      ...(shareImage
        ? {
            images: [
              {
                url: shareImage.url,
                width: shareImage.width ?? undefined,
                height: shareImage.height ?? undefined,
                alt: shareImage.alternativeText ?? undefined,
              },
            ],
          }
        : {}),
    },
  };
}
