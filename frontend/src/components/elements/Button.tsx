import { ArrowLongRightIcon } from "@heroicons/react/20/solid";
import { classes } from "@/utils/react";
import Anchor from "./Anchor";

export type ButtonType = "primary" | "secondary" | "white" | "outline" | "text";
export type ButtonSize = "sm" | "md" | "lg" | "xl";

const TYPES: Record<ButtonType, string> = {
  primary:
    "bg-primary-600 text-white shadow-sm hover:bg-primary-700 focus-visible:outline-primary-600",
  secondary:
    "bg-primary-100 text-primary-800 shadow-sm hover:bg-primary-200 focus-visible:outline-primary-600",
  white:
    "bg-white text-primary-800 shadow-sm hover:bg-primary-50 focus-visible:outline-white",
  outline:
    "text-white ring-1 ring-white/80 ring-inset hover:bg-white/10 focus-visible:outline-white",
  text: "text-primary-700 hover:text-primary-900 focus-visible:outline-primary-600",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "px-2.5 py-1.5 text-sm",
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
  xl: "px-8 py-4 text-lg",
};

export function buttonClasses(
  type: ButtonType | null | undefined,
  size: ButtonSize | null | undefined,
  className?: string,
): string {
  return classes(
    "inline-flex items-center justify-center gap-1.5 rounded-md text-center font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
    type === "text" ? "px-0 py-0" : SIZES[size ?? "md"],
    TYPES[type ?? "primary"],
    className,
  );
}

/**
 * Plausible's tagged events: a class named `plausible-event-name=X` on a link
 * records event X when it's clicked, without any client-side JavaScript.
 */
function plausibleClass(event: string | null | undefined): string | null {
  const name = event?.trim();
  return name ? `plausible-event-name=${name.replace(/\s+/g, "+")}` : null;
}

interface ButtonProps {
  text: string | null | undefined;
  href: string | null | undefined;
  type?: ButtonType | null;
  size?: ButtonSize | null;
  arrow?: boolean | null;
  newTab?: boolean | null;
  plausibleEvent?: string | null;
  className?: string;
}

export default function Button({
  text,
  href,
  type,
  size,
  arrow,
  newTab,
  plausibleEvent,
  className,
}: ButtonProps) {
  if (!text || !href) return null;

  return (
    <Anchor
      href={href}
      newTab={newTab}
      externalIcon
      className={classes(
        buttonClasses(type, size, className),
        plausibleClass(plausibleEvent),
      )}
    >
      {text}
      {arrow && <ArrowLongRightIcon className="size-5" aria-hidden="true" />}
    </Anchor>
  );
}
