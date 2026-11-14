import { categoryPath } from "@/utils/blog";
import {
  categoryMarkdown,
  markdownResponse,
  notFoundResponse,
} from "@/utils/page-markdown";
import { getAllPosts, getCategory, getGlobal } from "@/utils/strapi";

interface Context {
  params: Promise<{ slug: string }>;
}

// A category with all its posts as Markdown, at /rubriik/slug.md (see
// md/[locale]).
export const dynamic = "force-static";

export function generateStaticParams() {
  return [];
}

export async function GET(_request: Request, { params }: Context) {
  const slug = decodeURIComponent((await params).slug);
  const [global, category, posts] = await Promise.all([
    getGlobal("et"),
    getCategory(slug),
    getAllPosts(slug),
  ]);
  if (!category) return notFoundResponse();
  return markdownResponse(
    categoryMarkdown(category, posts, global),
    categoryPath(category.slug),
  );
}
