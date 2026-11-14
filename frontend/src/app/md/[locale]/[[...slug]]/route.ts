import { isLocale, pagePath, slugFromSegments } from "@/utils/locale";
import {
  markdownResponse,
  notFoundResponse,
  pageMarkdown,
} from "@/utils/page-markdown";
import { getGlobal, getPage } from "@/utils/strapi";

interface Context {
  params: Promise<{ locale: string; slug?: string[] }>;
}

// A CMS page as Markdown (utils/page-markdown.ts), at the page's address with
// .md added (next.config.ts rewrites it here). Rendered on the first request
// and cached until the content changes, like the pages.
export const dynamic = "force-static";

export function generateStaticParams() {
  return [];
}

export async function GET(_request: Request, { params }: Context) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return notFoundResponse();
  const [global, page] = await Promise.all([
    getGlobal(locale),
    getPage(slugFromSegments(slug), locale),
  ]);
  if (!page) return notFoundResponse();
  return markdownResponse(
    await pageMarkdown(page, global, locale),
    pagePath(page.slug, locale),
  );
}
