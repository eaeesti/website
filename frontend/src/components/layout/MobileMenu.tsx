"use client";

import { useState, type ReactNode } from "react";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import type { StrapiButton, StrapiNavItem } from "@/types/generated/strapi";
import Anchor from "../elements/Anchor";
import { buttonClasses } from "../elements/Button";

interface MobileMenuProps {
  logo: ReactNode;
  homeHref: string;
  links: StrapiNavItem[];
  ctaButton: StrapiButton | null;
  languageSwitch: { text: string; href: string } | null;
  openText: string;
  closeText: string;
}

const ICON_BUTTON =
  "-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white";

/**
 * The menu on small screens: a dark panel that slides in from the right.
 * Its top row matches the navbar's, so the close button appears exactly
 * where the menu button was.
 */
export default function MobileMenu({
  logo,
  homeHref,
  links,
  ctaButton,
  languageSwitch,
  openText,
  closeText,
}: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <div className="flex lg:hidden">
      <button
        type="button"
        className={ICON_BUTTON}
        onClick={() => setOpen(true)}
      >
        <span className="sr-only">{openText}</span>
        <Bars3Icon className="size-6" aria-hidden="true" />
      </button>
      <Dialog open={open} onClose={setOpen} className="relative z-50 lg:hidden">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-slate-900/40 transition duration-300 data-closed:opacity-0"
        />
        <DialogPanel
          transition
          className="fixed inset-y-0 right-0 w-full overflow-y-auto bg-primary-900 text-white shadow-2xl transition duration-300 ease-out data-closed:translate-x-full sm:max-w-sm"
        >
          <div className="flex items-center justify-between gap-x-6 px-4 py-3 sm:px-6">
            <Anchor
              href={homeHref}
              onClick={close}
              className="-m-1.5 rounded-md p-1.5 hover:opacity-80"
            >
              {logo}
            </Anchor>
            <button type="button" className={ICON_BUTTON} onClick={close}>
              <span className="sr-only">{closeText}</span>
              <XMarkIcon className="size-6" aria-hidden="true" />
            </button>
          </div>
          <ul className="mt-4 space-y-1 px-4 pb-8 sm:px-6">
            {links.map((link) => (
              <li key={link.id}>
                {link.href ? (
                  <Anchor
                    href={link.href}
                    newTab={link.newTab}
                    externalIcon
                    onClick={close}
                    className="-mx-3 flex items-center rounded-lg px-3 py-2 text-base font-semibold transition hover:bg-white/10"
                  >
                    {link.text}
                  </Anchor>
                ) : (
                  <p className="pt-4 pb-1 text-xs font-bold tracking-wider text-primary-200 uppercase">
                    {link.text}
                  </p>
                )}
                {link.children.length > 0 && (
                  <ul className="mb-2">
                    {link.children.map((child) => (
                      <li key={child.id}>
                        <Anchor
                          href={child.href}
                          newTab={child.newTab}
                          externalIcon
                          onClick={close}
                          className="-mx-3 flex items-center rounded-lg px-3 py-2 text-base text-primary-50 transition hover:bg-white/10 hover:text-white"
                        >
                          {child.text}
                        </Anchor>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
            {languageSwitch && (
              <li className="pt-4">
                <Anchor
                  href={languageSwitch.href}
                  onClick={close}
                  className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold text-primary-200 transition hover:bg-white/10 hover:text-white"
                >
                  {languageSwitch.text}
                </Anchor>
              </li>
            )}
            {ctaButton && (
              <li className="pt-6">
                <Anchor
                  href={ctaButton.href}
                  newTab={ctaButton.newTab}
                  onClick={close}
                  className={buttonClasses("white", "lg", "w-full")}
                >
                  {ctaButton.text}
                </Anchor>
              </li>
            )}
          </ul>
        </DialogPanel>
      </Dialog>
    </div>
  );
}
