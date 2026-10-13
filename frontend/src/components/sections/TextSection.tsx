import type { StrapiTextSection } from "@/types/generated/strapi";
import BlocksContent from "../elements/BlocksContent";

export default function TextSection({ text }: StrapiTextSection) {
  return (
    <section className="px-4 py-10 sm:px-6 sm:py-14">
      <BlocksContent
        content={text}
        className="mx-auto w-full max-w-3xl sm:prose-lg"
      />
    </section>
  );
}
