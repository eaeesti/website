import { ChevronDownIcon } from "@heroicons/react/24/outline";
import type { StrapiFaqSection } from "@/types/generated/strapi";
import { classes } from "@/utils/react";
import BlocksContent from "../elements/BlocksContent";

/** Uses <details>, so opening an answer needs no JavaScript. */
export default function FaqSection({ title, questions }: StrapiFaqSection) {
  return (
    <section className="px-4 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-3xl">
        {title && (
          <h2 className="mb-8 text-3xl font-extrabold tracking-tight text-primary-800">
            {title}
          </h2>
        )}
        <div className="divide-y divide-slate-200 border-y border-slate-200">
          {questions.map((question) => (
            <details key={question.id} className="group py-5">
              <summary
                className={classes(
                  "flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold text-slate-900 hover:text-primary-700 [&::-webkit-details-marker]:hidden",
                  // Plausible's tagged events: records opening this question.
                  question.plausibleEvent &&
                    `plausible-event-name=${question.plausibleEvent.trim().replace(/\s+/g, "+")}`,
                )}
              >
                {question.question}
                <ChevronDownIcon
                  className="size-5 shrink-0 transition group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>
              <BlocksContent content={question.answer} className="mt-4" />
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
