import type { StrapiTestimonialsSection } from "@/types/generated/strapi";
import { blocksTextLength } from "@/utils/blocks";
import { balanceColumns } from "@/utils/columns";
import { classes } from "@/utils/react";
import BlocksContent from "../elements/BlocksContent";
import StrapiImage from "../elements/StrapiImage";

export default function TestimonialsSection({
  title,
  testimonials,
}: StrapiTestimonialsSection) {
  // A single quote gets the whole width and a bigger photo.
  const single = testimonials.length === 1;
  // A card's height is roughly its text plus the padding and caption.
  const columns = balanceColumns(
    testimonials.map((testimonial, index) => ({ testimonial, index })),
    ({ testimonial }) => blocksTextLength(testimonial.text) + 300,
  ).filter((column) => column.length > 0);
  return (
    <section className="bg-primary-50 px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        {title && (
          <h2 className="mb-12 text-center text-3xl font-extrabold tracking-tight text-primary-800">
            {title}
          </h2>
        )}
        <div
          className={classes(
            "flex flex-col gap-6",
            single ? "mx-auto max-w-3xl" : "md:flex-row md:items-start",
          )}
        >
          {columns.map((column, columnIndex) => (
            <div
              key={columnIndex}
              // Below md, the columns' cards are laid out as one list.
              className="contents md:flex md:flex-1 md:flex-col md:gap-6"
            >
              {column.map(({ testimonial, index }) => (
                <figure
                  key={testimonial.id}
                  // Keeps the order when the columns stack on small screens.
                  style={{ order: index }}
                  className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-900/5"
                >
                  <blockquote>
                    <BlocksContent
                      content={testimonial.text}
                      className={classes("font-serif", single && "prose-lg")}
                    />
                  </blockquote>
                  <figcaption className="mt-6 flex items-center gap-4">
                    <div
                      className={classes(
                        "relative flex flex-none items-center justify-center overflow-hidden rounded-full bg-primary-100 font-bold text-primary-700",
                        single ? "size-20 text-2xl" : "size-14 text-lg",
                      )}
                    >
                      {testimonial.image ? (
                        <StrapiImage
                          image={testimonial.image}
                          fill
                          sizes={single ? "5rem" : "3.5rem"}
                          className="object-cover"
                        />
                      ) : (
                        // Until there's a photo: the person's initials.
                        <span aria-hidden="true">
                          {initials(testimonial.name)}
                        </span>
                      )}
                    </div>
                    <div className="text-sm">
                      <div className="font-bold text-slate-900">
                        {testimonial.name}
                      </div>
                      {testimonial.role && (
                        <div className="text-slate-600">{testimonial.role}</div>
                      )}
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** "Will MacAskill" → "WM" */
function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toLocaleUpperCase())
    .slice(0, 2)
    .join("");
}
