import { ChevronDownIcon } from "@heroicons/react/20/solid";
import type { StrapiNavItem } from "@/types/generated/strapi";
import Anchor from "../elements/Anchor";

/**
 * A menu that opens on hover, or on focus for keyboards and touch screens.
 * The panel's top padding bridges the gap, so moving the mouse down to it
 * doesn't close it.
 */
export default function NavDropdown({ link }: { link: StrapiNavItem }) {
  return (
    <div className="group/dropdown relative">
      <button
        type="button"
        aria-haspopup="true"
        className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-semibold tracking-wide uppercase group-focus-within/dropdown:bg-white/10 group-hover/dropdown:bg-white/10 focus-visible:outline-2 focus-visible:outline-white"
      >
        {link.text}
        <ChevronDownIcon
          className="size-5 text-primary-200 transition group-focus-within/dropdown:rotate-180 group-hover/dropdown:rotate-180"
          aria-hidden="true"
        />
      </button>
      <div className="invisible absolute top-full right-0 z-40 pt-2 opacity-0 transition group-focus-within/dropdown:visible group-focus-within/dropdown:opacity-100 group-hover/dropdown:visible group-hover/dropdown:opacity-100">
        <div className="w-64 rounded-lg bg-primary-800 p-2 shadow-xl ring-1 ring-white/10">
          {link.href && (
            <Anchor
              href={link.href}
              newTab={link.newTab}
              externalIcon
              className="flex items-center rounded-md px-3 py-2 text-sm font-semibold hover:bg-white/10"
            >
              {link.text}
            </Anchor>
          )}
          {link.children.map((child) => (
            <Anchor
              key={child.id}
              href={child.href}
              newTab={child.newTab}
              externalIcon
              className="flex items-center rounded-md px-3 py-2 text-sm text-primary-50 hover:bg-white/10 hover:text-white"
            >
              {child.text}
            </Anchor>
          ))}
        </div>
      </div>
    </div>
  );
}
