import type { StrapiCardsSection } from "@/types/generated/strapi";
import { classes } from "@/utils/react";
import Anchor from "../elements/Anchor";
import BlocksContent from "../elements/BlocksContent";
import StrapiImage from "../elements/StrapiImage";

export default function CardsSection({
  title,
  description,
  cards,
}: StrapiCardsSection) {
  return (
    <section className="bg-slate-50 px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        {(title || description) && (
          <div className="mx-auto mb-12 max-w-3xl text-center">
            {title && (
              <h2 className="text-3xl font-extrabold tracking-tight text-balance text-primary-800">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-4 text-lg text-slate-600">{description}</p>
            )}
          </div>
        )}
        <ul role="list" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <li
              key={card.id}
              className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-900/5"
            >
              {/* Shown whole and small: card images are usually icons. */}
              {card.image && (
                <div className="flex justify-center px-6 pt-8">
                  <StrapiImage
                    image={card.image}
                    sizes="20rem"
                    className="h-auto max-h-40 w-auto max-w-full"
                  />
                </div>
              )}
              <div
                className={classes(
                  "flex flex-1 flex-col p-6",
                  card.image && "text-center",
                )}
              >
                {card.label && (
                  <p className="mb-2 text-xs font-semibold tracking-wide text-primary-600 uppercase">
                    {card.label}
                  </p>
                )}
                <h3 className="text-lg font-bold text-primary-800">
                  {card.title}
                </h3>
                <BlocksContent
                  content={card.text}
                  className="prose-sm mt-3 flex-1"
                />
                {card.href && card.linkText && (
                  <Anchor
                    href={card.href}
                    className="mt-4 text-sm font-semibold text-primary-600 hover:text-primary-800"
                  >
                    {card.linkText} <span aria-hidden="true">→</span>
                  </Anchor>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
