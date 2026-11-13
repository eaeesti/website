import { BLOG_PATH } from "@/utils/blog";
import { categoryShareCard } from "@/utils/share-card";
import { shareCardResponse } from "@/utils/share-card-image";
import { getCategory, getGlobal, getPage } from "@/utils/strapi";

interface Context {
  params: Promise<{ slug: string }>;
}

// A blog category's share card, cached like the CMS pages' (app/og/[locale]).
export const dynamic = "force-static";

export function generateStaticParams() {
  return [];
}

export async function GET(_request: Request, { params }: Context) {
  const slug = decodeURIComponent((await params).slug);
  const [global, category, blogPage] = await Promise.all([
    getGlobal("et"),
    getCategory(slug),
    getPage(BLOG_PATH.slice(1), "et"),
  ]);
  if (!category) return new Response(null, { status: 404 });
  return shareCardResponse(categoryShareCard(category, blogPage, global));
}
