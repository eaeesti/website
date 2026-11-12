import { EMBED_SANDBOX, embedDetails, type MediaEmbed } from "@/utils/embed";
import { classes } from "@/utils/react";
import ClickToLoad from "./ClickToLoad";

/**
 * A YouTube, Vimeo or Spotify player (see mediaEmbed in utils/embed.ts),
 * behind a placeholder until it's clicked.
 */
export default function MediaPlayer({
  embed,
  className,
}: {
  embed: MediaEmbed;
  className?: string;
}) {
  const details = embedDetails(embed.src);
  return (
    <ClickToLoad
      service={details.service}
      kind={embed.kind}
      thumbnail={details.thumbnail}
      height={embed.height}
      className={className}
    >
      <iframe
        src={details.loadSrc}
        title={embed.kind === "video" ? "Video" : "Podcast"}
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
    </ClickToLoad>
  );
}
