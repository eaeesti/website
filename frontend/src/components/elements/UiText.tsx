"use client";

import { createContext, useContext, type ReactNode } from "react";

/** Interface texts from the site settings that client components need. */
export interface UiTexts {
  close: string;
  error: string;
  emailCopied: string;
}

const UiTextContext = createContext<UiTexts>({
  close: "Close",
  error: "Something went wrong",
  emailCopied: "Email address copied!",
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
