import type { StrapiBlogPost } from "@/types/generated/strapi";
import { bylineText, postPath } from "@/utils/blog";
import { formatDate } from "@/utils/date";
import Anchor from "../elements/Anchor";
import StrapiImage from "../elements/StrapiImage";

interface PostCardProps {
  post: StrapiBlogPost;
  dateLocale: string | null | undefined;
}

export default function PostCard({ post, dateLocale }: PostCardProps) {
  const byline = bylineText(post);
  const date = formatDate(post.date, dateLocale);

  return (
    // The negative margin keeps the card aligned while hovered.
    <article className="group relative -m-4 flex flex-col rounded-3xl p-4 transition hover:bg-primary-50">
      <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-primary-100">
        <StrapiImage
          image={post.image}
          alt=""
          fill
          sizes="(min-width: 1024px) 24rem, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition group-hover:scale-105"
        />
      </div>
      <div className="mt-5 flex items-center gap-x-3 text-xs text-slate-500">
        {date && <time dateTime={post.date}>{date}</time>}
      </div>
      <h3 className="mt-2 text-lg leading-6 font-bold text-slate-900 group-hover:text-primary-700">
        <Anchor href={postPath(post.slug)}>
          {/* Makes the whole card clickable. */}
          <span className="absolute inset-0" aria-hidden="true" />
          {post.title}
        </Anchor>
      </h3>
      {post.excerpt && (
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
          {post.excerpt}
        </p>
      )}
      {byline && (
        <p className="mt-4 text-sm font-semibold text-primary-800">{byline}</p>
      )}
    </article>
  );
}
