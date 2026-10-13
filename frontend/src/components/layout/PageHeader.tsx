import type { ReactNode } from "react";
import { ChevronRightIcon } from "@heroicons/react/20/solid";
import type { StrapiButton, StrapiMedia } from "@/types/generated/strapi";
import type { BlocksContent as BlocksContentData } from "@/types/blocks";
import Anchor from "../elements/Anchor";
import BlocksContent from "../elements/BlocksContent";
import StrapiImage from "../elements/StrapiImage";
import ButtonGroup from "../sections/ButtonGroup";

interface PageHeaderProps {
  title: string;
  description?: BlocksContentData | null;
  image?: StrapiMedia | null;
  breadcrumbs?: { title: string; href: string }[];
  buttons?: StrapiButton[];
  /** The header is the first thing on the page, so its image loads first. */
  priority?: boolean;
  /** Extra content under the buttons, e.g. the blog's categories. */
  children?: ReactNode;
}

/**
 * A page's title and intro, in white on dark blue or on a darkened photo, as
 * on the old site. The navbar is transparent over it at the top of the page.
 */
export default function PageHeader({
  title,
  description,
  image,
  breadcrumbs = [],
  buttons,
  priority = false,
  children,
}: PageHeaderProps) {
  return (
    <header
      data-nav-overlay
      className="relative isolate overflow-hidden bg-primary-800 px-4 pt-[calc(var(--nav-height)+3.5rem)] pb-16 sm:px-6 sm:pt-[calc(var(--nav-height)+5rem)] sm:pb-24"
    >
      {image && (
        <>
          <StrapiImage
            image={image}
            alt=""
            fill
            priority={priority}
            className="-z-10 object-cover"
          />
          <div
            className="absolute inset-0 -z-10 bg-primary-900/75"
            aria-hidden="true"
          />
        </>
      )}
      <div className="mx-auto max-w-3xl">
        {breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumbs" className="mb-6">
            <ol
              role="list"
              className="flex flex-wrap items-center gap-2 text-sm text-primary-100"
            >
              {breadcrumbs.map((crumb) => (
                <li key={crumb.href} className="flex items-center gap-2">
                  <Anchor href={crumb.href} className="hover:text-white">
                    {crumb.title}
                  </Anchor>
                  <ChevronRightIcon
                    className="size-4 text-primary-300"
                    aria-hidden="true"
                  />
                </li>
              ))}
            </ol>
          </nav>
        )}
        <h1 className="text-4xl font-extrabold tracking-tight text-balance text-white sm:text-5xl">
          {title}
        </h1>
        <BlocksContent
          content={description}
          invert
          className="mt-6 sm:prose-lg"
        />
        <ButtonGroup buttons={buttons} className="mt-8" />
        {children}
      </div>
    </header>
  );
}
