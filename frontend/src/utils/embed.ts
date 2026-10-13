/**
 * Hosts an embed section may frame. The embed section renders nothing for any
 * other host, and next.config.ts puts the same list in the CSP's frame-src, so
 * an editor pasting some other URL can't put a third-party page on the site.
 */
export const EMBED_ORIGINS = [
  "https://calendar.google.com",
  "https://docs.google.com",
  "https://open.spotify.com",
  "https://www.youtube-nocookie.com",
  "https://www.youtube.com",
  "https://player.vimeo.com",
  // The newsletter signup form (Smaily).
  "https://ufp4cbgs.sendsmaily.net",
];

/**
 * The sandbox for embedded players, calendars and forms: they may run
 * scripts, play media and open links in new tabs, but can't navigate or
 * script this page.
 */
export const EMBED_SANDBOX =
  "allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation";

/**
 * Returns the URL to put in the iframe, or null if it isn't allowed.
 * YouTube links are moved to youtube-nocookie.com, and plain watch/share
 * links are turned into embed links, since that's what editors tend to paste.
 */
export function toEmbedUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;

  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }

  const youtubeId = youtubeVideoId(url);
  if (youtubeId) {
    return `https://www.youtube-nocookie.com/embed/${youtubeId}`;
  }

  if (
    url.origin === "https://open.spotify.com" &&
    !url.pathname.startsWith("/embed/")
  ) {
    url.pathname = `/embed${url.pathname}`;
  }

  return EMBED_ORIGINS.includes(url.origin) ? url.toString() : null;
}

function youtubeVideoId(url: URL): string | null {
  if (url.hostname === "youtu.be") {
    return url.pathname.slice(1) || null;
  }
  if (
    ["www.youtube.com", "youtube.com", "www.youtube-nocookie.com"].includes(
      url.hostname,
    )
  ) {
    if (url.pathname === "/watch") return url.searchParams.get("v");
    const embed = url.pathname.match(/^\/embed\/([\w-]+)/);
    if (embed) return embed[1];
  }
  return null;
}

export interface MediaEmbed {
  src: string;
  /** Videos keep a 16:9 frame; audio players have a fixed height. */
  kind: "video" | "audio";
  height?: number;
}

/**
 * A link to a video or podcast episode that should show as a player. Rich
 * text renders a paragraph holding only such a link as the player itself,
 * so editors can paste a YouTube or Spotify link on its own line.
 */
export function mediaEmbed(raw: string | null | undefined): MediaEmbed | null {
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }

  const youtubeId = youtubeVideoId(url);
  if (youtubeId) {
    return {
      src: `https://www.youtube-nocookie.com/embed/${youtubeId}`,
      kind: "video",
    };
  }

  if (url.hostname === "vimeo.com" || url.hostname === "www.vimeo.com") {
    const id = url.pathname.match(/^\/(\d+)/)?.[1];
    return id
      ? { src: `https://player.vimeo.com/video/${id}`, kind: "video" }
      : null;
  }

  if (url.hostname === "open.spotify.com") {
    const match = url.pathname.match(
      /^\/(?:embed\/)?(episode|show|track|album|playlist)\/(\w+)/,
    );
    if (!match) return null;
    return {
      src: `https://open.spotify.com/embed/${match[1]}/${match[2]}`,
      kind: "audio",
      height: 352,
    };
  }

  return null;
}
