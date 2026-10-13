import type { StrapiCtaSection } from "@/types/generated/strapi";
import BlocksContent from "../elements/BlocksContent";
import ButtonGroup from "./ButtonGroup";

export default function CtaSection({
  title,
  description,
  buttons,
}: StrapiCtaSection) {
  return (
    <section className="bg-primary-600 px-4 py-16 text-white sm:px-6 sm:py-20">
      <div className="mx-auto max-w-3xl text-center">
        {title && (
          <h2 className="text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
            {title}
          </h2>
        )}
        <BlocksContent
          content={description}
          invert
          className="mx-auto mt-6 sm:prose-lg"
        />
        <ButtonGroup
          buttons={buttons}
          size="xl"
          className="mt-10 justify-center"
        />
      </div>
    </section>
  );
}
