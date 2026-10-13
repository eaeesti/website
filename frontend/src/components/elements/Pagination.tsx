import {
  ArrowLongLeftIcon,
  ArrowLongRightIcon,
} from "@heroicons/react/20/solid";
import { listingPagePath, visiblePages } from "@/utils/blog";
import { classes } from "@/utils/react";
import Anchor from "./Anchor";

interface PaginationProps {
  basePath: string;
  page: number;
  pageCount: number;
  previousText: string | null;
  nextText: string | null;
}

export default function Pagination({
  basePath,
  page,
  pageCount,
  previousText,
  nextText,
}: PaginationProps) {
  if (pageCount <= 1) return null;

  const linkClass =
    "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-primary-800 hover:bg-primary-50";

  return (
    <nav
      className="mt-16 flex items-center justify-between gap-4 border-t border-slate-200 pt-6"
      aria-label="Pagination"
    >
      <div className="flex-1">
        {page > 1 && (
          <Anchor
            href={listingPagePath(basePath, page - 1)}
            className={linkClass}
            rel="prev"
          >
            <ArrowLongLeftIcon className="size-5" aria-hidden="true" />
            {previousText}
          </Anchor>
        )}
      </div>
      <ol className="hidden items-center gap-1 sm:flex">
        {visiblePages(page, pageCount).map((p, index) =>
          p === null ? (
            <li key={`gap-${index}`} className="px-2 text-slate-400">
              …
            </li>
          ) : (
            <li key={p}>
              <Anchor
                href={listingPagePath(basePath, p)}
                aria-current={p === page ? "page" : undefined}
                className={classes(
                  "inline-flex size-10 items-center justify-center rounded-md text-sm font-semibold",
                  p === page
                    ? "bg-primary-800 text-white"
                    : "text-slate-700 hover:bg-primary-50",
                )}
              >
                {p}
              </Anchor>
            </li>
          ),
        )}
      </ol>
      <div className="flex flex-1 justify-end">
        {page < pageCount && (
          <Anchor
            href={listingPagePath(basePath, page + 1)}
            className={linkClass}
            rel="next"
          >
            {nextText}
            <ArrowLongRightIcon className="size-5" aria-hidden="true" />
          </Anchor>
        )}
      </div>
    </nav>
  );
}
