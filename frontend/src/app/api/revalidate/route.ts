import { revalidateTag } from "next/cache";
import { CACHE_TAG } from "@/utils/strapi";
import { secretMatches } from "@/utils/secret";

/**
 * Strapi calls this after any content change (see backend/src/index.ts).
 * Expiring the tag immediately, rather than serving stale pages while they
 * refresh, is what makes a publish show up on the next page load.
 */
export async function POST(request: Request) {
  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice(7)
    : null;

  if (!secretMatches(token, process.env.REVALIDATE_SECRET)) {
    return Response.json({ revalidated: false }, { status: 401 });
  }

  revalidateTag(CACHE_TAG, { expire: 0 });
  return Response.json({ revalidated: true, now: Date.now() });
}
