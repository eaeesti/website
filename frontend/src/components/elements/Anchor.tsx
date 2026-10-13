import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { isExternalUrl, safeHref } from "@/utils/url";
import ExternalLinkIcon from "./ExternalLinkIcon";

/** Site pages go through next/link; files and other sites are plain links. */
function isPageLink(href: string): boolean {
  return href.startsWith("/") && !href.startsWith("/uploads/");
}

interface AnchorProps extends Omit<ComponentPropsWithoutRef<"a">, "href"> {
  href: string | null | undefined;
  newTab?: boolean | null;
  /** Mark links to other websites with an icon. */
  externalIcon?: boolean;
}

export default function Anchor({
  href,
  newTab,
  externalIcon = false,
  children,
  ...rest
}: AnchorProps) {
  const target = safeHref(href);
  const icon = externalIcon && isExternalUrl(target);
  const tabProps = newTab
    ? { target: "_blank", rel: "noopener noreferrer" }
    : {};

  if (isPageLink(target)) {
    return (
      <Link href={target} {...tabProps} {...rest}>
        {children}
      </Link>
    );
  }

  return (
    <a href={target} {...tabProps} {...rest}>
      {icon ? <WithIcon>{children}</WithIcon> : children}
    </a>
  );
}

/**
 * The link's text and the external link icon. The icon must not wrap onto
 * a line of its own, so it shares a non-breaking span with the last word
 * (when the text is a plain string) and a word joiner with what follows.
 * Everything is inside one span: in a flex link (buttons, menus) each loose
 * text node would become a flex item, losing the space before the last word.
 */
function WithIcon({ children }: { children: ReactNode }) {
  if (typeof children === "string") {
    const split = children.trimEnd().lastIndexOf(" ");
    return (
      <span>
        {children.slice(0, split + 1)}
        <span className="whitespace-nowrap">
          {children.slice(split + 1).trimEnd()}
          <ExternalLinkIcon />
        </span>
        {"\u2060"}
      </span>
    );
  }
  return (
    <span>
      {children}
      {"\u2060"}
      <ExternalLinkIcon />
      {"\u2060"}
    </span>
  );
}
