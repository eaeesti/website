"use client";

import { createContext, useContext, type ReactNode } from "react";

/** Interface texts from the site settings that client components need. */
export interface UiTexts {
  close: string;
  error: string;
  emailCopied: string;
  /** The buttons of embeds that load only when clicked (ClickToLoad). */
  playVideo: string;
  listen: string;
  showEmbed: string;
  /** Under those buttons; {service} is replaced with e.g. "YouTube". */
  embedNotice: string;
}

const UiTextContext = createContext<UiTexts>({
  close: "Close",
  error: "Something went wrong",
  emailCopied: "Email address copied!",
  playVideo: "Play video",
  listen: "Listen",
  showEmbed: "Show",
  embedNotice: "Loads from {service}, which may use cookies.",
});

export function UiTextProvider({
  value,
  children,
}: {
  value: UiTexts;
  children: ReactNode;
}) {
  return <UiTextContext value={value}>{children}</UiTextContext>;
}

export function useUiText(): UiTexts {
  return useContext(UiTextContext);
}
