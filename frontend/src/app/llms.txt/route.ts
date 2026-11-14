import { llmsTxt } from "@/utils/page-markdown";
import { getGlobal } from "@/utils/strapi";

// What the site is and where each page's Markdown version is, for AI agents
// (llmstxt.org). Cached until the content changes, like the pages.
export const dynamic = "force-static";

export async function GET() {
  const [et, en] = await Promise.all([getGlobal("et"), getGlobal("en")]);
  return new Response(await llmsTxt({ et, en }), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
