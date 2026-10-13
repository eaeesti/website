"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { XMarkIcon } from "@heroicons/react/20/solid";

const DISMISSED_KEY = "topBannerDismissed";
const listeners = new Set<() => void>();

function readDismissed(): string | null {
  try {
    return localStorage.getItem(DISMISSED_KEY);
  } catch {
    return null;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

interface BannerProps {
  /** Identifies the banner's current text, so a new announcement shows again. */
  id: string;
  closeText: string;
  children: ReactNode;
}

/** A dismissible announcement above the navbar. */
export default function Banner({ id, closeText, children }: BannerProps) {
  // The server can't see localStorage, so it always renders the banner;
  // useSyncExternalStore hides it after hydration without a mismatch.
  const dismissedId = useSyncExternalStore(
    subscribe,
    readDismissed,
    () => null,
  );
  if (dismissedId === id) return null;

  return (
    <div className="flex items-center gap-4 bg-primary-600 px-4 py-2 text-white sm:px-6">
      <div className="min-w-0 flex-1 text-sm [&_.prose]:max-w-none [&_.prose]:text-white [&_a]:font-semibold [&_a]:text-white [&_a]:underline [&_p]:my-0">
        {children}
      </div>
      <button
        type="button"
        className="rounded-md p-1.5 hover:bg-primary-700"
        onClick={() => {
          try {
            localStorage.setItem(DISMISSED_KEY, id);
          } catch {
            // Storage unavailable: the banner just comes back next time.
          }
          listeners.forEach((listener) => listener());
        }}
      >
        <span className="sr-only">{closeText}</span>
        <XMarkIcon className="size-5" aria-hidden="true" />
      </button>
    </div>
  );
}
