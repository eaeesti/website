interface PreviewBannerProps {
  path: string;
  text: string;
  exitText: string;
}

/** Shown while draft mode is on, so editors know they're seeing unpublished content. */
export default function PreviewBanner({
  path,
  text,
  exitText,
}: PreviewBannerProps) {
  return (
    <div className="flex items-center justify-center gap-4 bg-amber-300 px-4 py-2 text-sm text-amber-950">
      <p>{text}</p>
      <form action="/api/preview/exit" method="post">
        <input type="hidden" name="path" value={path} />
        <button
          type="submit"
          className="font-semibold underline hover:no-underline"
        >
          {exitText}
        </button>
      </form>
    </div>
  );
}
