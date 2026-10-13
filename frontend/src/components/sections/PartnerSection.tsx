import type { StrapiPartnerSection } from "@/types/generated/strapi";
import BlocksContent from "../elements/BlocksContent";
import StrapiImage from "../elements/StrapiImage";

/** A round badge next to a short text, as on annetatargalt.ee. */
export default function PartnerSection({ text, image }: StrapiPartnerSection) {
  return (
    <section className="bg-primary-600 px-4 py-12 md:px-8">
      {/* Side by side only when there's room for the text on one line. */}
      <div className="mx-auto flex max-w-4xl flex-col items-center justify-center gap-6 text-center lg:flex-row lg:gap-10 lg:text-left">
        <div className="shrink-0 rounded-full bg-white p-4 shadow-md shadow-primary-900/20">
          <StrapiImage image={image} sizes="8rem" className="size-32" />
        </div>
        <BlocksContent content={text} invert className="max-w-none" />
      </div>
    </section>
  );
}
