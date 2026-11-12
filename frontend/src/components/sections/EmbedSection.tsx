import type { StrapiEmbedSection } from "@/types/generated/strapi";
import { EMBED_SANDBOX, embedDetails, toEmbedUrl } from "@/utils/embed";
import ClickToLoad from "../elements/ClickToLoad";

/**
 * An iframe from an allowed host (calendars, podcasts, videos, forms), behind
 * a placeholder until it's clicked. Any other URL renders nothing; the list is
 * in utils/embed.ts.
 */
export default function EmbedSection({
  title,
  url,
  height,
  caption,
}: StrapiEmbedSection) {
  const src = toEmbedUrl(url);
  if (!src) return null;
  const details = embedDetails(src);
  const frameHeight = height ?? 600;

  return (
    <section className="px-4 py-10 sm:px-6 sm:py-14">
      <figure className="mx-auto max-w-4xl">
        {title && (
          <h2 className="mb-6 text-3xl font-extrabold tracking-tight text-primary-800">
            {title}
          </h2>
        )}
        <ClickToLoad
          service={details.service}
          kind={details.kind}
          thumbnail={details.thumbnail}
          height={frameHeight}
        >
          <iframe
            src={details.loadSrc}
            title={title ?? caption ?? details.service}
            height={frameHeight}
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
            sandbox={EMBED_SANDBOX}
            className="w-full rounded-xl border-0 bg-slate-50"
          />
        </ClickToLoad>
        {caption && (
          <figcaption className="mt-3 text-sm text-slate-600">
            {caption}
          </figcaption>
        )}
      </figure>
    </section>
  );
}
