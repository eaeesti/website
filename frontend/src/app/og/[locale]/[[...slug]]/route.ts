import { isLocale, slugFromSegments } from "@/utils/locale";
import { pageShareCard } from "@/utils/share-card";
import { shareCardResponse } from "@/utils/share-card-image";
import { getGlobal, getPage } from "@/utils/strapi";

interface Context {
  params: Promise<{ locale: string; slug?: string[] }>;
}

// A CMS page's share card (utils/share-card.ts). Like the pages, it's drawn
// on the first request and cached until the content changes.
export const dynamic = "force-static";

export function generateStaticParams() {
  return [];
}

export async function GET(_request: Request, { params }: Context) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return new Response(null, { status: 404 });
  const [global, page] = await Promise.all([
    getGlobal(locale),
    getPage(slugFromSegments(slug), locale),
  ]);
  if (!page) return new Response(null, { status: 404 });
  return shareCardResponse(pageShareCard(page, global));
}
