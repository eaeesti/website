"use client";

import { useState, type FormEvent } from "react";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { buttonClasses } from "../elements/Button";

interface ContactFormProps {
  labels: {
    name: string;
    email: string;
    message: string;
    send: string;
    successTitle: string;
    successDescription: string;
    error: string;
  };
}

type Status = "idle" | "sending" | "sent" | "error";

const inputClass =
  "mt-2 block w-full rounded-md border-0 px-3.5 py-2 text-slate-900 shadow-sm ring-1 ring-slate-300 ring-inset placeholder:text-slate-400 focus:ring-2 focus:ring-primary-600 focus:ring-inset sm:text-sm sm:leading-6";

/** Posts straight to Strapi's /api/contact, which saves and forwards it. */
export default function ContactForm({ labels }: ContactFormProps) {
  const [status, setStatus] = useState<Status>("idle");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setStatus("sending");
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/contact`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(Object.fromEntries(new FormData(form))),
        },
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      form.reset();
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  // The wrapper stays mounted, so screen readers announce the thank-you
  // message when it replaces the form.
  return (
    <div aria-live="polite">
      {status === "sent" ? (
        <>
          <CheckCircleIcon
            className="size-10 text-green-600"
            aria-hidden="true"
          />
          <h3 className="mt-4 text-xl font-bold text-slate-900">
            {labels.successTitle}
          </h3>
          <p className="mt-2 text-slate-600">{labels.successDescription}</p>
        </>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-5">
          <div>
            <label
              htmlFor="contact-name"
              className="block text-sm font-semibold text-slate-900"
            >
              {labels.name}
            </label>
            <input
              id="contact-name"
              name="name"
              type="text"
              autoComplete="name"
              required
              maxLength={200}
              className={inputClass}
            />
          </div>
          <div>
            <label
              htmlFor="contact-email"
              className="block text-sm font-semibold text-slate-900"
            >
              {labels.email}
            </label>
            <input
              id="contact-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              className={inputClass}
            />
          </div>
          <div>
            <label
              htmlFor="contact-message"
              className="block text-sm font-semibold text-slate-900"
            >
              {labels.message}
            </label>
            <textarea
              id="contact-message"
              name="message"
              rows={5}
              required
              maxLength={5000}
              className={inputClass}
            />
          </div>
          {/* Hidden from people; bots that fill in every field fill this in too. */}
          <div className="hidden" aria-hidden="true">
            <label htmlFor="contact-website">Website</label>
            <input
              id="contact-website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>
          {status === "error" && (
            <p className="text-sm font-semibold text-red-700" role="alert">
              {labels.error}
            </p>
          )}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={status === "sending"}
              className={buttonClasses("primary", "md")}
            >
              {labels.send}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
