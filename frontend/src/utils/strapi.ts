import "server-only";
import qs from "qs";
import { draftMode } from "next/headers";
import type {
  StrapiBlogCategory,
  StrapiBlogPost,
  StrapiGlobal,
  StrapiPage,
} from "@/types/generated/strapi";
import type { Locale } from "./locale";

/**
 * Every cached Strapi response carries this tag. Strapi calls
 * /api/revalidate after any content change, which expires the tag, so a
 * publish reaches every page that might show it on the next request. On a
 * site this size, clearing everything is cheaper than tracking which pages
 * use which entries.
 */
export const CACHE_TAG = "strapi";

/**
 * If a revalidation request ever gets lost, cached content still refreshes
 * after this many seconds.
 */
const FALLBACK_REVALIDATE_SECONDS = 60 * 60;

function strapiUrl(): string {
  return process.env.STRAPI_URL || "http://127.0.0.1:1337";
}

interface FetchOptions {
  /**
   * The content type has drafts. In draft mode, its draft versions are
   * requested instead of the published ones. Types without drafts must not
   * ask for them: Strapi returns nothing.
   */
  hasDrafts?: boolean;
}

export interface StrapiPagination {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

interface StrapiResponse<T> {
  data: T;
  meta?: { pagination?: StrapiPagination };
}

async function strapiFetch<T>(
  path: string,
  params: Record<string, unknown> = {},
  { hasDrafts = false }: FetchOptions = {},
): Promise<StrapiResponse<T> | null> {
  const { isEnabled: preview } = await draftMode();
  const query = qs.stringify(
    preview && hasDrafts ? { ...params, status: "draft" } : params,
    {
      encodeValuesOnly: true,
    },
  );
  const url = `${strapiUrl()}/api${path}${query ? `?${query}` : ""}`;

  let response: Response;
  try {
    response = await fetch(url, {
      // Server-only by design: this token must never reach a browser.
      headers: { Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}` },
      ...(preview
        ? { cache: "no-store" as const }
        : {
            next: {
              tags: [CACHE_TAG],
              revalidate: FALLBACK_REVALIDATE_SECONDS,
            },
          }),
    });
  } catch (error: unknown) {
    throw new Error(
      `Could not reach Strapi at ${strapiUrl()} for GET /api${path}. ` +
        "Check that the backend is running (pnpm dev) and STRAPI_URL is set. " +
        `(${error instanceof Error ? error.message : String(error)})`,
      { cause: error },
    );
  }

  if (response.status === 404) return null;

  if (response.status === 401 || response.status === 403) {
    throw new Error(
      `Strapi rejected the API token (HTTP ${response.status}) for GET /api${path}. ` +
        "STRAPI_API_TOKEN in frontend/.env probably doesn't match a token in the " +
        "running Strapi database, e.g. after restoring a database dump. Fix: open " +
        "Strapi → Settings → API Tokens → regenerate the Public API Token, put the " +
        "new value in frontend/.env, and restart the frontend.",
    );
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Strapi returned HTTP ${response.status} for GET /api${path}` +
        (body ? `: ${body.slice(0, 300)}` : ""),
    );
  }

  return (await response.json()) as StrapiResponse<T>;
}

/**
 * An uploaded file (/uploads/…) from Strapi. Null for anything else, or if it
 * can't be fetched.
 *
 * Not kept in Next's data cache: that's in memory (isrFlushToDisk is off),
 * shared with the rendered pages, and refuses anything over 2 MB. Only for
 * routes that are cached themselves (force-static, like the share cards),
 * where it's fetched once per render and the route stays static.
 */
export async function getUpload(url: string): Promise<ArrayBuffer | null> {
  if (!url.startsWith("/uploads/")) return null;
  try {
    const response = await fetch(`${strapiUrl()}${url}`, {
      cache: "no-store",
    });
    return response.ok ? await response.arrayBuffer() : null;
  } catch {
    return null;
  }
}

// ── Populate shapes ───────────────────────────────────────────────────────────

const METADATA_POPULATE = { populate: { shareImage: true } };

const BUTTONS = { buttons: true };

/** What each page section needs populated. Add new sections here. */
const SECTIONS_POPULATE = {
  on: {
    "sections.hero-section": { populate: { image: true, ...BUTTONS } },
    "sections.header-section": {
      populate: { image: true, breadcrumbs: true, ...BUTTONS },
    },
    "sections.text-section": { populate: "*" },
    "sections.podcast-section": { populate: "*" },
    "sections.events-section": { populate: BUTTONS },
    "sections.newsletter-section": { populate: "*" },
    "sections.partner-section": { populate: { image: true } },
    "sections.text-image-section": { populate: { image: true, ...BUTTONS } },
    "sections.cards-section": {
      populate: { cards: { populate: { image: true } } },
    },
    "sections.cta-section": { populate: BUTTONS },
    "sections.faq-section": { populate: { questions: true } },
    "sections.team-section": {
      populate: {
        teamMembers: {
          populate: { image: true, socialMediaLinks: true, button: true },
        },
      },
    },
    "sections.testimonials-section": {
      populate: { testimonials: { populate: { image: true } } },
    },
    "sections.contact-section": { populate: "*" },
    "sections.blog-posts-section": { populate: { allPostsButton: true } },
    "sections.embed-section": { populate: "*" },
    "sections.donation-section": { populate: { amounts: true } },
  },
};

const POST_LIST_FIELDS = ["title", "slug", "date", "excerpt", "byline"];

const POST_LIST_POPULATE = {
  image: true,
  authors: { fields: ["name"] },
  categories: { fields: ["name", "slug"] },
};

// ── Global ────────────────────────────────────────────────────────────────────

export async function getGlobal(locale: Locale): Promise<StrapiGlobal | null> {
  const response = await strapiFetch<StrapiGlobal>("/global", {
    locale,
    populate: {
      metadata: METADATA_POPULATE,
      favicon: true,
      appleTouchIcon: true,
      navbar: {
        populate: {
          logo: true,
          links: { populate: { children: true } },
          ctaButton: true,
        },
      },
      footer: {
        populate: {
          logo: true,
          socialMediaLinks: true,
          columns: { populate: { links: true } },
        },
      },
      notFoundPage: { populate: BUTTONS },
    },
  });
  return response?.data ?? null;
}

// ── Pages ─────────────────────────────────────────────────────────────────────

export async function getPage(
  slug: string,
  locale: Locale,
): Promise<StrapiPage | null> {
  const response = await strapiFetch<StrapiPage[]>(
    "/pages",
    {
      locale,
      filters: { slug: { $eq: slug } },
      populate: {
        metadata: METADATA_POPULATE,
        sections: SECTIONS_POPULATE,
        localizations: { fields: ["slug", "locale"] },
      },
    },
    { hasDrafts: true },
  );
  return response?.data?.[0] ?? null;
}

/** Every page's slug; Strapi adds the documentId to any list of fields. */
export async function getPageSlugs(
  locale: Locale,
): Promise<Pick<StrapiPage, "documentId" | "slug" | "updatedAt">[]> {
  return collectAll<Pick<StrapiPage, "documentId" | "slug" | "updatedAt">>(
    "/pages",
    {
      locale,
      fields: ["slug", "updatedAt"],
    },
  );
}

// ── Blog ──────────────────────────────────────────────────────────────────────

export interface PostListing {
  posts: StrapiBlogPost[];
  pagination: StrapiPagination;
}

export async function getPosts({
  page = 1,
  pageSize = 12,
  categorySlug,
}: {
  page?: number;
  pageSize?: number;
  categorySlug?: string;
}): Promise<PostListing> {
  const response = await strapiFetch<StrapiBlogPost[]>(
    "/blog-posts",
    {
      fields: POST_LIST_FIELDS,
      populate: POST_LIST_POPULATE,
      sort: ["date:desc", "id:desc"],
      pagination: { page, pageSize },
      ...(categorySlug
        ? { filters: { categories: { slug: { $eq: categorySlug } } } }
        : {}),
    },
    { hasDrafts: true },
  );
  return {
    posts: response?.data ?? [],
    pagination: response?.meta?.pagination ?? {
      page,
      pageSize,
      pageCount: 0,
      total: 0,
    },
  };
}

export async function getPost(slug: string): Promise<StrapiBlogPost | null> {
  const response = await strapiFetch<StrapiBlogPost[]>(
    "/blog-posts",
    {
      filters: { slug: { $eq: slug } },
      populate: {
        image: true,
        metadata: METADATA_POPULATE,
        authors: { populate: { image: true } },
        categories: { fields: ["name", "slug"] },
      },
    },
    { hasDrafts: true },
  );
  return response?.data?.[0] ?? null;
}

/**
 * Up to `limit` other posts, preferring ones that share a category with
 * `post` and topping up with the latest posts.
 */
export async function getRelatedPosts(
  post: StrapiBlogPost,
  limit = 3,
): Promise<StrapiBlogPost[]> {
  const categorySlugs = (post.categories ?? []).map(
    (category) => category.slug,
  );
  const query = (filters: Record<string, unknown>) =>
    strapiFetch<StrapiBlogPost[]>(
      "/blog-posts",
      {
        fields: POST_LIST_FIELDS,
        populate: POST_LIST_POPULATE,
        sort: ["date:desc", "id:desc"],
        pagination: { page: 1, pageSize: limit },
        filters: { documentId: { $ne: post.documentId }, ...filters },
      },
      { hasDrafts: true },
    );

  const related = categorySlugs.length
    ? ((await query({ categories: { slug: { $in: categorySlugs } } }))?.data ??
      [])
    : [];
  if (related.length >= limit) return related;

  const latest = (await query({}))?.data ?? [];
  const seen = new Set(related.map((p) => p.documentId));
  return [...related, ...latest.filter((p) => !seen.has(p.documentId))].slice(
    0,
    limit,
  );
}

export async function getPostSlugs(): Promise<
  Pick<StrapiBlogPost, "slug" | "updatedAt">[]
> {
  return collectAll<Pick<StrapiBlogPost, "slug" | "updatedAt">>("/blog-posts", {
    fields: ["slug", "updatedAt"],
  });
}

export async function getCategory(
  slug: string,
): Promise<StrapiBlogCategory | null> {
  const response = await strapiFetch<StrapiBlogCategory[]>("/blog-categories", {
    filters: { slug: { $eq: slug } },
    fields: ["name", "slug", "description"],
  });
  return response?.data?.[0] ?? null;
}

export async function getCategories(): Promise<StrapiBlogCategory[]> {
  return collectAll<StrapiBlogCategory>("/blog-categories", {
    fields: ["name", "slug"],
    sort: ["name:asc"],
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Fetches every page of a collection (Strapi caps a page at 100 entries). */
async function collectAll<T>(
  path: string,
  params: Record<string, unknown>,
): Promise<T[]> {
  const results: T[] = [];
  for (let page = 1; ; page++) {
    const response = await strapiFetch<T[]>(path, {
      ...params,
      pagination: { page, pageSize: 100 },
    });
    results.push(...(response?.data ?? []));
    const pageCount = response?.meta?.pagination?.pageCount ?? 0;
    if (page >= pageCount) return results;
  }
}
