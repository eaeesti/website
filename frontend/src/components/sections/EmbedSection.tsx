import type { StrapiEmbedSection } from "@/types/generated/strapi";
import { EMBED_SANDBOX, toEmbedUrl } from "@/utils/embed";

/**
 * An iframe from an allowed host (calendars, podcasts, videos, forms). Any
 * other URL renders nothing; the list is in utils/embed.ts.
 */
export default function EmbedSection({
  title,
  url,
  height,
  caption,
}: StrapiEmbedSection) {
  const src = toEmbedUrl(url);
  if (!src) return null;

  return (
    <section className="px-4 py-10 sm:px-6 sm:py-14">
      <figure className="mx-auto max-w-4xl">
        {title && (
          <h2 className="mb-6 text-3xl font-extrabold tracking-tight text-primary-800">
            {title}
          </h2>
        )}
        <iframe
          src={src}
          title={title ?? caption ?? "Embed"}
          height={height ?? 600}
          loading="lazy"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox={EMBED_SANDBOX}
          className="w-full rounded-xl border-0 bg-slate-50"
        />
        {caption && (
          <figcaption className="mt-3 text-sm text-slate-600">
            {caption}
          </figcaption>
        )}
      </figure>
    </section>
  );
}
