import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "@heroicons/react/20/solid";
import type { StrapiBlogPost, StrapiGlobal } from "@/types/generated/strapi";
import { BLOG_PATH, bylineText, postPath } from "@/utils/blog";
import { formatDate } from "@/utils/date";
import { buildPageMetadata } from "@/utils/seo";
import { getGlobal, getPost, getRelatedPosts } from "@/utils/strapi";
import { siteUrl } from "@/utils/url";
import Anchor from "../elements/Anchor";
import BlocksContent from "../elements/BlocksContent";
import StrapiImage from "../elements/StrapiImage";
import SiteShell from "../layout/SiteShell";
import CategoryLinks from "./CategoryLinks";
import PostGrid from "./PostGrid";

/** Structured data, so search engines can show the post as an article. */
function articleJsonLd(
  post: StrapiBlogPost,
  global: StrapiGlobal | null,
): string {
  const data = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt ?? undefined,
    datePublished: post.date,
    dateModified: post.updatedAt ?? undefined,
    image: post.image ? siteUrl(post.image.url) : undefined,
    url: siteUrl(postPath(post.slug)),
    inLanguage: "et",
    author: (post.authors ?? []).map((author) => ({
      "@type": "Person",
      name: author.name,
    })),
    publisher: {
      "@type": "Organization",
      name: global?.siteName ?? "Efektiivne Altruism Eesti",
    },
  };
  // Escaping "<" keeps a title like "</script>" from closing the tag.
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export default async function BlogPostPage({ slug }: { slug: string }) {
  const [global, post] = await Promise.all([getGlobal("et"), getPost(slug)]);
  if (!post) notFound();

  const related = await getRelatedPosts(post);
  const byline = bylineText(post);
  const date = formatDate(post.date, global?.dateLocale);
  const authorsWithBio = (post.authors ?? []).filter((author) => author.bio);

  return (
    <SiteShell global={global} locale="et" path={postPath(post.slug)}>
      {/* The navbar is transparent over the post's dark header. */}
      <article data-nav-overlay>
        <header className="bg-primary-800 px-4 pt-[calc(var(--nav-height)+3rem)] pb-16 text-white sm:pt-[calc(var(--nav-height)+4rem)] sm:pb-24">
          <div className="mx-auto max-w-3xl">
            <Anchor
              href={BLOG_PATH}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-200 hover:text-white"
            >
              <ArrowLeftIcon className="size-4" aria-hidden="true" />
              {global?.blogTitle ?? "Blogi"}
            </Anchor>
            <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-balance sm:text-5xl">
              {post.title}
            </h1>
            <p className="mt-6 flex flex-wrap gap-x-3 text-primary-100">
              {byline && <span className="font-semibold">{byline}</span>}
              {byline && date && <span aria-hidden="true">·</span>}
              {date && <time dateTime={post.date}>{date}</time>}
            </p>
          </div>
        </header>

        {post.image && (
          <div className="mx-auto -mt-8 max-w-4xl px-4 sm:-mt-12">
            <StrapiImage
              image={post.image}
              priority
              sizes="(min-width: 896px) 56rem, 100vw"
              className="h-auto w-full rounded-2xl shadow-lg"
            />
          </div>
        )}

        <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
          <BlocksContent content={post.content} className="prose-lg" />

          {(post.categories ?? []).length > 0 && (
            <CategoryLinks
              categories={post.categories ?? []}
              className="mt-12"
            />
          )}

          {authorsWithBio.map((author) => (
            <aside
              key={author.documentId}
              className="mt-12 flex gap-5 rounded-2xl bg-primary-50 p-6"
            >
              {author.image && (
                <div className="relative size-16 flex-none overflow-hidden rounded-full bg-primary-100">
                  <StrapiImage
                    image={author.image}
                    fill
                    sizes="4rem"
                    className="object-cover"
                  />
                </div>
              )}
              <div>
                <p className="font-bold text-slate-900">{author.name}</p>
                {author.role && (
                  <p className="text-sm text-primary-700">{author.role}</p>
                )}
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {author.bio}
                </p>
              </div>
            </aside>
          ))}
        </div>
      </article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: articleJsonLd(post, global) }}
      />

      {related.length > 0 && (
        <section className="border-t border-slate-200 bg-slate-50 px-4 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl">
            <h2 className="mb-10 text-2xl font-extrabold tracking-tight text-primary-800">
              {global?.relatedPostsTitle ?? "Loe veel"}
            </h2>
            <PostGrid posts={related} dateLocale={global?.dateLocale} />
          </div>
        </section>
      )}
    </SiteShell>
  );
}

export async function blogPostMetadata(slug: string): Promise<Metadata> {
  const [global, post] = await Promise.all([getGlobal("et"), getPost(slug)]);
  if (!post) return {};
  return buildPageMetadata(global, {
    title: post.metadata?.title ?? post.title,
    description: post.metadata?.description ?? post.excerpt,
    image: post.metadata?.shareImage ?? post.image,
    path: postPath(post.slug),
    type: "article",
    publishedTime: post.date,
  });
}
