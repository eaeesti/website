"use client";

import { useState, type ReactNode } from "react";
import { EMBED_SANDBOX } from "@/utils/embed";
import { buttonClasses } from "../elements/Button";

interface NewsletterFormProps {
  src: string;
  height: number;
  buttonText: string;
  /** The band's heading and text, replaced by the form once it loads. */
  children: ReactNode;
}

/**
 * Loads the signup form only when it's asked for. The form comes from
 * another site and brings Google's reCAPTCHA, which sets cookies; loading it
 * up front would set them for every visitor and call for a cookie banner.
 */
export default function NewsletterForm({
  src,
  height,
  buttonText,
  children,
}: NewsletterFormProps) {
  const [open, setOpen] = useState(false);

  if (open) {
    return (
      <iframe
        src={src}
        title={buttonText}
        height={height}
        sandbox={EMBED_SANDBOX}
        className="mx-auto block w-full max-w-5xl border-0"
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl py-16 text-center sm:py-20">
      {children}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={buttonClasses("white", "xl", "mt-10")}
      >
        {buttonText}
      </button>
    </div>
  );
}
