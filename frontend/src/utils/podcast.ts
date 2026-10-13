import { XMLParser } from "fast-xml-parser";

export interface PodcastEpisode {
  title: string;
  /** The episode's page on Spotify. */
  link: string | null;
  date: string | null;
  /** As in the feed, e.g. "01:32:41". */
  duration: string | null;
  audioUrl: string | null;
  image: string | null;
  /** Plain text, without the feed's HTML. */
  description: string;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  cdataPropName: false,
  processEntities: true,
});

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  "#39": "'",
  apos: "'",
  nbsp: " ",
};

/** The feed's HTML descriptions as plain text, one line per paragraph. */
export function htmlToText(html: string): string {
  return html
    .replace(/<\/(p|div|li)>|<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&(#?\w+);/g, (match, name) => ENTITIES[name] ?? match)
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

/** A property of parsed XML, which is untyped. */
function field(value: unknown, name: string): unknown {
  if (!value || typeof value !== "object") return undefined;
  return Object.entries(value).find(([key]) => key === name)?.[1];
}

function text(value: unknown): string | null {
  if (typeof value === "string") return value.trim() || null;
  if (typeof value === "number") return String(value);
  return null;
}

/** Episodes in an RSS feed, in the feed's order (newest first). */
export function parsePodcastFeed(xml: string): PodcastEpisode[] {
  const items = field(
    field(field(parser.parse(xml), "rss"), "channel"),
    "item",
  );
  const list: unknown[] = Array.isArray(items) ? items : items ? [items] : [];

  return list.flatMap((item) => {
    const title = text(field(item, "title"));
    if (!title) return [];
    const published = text(field(item, "pubDate"));
    const date = published ? new Date(published) : null;
    return [
      {
        title,
        link: text(field(item, "link")),
        date: date && !Number.isNaN(date.getTime()) ? date.toISOString() : null,
        duration: text(field(item, "itunes:duration")),
        audioUrl: text(field(field(item, "enclosure"), "url")),
        image: text(field(field(item, "itunes:image"), "href")),
        description: htmlToText(text(field(item, "description")) ?? ""),
      },
    ];
  });
}

/** "01:32:41" → "1 h 33 min", "00:45:10" → "45 min" */
export function formatDuration(duration: string | null): string | null {
  if (!duration) return null;
  const parts = duration.split(":").map(Number);
  if (parts.some((part) => Number.isNaN(part))) return null;
  const seconds = parts.reduce((total, part) => total * 60 + part, 0);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return hours > 0 ? `${hours} h ${minutes} min` : `${minutes} min`;
}

/**
 * Fetches a podcast's episodes, cached for an hour. Returns [] when the feed
 * can't be read, so the page still renders.
 */
export async function getPodcastEpisodes(
  rssUrl: string,
): Promise<PodcastEpisode[]> {
  try {
    const response = await fetch(rssUrl, {
      next: { revalidate: 3600, tags: ["podcast"] },
    });
    if (!response.ok) return [];
    return parsePodcastFeed(await response.text());
  } catch {
    return [];
  }
}
