import type {
  StrapiBlogCategory,
  StrapiBlogPost,
  StrapiGlobal,
  StrapiPage,
} from "@/types/generated/strapi";
import { categoryPath, postPath } from "./blog";
import { hashString } from "./hash";
import type { Locale } from "./locale";
import { leadImage, leadSection, type ShareImage } from "./seo";

/**
 * A page's share card: the image link previews show, drawn by the routes in
 * app/og/ (utils/share-card-image.tsx) in the style of the home page's hero.
 */
export interface ShareCard {
  title: string;
  subtitle: string | null;
  /** An uploaded photo behind the text (/uploads/…); none is plain blue. */
  photo: string | null;
}

export const SHARE_CARD_SIZE = { width: 1200, height: 630 };

/**
 * Part of every card's version: change it when the cards' design changes, so
 * sites that keep link previews fetch the new ones.
 */
const DESIGN_VERSION = 1;

/** Pages without a photo of their own use the share image in Site settings. */
function defaultPhoto(global: StrapiGlobal | null): string | null {
  return global?.metadata?.shareImage?.url ?? null;
}

/** A CMS page: its hero's or header's title and photo. */
export function pageShareCard(
  page: Pick<StrapiPage, "name" | "metadata" | "sections">,
  global: StrapiGlobal | null,
): ShareCard {
  const lead = leadSection(page.sections);
  return {
    title: lead?.title || page.metadata?.title || page.name,
    subtitle:
      lead?.__component === "sections.hero-section" ? lead.subtitle : null,
    photo: lead?.image?.url ?? defaultPhoto(global),
  };
}

export function postShareCard(
  post: StrapiBlogPost,
  global: StrapiGlobal | null,
): ShareCard {
  return {
    title: post.title,
    subtitle: null,
    photo: post.image?.url ?? defaultPhoto(global),
  };
}

/** A category: its name, with the blog page's header photo. */
export function categoryShareCard(
  category: StrapiBlogCategory,
  blogPage: StrapiPage | null,
  global: StrapiGlobal | null,
): ShareCard {
  return {
    title: category.name,
    subtitle: category.description,
    photo: leadImage(blogPage?.sections)?.url ?? defaultPhoto(global),
  };
}

/** Where a CMS page's card is drawn: /og/et for the home page, /og/en/events. */
export function pageShareCardPath(slug: string, locale: Locale): string {
  return `/og/${locale}${slug === "/" ? "" : `/${slug}`}`;
}

export function postShareCardPath(slug: string): string {
  return `/og${postPath(slug)}`;
}

export function categoryShareCardPath(slug: string): string {
  return `/og${categoryPath(slug)}`;
}

/**
 * The card as the page's share image. Its address ends in a version that
 * changes with the card, since Facebook and others keep previews by address.
 */
export function shareCardImage(path: string, card: ShareCard): ShareImage {
  const version = hashString(JSON.stringify([DESIGN_VERSION, card]));
  return {
    url: `${path}?v=${version}`,
    ...SHARE_CARD_SIZE,
    alternativeText: card.title,
  };
}

/** Cuts text at a word to at most `max` characters, with "…". */
export function shorten(text: string, max: number): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (trimmed.length <= max) return trimmed;
  const cut = trimmed.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > max / 2 ? cut.slice(0, space) : cut).replace(/[\s,.;:–-]+$/, "")}…`;
}

/** Long titles get smaller type, so they fit in three lines. */
export function titleFontSize(title: string): number {
  if (title.length <= 22) return 86;
  if (title.length <= 40) return 72;
  if (title.length <= 70) return 60;
  return 50;
}
