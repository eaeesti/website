import type { StrapiBlogCategory } from "@/types/generated/strapi";
import { categoryPath } from "@/utils/blog";
import { classes } from "@/utils/react";
import Anchor from "../elements/Anchor";

interface CategoryLinksProps {
  categories: Pick<StrapiBlogCategory, "documentId" | "name" | "slug">[];
  activeSlug?: string;
  /** Light pills, for dark backgrounds. */
  dark?: boolean;
  className?: string;
}

export default function CategoryLinks({
  categories,
  activeSlug,
  dark = false,
  className,
}: CategoryLinksProps) {
  const pill = (active: boolean) => {
    if (dark) {
      return active
        ? "bg-white text-primary-800"
        : "bg-white/10 text-white hover:bg-white/20";
    }
    return active
      ? "bg-primary-800 text-white"
      : "bg-primary-50 text-primary-800 hover:bg-primary-100";
  };
  if (categories.length === 0) return null;
  return (
    // One scrolling row on phones, where wrapped pills would fill the screen.
    <ul
      role="list"
      className={classes(
        "-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0",
        className,
      )}
    >
      {categories.map((category) => (
        <li key={category.documentId}>
          <Anchor
            href={categoryPath(category.slug)}
            aria-current={category.slug === activeSlug ? "page" : undefined}
            className={classes(
              "inline-block rounded-full px-3 py-1 text-sm font-medium whitespace-nowrap",
              pill(category.slug === activeSlug),
            )}
          >
            {category.name}
          </Anchor>
        </li>
      ))}
    </ul>
  );
}
