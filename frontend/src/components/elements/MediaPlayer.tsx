import { EMBED_SANDBOX, type MediaEmbed } from "@/utils/embed";
import { classes } from "@/utils/react";

/** A YouTube, Vimeo or Spotify player (see mediaEmbed in utils/embed.ts). */
export default function MediaPlayer({
  embed,
  className,
}: {
  embed: MediaEmbed;
  className?: string;
}) {
  return (
    <iframe
      src={embed.src}
      title={embed.kind === "video" ? "Video" : "Podcast"}
      loading="lazy"
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      referrerPolicy="strict-origin-when-cross-origin"
      sandbox={EMBED_SANDBOX}
      allowFullScreen
      height={embed.height}
      className={classes(
        "w-full rounded-xl border-0",
        embed.kind === "video" && "aspect-video",
        className,
      )}
    />
  );
}
