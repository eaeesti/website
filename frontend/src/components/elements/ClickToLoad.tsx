"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { PlayIcon } from "@heroicons/react/24/solid";
import { classes } from "@/utils/react";
import { useUiText } from "./UiText";

interface ClickToLoadProps {
  /** Who serves the embed, e.g. "YouTube". */
  service: string;
  kind: "video" | "audio" | "embed";
  /** Shown behind the button, e.g. a video's still. */
  thumbnail?: string | null;
  /** The placeholder's height in pixels, as the iframe's; without it videos keep a 16:9 frame. */
  height?: number;
  className?: string;
  /** The iframe, mounted only once the visitor asks for it. */
  children: ReactNode;
}

/**
 * Stands in for a third-party player, calendar or form until it's clicked.
 * Such embeds call their site as soon as they load, which tells it about the
 * visitor and lets it set cookies: the site promises neither without the
 * visitor's say (frontend/AGENTS.md), and it makes pages slower. A YouTube
 * still is fetched by this site's image optimizer, so even it doesn't reach
 * YouTube from the visitor's browser.
 */
export default function ClickToLoad({
  service,
  kind,
  thumbnail,
  height,
  className,
  children,
}: ClickToLoadProps) {
  const [loaded, setLoaded] = useState(false);
  const frame = useRef<HTMLDivElement>(null);
  const texts = useUiText();

  // The button is gone once clicked, so keyboard focus moves on to the embed.
  useEffect(() => {
    if (loaded) frame.current?.querySelector("iframe")?.focus();
  }, [loaded]);

  if (loaded) return <div ref={frame}>{children}</div>;

  const label =
    kind === "video"
      ? texts.playVideo
      : kind === "audio"
        ? texts.listen
        : texts.showEmbed;
  const dark = Boolean(thumbnail);

  return (
    <div
      className={classes(
        "relative flex flex-col items-center justify-center gap-3 overflow-hidden rounded-xl px-4 text-center",
        dark ? "bg-slate-900" : "bg-slate-100 ring-1 ring-slate-900/5",
        !height && kind === "video" && "aspect-video",
        className,
      )}
      style={
        height ? { height } : kind === "video" ? undefined : { height: 400 }
      }
    >
      {thumbnail && (
        <>
          <Image
            src={thumbnail}
            alt=""
            fill
            sizes="(min-width: 1024px) 48rem, 100vw"
            className="object-cover"
          />
          <div aria-hidden="true" className="absolute inset-0 bg-black/40" />
        </>
      )}
      <button
        type="button"
        onClick={() => setLoaded(true)}
        className={classes(
          "relative inline-flex items-center gap-2 rounded-full px-5 py-3 font-semibold shadow-lg transition focus-visible:outline-2 focus-visible:outline-offset-2",
          dark
            ? "bg-white text-primary-800 hover:bg-primary-50 focus-visible:outline-white"
            : "bg-primary-600 text-white hover:bg-primary-700 focus-visible:outline-primary-600",
        )}
      >
        {kind !== "embed" && <PlayIcon aria-hidden="true" className="size-5" />}
        {label}
      </button>
      <p
        className={classes(
          "relative max-w-sm text-xs",
          dark ? "text-white" : "text-slate-600",
        )}
      >
        {texts.embedNotice.replace("{service}", service)}
      </p>
    </div>
  );
}
