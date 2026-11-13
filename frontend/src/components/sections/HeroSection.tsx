import type { StrapiHeroSection } from "@/types/generated/strapi";
import StrapiImage from "../elements/StrapiImage";
import ButtonGroup from "./ButtonGroup";
import type { SectionContext } from "./types";

export default function HeroSection({
  title,
  subtitle,
  image,
  buttons,
  context,
}: StrapiHeroSection & { context: SectionContext }) {
  return (
    <section
      data-nav-overlay
      className="relative isolate overflow-hidden bg-primary-800"
    >
      {image && (
        <>
          <StrapiImage
            image={image}
            alt=""
            fill
            priority={context.isFirst}
            // A little above the middle, where people's faces usually are.
            className="-z-10 object-cover object-[center_40%]"
          />
          <div
            className="absolute inset-0 -z-10 bg-primary-900/70"
            aria-hidden="true"
          />
        </>
      )}
      {/* Fills the window, under the transparent navbar, up to 900px or half
          the window's width, whichever is more: a wide but short hero would
          crop the photo down to a strip and cut off people's heads. */}
      <div className="mx-auto flex min-h-[min(100svh,max(900px,50vw))] max-w-5xl flex-col items-center justify-center px-4 pt-[calc(var(--nav-height)+3rem)] pb-16 text-center">
        <h1 className="text-5xl font-extrabold tracking-tight text-balance text-white sm:text-7xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-6 max-w-3xl font-serif text-lg leading-8 font-light text-balance text-primary-50 sm:text-2xl sm:leading-10">
            {subtitle}
          </p>
        )}
        <ButtonGroup
          buttons={buttons}
          size="xl"
          className="mt-12 justify-center"
        />
      </div>
    </section>
  );
}
