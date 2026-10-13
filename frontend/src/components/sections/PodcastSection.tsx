import Image from "next/image";
import type { StrapiPodcastSection } from "@/types/generated/strapi";
import { formatDate } from "@/utils/date";
import {
  formatDuration,
  getPodcastEpisodes,
  type PodcastEpisode,
} from "@/utils/podcast";
import Anchor from "../elements/Anchor";
import type { SectionContext } from "./types";

/** Shown before the "show more" button. */
const FIRST_EPISODES = 10;

/**
 * The podcast's episodes, newest first, read from its RSS feed (cached for
 * an hour), each with a player and a link to Spotify.
 */
export default async function PodcastSection({
  title,
  rssUrl,
  listenText,
  showMoreText,
  context,
}: StrapiPodcastSection & { context: SectionContext }) {
  const episodes = await getPodcastEpisodes(rssUrl);
  if (episodes.length === 0) return null;

  const dateLocale = context.global?.dateLocale;
  const episode = (item: PodcastEpisode) => (
    <Episode
      key={item.link ?? item.title}
      episode={item}
      dateLocale={dateLocale}
      listenText={listenText ?? "Listen on Spotify"}
    />
  );
  const rest = episodes.slice(FIRST_EPISODES);

  return (
    <section className="px-4 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-4xl">
        {title && (
          <h2 className="mb-12 text-center text-3xl font-extrabold tracking-tight text-balance text-primary-800">
            {title}
          </h2>
        )}
        <ul role="list" className="divide-y divide-slate-200">
          {episodes.slice(0, FIRST_EPISODES).map(episode)}
        </ul>
        {rest.length > 0 && (
          <details className="group">
            <summary className="mx-auto mt-10 flex w-fit cursor-pointer list-none items-center rounded-md bg-primary-100 px-4 py-2.5 text-sm font-semibold text-primary-800 group-open:hidden hover:bg-primary-200 [&::-webkit-details-marker]:hidden">
              {showMoreText ?? "Show more episodes"}
            </summary>
            <ul
              role="list"
              className="divide-y divide-slate-200 border-t border-slate-200"
            >
              {rest.map(episode)}
            </ul>
          </details>
        )}
      </div>
    </section>
  );
}

function Episode({
  episode,
  dateLocale,
  listenText,
}: {
  episode: PodcastEpisode;
  dateLocale: string | null | undefined;
  listenText: string;
}) {
  const date = formatDate(episode.date, dateLocale);
  const duration = formatDuration(episode.duration);

  return (
    <li className="flex flex-col gap-6 py-8 sm:flex-row">
      {episode.image && (
        <Image
          src={episode.image}
          alt=""
          width={160}
          height={160}
          sizes="10rem"
          className="size-32 flex-none rounded-xl object-cover shadow-sm sm:size-40"
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="flex gap-x-3 text-sm text-slate-500">
          {date && episode.date && <time dateTime={episode.date}>{date}</time>}
          {date && duration && <span aria-hidden="true">·</span>}
          {duration && <span>{duration}</span>}
        </p>
        <h3 className="mt-1 text-lg leading-snug font-bold text-slate-900">
          {episode.title}
        </h3>
        {episode.description && (
          <p className="mt-2 line-clamp-3 text-sm leading-6 whitespace-pre-line text-slate-600">
            {episode.description}
          </p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
          {episode.audioUrl && (
            // The feed has no transcripts or captions to attach.
            // oxlint-disable-next-line jsx-a11y/media-has-caption
            <audio
              controls
              preload="none"
              src={episode.audioUrl}
              className="h-10 w-full max-w-sm"
            />
          )}
          {episode.link && (
            <Anchor
              href={episode.link}
              newTab
              externalIcon
              className="inline-flex items-center text-sm font-semibold text-primary-700 hover:text-primary-900"
            >
              {listenText}
            </Anchor>
          )}
        </div>
      </div>
    </li>
  );
}
