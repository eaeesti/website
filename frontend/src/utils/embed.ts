/**
 * Hosts an embed section may frame, and who they are, for the placeholder
 * shown until a visitor loads the embed. The embed section renders nothing for
 * any other host, and next.config.ts puts the same list in the CSP's
 * frame-src, so an editor pasting some other URL can't put a third-party page
 * on the site.
 */
const EMBED_SERVICES: Record<string, string> = {
  "https://calendar.google.com": "Google Calendar",
  "https://docs.google.com": "Google",
  "https://open.spotify.com": "Spotify",
  "https://www.youtube-nocookie.com": "YouTube",
  "https://www.youtube.com": "YouTube",
  "https://player.vimeo.com": "Vimeo",
  // The newsletter signup form.
  "https://ufp4cbgs.sendsmaily.net": "Smaily",
};

export const EMBED_ORIGINS = Object.keys(EMBED_SERVICES);

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

/** YouTube's IDs are letters, digits, "-" and "_"; anything else isn't one. */
const YOUTUBE_ID = /^[\w-]+$/;

function youtubeVideoId(url: URL): string | null {
  const id = (() => {
    if (url.hostname === "youtu.be") return url.pathname.slice(1);
    if (
      !["www.youtube.com", "youtube.com", "www.youtube-nocookie.com"].includes(
        url.hostname,
      )
    ) {
      return null;
    }
    if (url.pathname === "/watch") return url.searchParams.get("v");
    return url.pathname.match(/^\/embed\/([\w-]+)/)?.[1] ?? null;
  })();
  return id && YOUTUBE_ID.test(id) ? id : null;
}

/**
 * What the placeholder of an allowed embed (a toEmbedUrl result) shows, and
 * the address to load once it's clicked: videos start playing then, since
 * the click was the visitor asking for it.
 */
export interface EmbedDetails {
  /** Who serves the embed, named on the placeholder. */
  service: string;
  kind: "video" | "audio" | "embed";
  /** A YouTube video's still image. */
  thumbnail: string | null;
  /** The address for the iframe, once a visitor has clicked. */
  loadSrc: string;
}

export function embedDetails(src: string): EmbedDetails {
  const url = new URL(src);
  const youtubeId = youtubeVideoId(url);
  const isVideo = Boolean(youtubeId) || url.hostname === "player.vimeo.com";
  if (isVideo) url.searchParams.set("autoplay", "1");
  return {
    service: EMBED_SERVICES[url.origin] ?? url.hostname,
    kind: isVideo
      ? "video"
      : url.hostname === "open.spotify.com"
        ? "audio"
        : "embed",
    thumbnail: youtubeId
      ? `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`
      : null,
    loadSrc: url.toString(),
  };
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
