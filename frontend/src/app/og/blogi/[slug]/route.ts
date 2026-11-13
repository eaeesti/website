import { postShareCard } from "@/utils/share-card";
import { shareCardResponse } from "@/utils/share-card-image";
import { getGlobal, getPost } from "@/utils/strapi";

interface Context {
  params: Promise<{ slug: string }>;
}

// A blog post's share card, cached like the CMS pages' (app/og/[locale]).
export const dynamic = "force-static";

export function generateStaticParams() {
  return [];
}

export async function GET(_request: Request, { params }: Context) {
  const slug = decodeURIComponent((await params).slug);
  const [global, post] = await Promise.all([getGlobal("et"), getPost(slug)]);
  if (!post) return new Response(null, { status: 404 });
  return shareCardResponse(postShareCard(post, global));
}
