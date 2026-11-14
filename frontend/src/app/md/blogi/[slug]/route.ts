import { postPath } from "@/utils/blog";
import {
  markdownResponse,
  notFoundResponse,
  postMarkdown,
} from "@/utils/page-markdown";
import { getGlobal, getPost } from "@/utils/strapi";

interface Context {
  params: Promise<{ slug: string }>;
}

// A blog post as Markdown, at /blogi/slug.md (see md/[locale]).
export const dynamic = "force-static";

export function generateStaticParams() {
  return [];
}

export async function GET(_request: Request, { params }: Context) {
  const slug = decodeURIComponent((await params).slug);
  const [global, post] = await Promise.all([getGlobal("et"), getPost(slug)]);
  if (!post) return notFoundResponse();
  return markdownResponse(postMarkdown(post, global), postPath(post.slug));
}
