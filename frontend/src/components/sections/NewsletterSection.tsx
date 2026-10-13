import type { StrapiNewsletterSection } from "@/types/generated/strapi";
import { toEmbedUrl } from "@/utils/embed";
import BlocksContent from "../elements/BlocksContent";
import NewsletterForm from "./NewsletterForm";

/** A blue band inviting people to subscribe; see NewsletterForm. */
export default function NewsletterSection({
  title,
  text,
  buttonText,
  formUrl,
  formHeight,
}: StrapiNewsletterSection) {
  const src = toEmbedUrl(formUrl);
  if (!src) return null;

  return (
    // Pages link to the signup as /#uudiskiri ("newsletter").
    <section id="uudiskiri" className="bg-primary-600 px-4 text-white sm:px-6">
      <NewsletterForm
        src={src}
        height={formHeight ?? 420}
        buttonText={buttonText}
      >
        {title && (
          <h2 className="text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
            {title}
          </h2>
        )}
        <BlocksContent
          content={text}
          invert
          className="mx-auto mt-6 sm:prose-lg"
        />
      </NewsletterForm>
    </section>
  );
}
