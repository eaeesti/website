import type { StrapiTextImageSection } from "@/types/generated/strapi";
import { classes } from "@/utils/react";
import BlocksContent from "../elements/BlocksContent";
import MediaPlayer from "../elements/MediaPlayer";
import StrapiImage from "../elements/StrapiImage";
import { mediaEmbed } from "@/utils/embed";
import ButtonGroup from "./ButtonGroup";

/** Images narrower than this are badges or logos, shown as they are. */
const SMALL_IMAGE_WIDTH = 400;

export default function TextImageSection({
  title,
  text,
  image,
  videoUrl,
  imagePosition,
  background,
  buttons,
}: StrapiTextImageSection) {
  const blue = background === "blue";
  const onColour = Boolean(background) && background !== "white";
  const sectionClass = classes(
    "px-4 py-12 sm:px-6 sm:py-16",
    background === "grey" && "bg-slate-100",
    background === "light" && "bg-primary-50",
    blue && "bg-primary-600 text-white",
  );
  // A video, when given, takes the image's place.
  const video = mediaEmbed(videoUrl);
  const small =
    !video && image?.width ? image.width <= SMALL_IMAGE_WIDTH : false;
  const media = video ? (
    <MediaPlayer embed={video} className="shadow-lg" />
  ) : image ? (
    <StrapiImage
      image={image}
      sizes={small ? `${image.width}px` : "(min-width: 1024px) 36rem, 100vw"}
      className={
        small
          ? classes(
              "mx-auto h-auto w-auto max-w-full",
              // Badges and logos sit on a white card on coloured backgrounds.
              onColour && "rounded-2xl bg-white p-4 shadow-sm",
            )
          : "h-auto w-full rounded-2xl shadow-lg"
      }
    />
  ) : null;

  const content = (
    <>
      {title && (
        <h2
          className={classes(
            "text-3xl font-extrabold tracking-tight text-balance",
            blue ? "text-white" : "text-primary-800",
          )}
        >
          {title}
        </h2>
      )}
      <BlocksContent
        content={text}
        invert={blue}
        className={title ? "mt-6" : undefined}
      />
      <ButtonGroup buttons={buttons} className="mt-8" />
    </>
  );

  // Without a picture the text gets the same column as a text section.
  if (!media) {
    return (
      <section className={sectionClass}>
        <div className="mx-auto max-w-3xl">{content}</div>
      </section>
    );
  }

  return (
    <section className={sectionClass}>
      <div
        className={classes(
          "mx-auto flex flex-col items-center gap-10 lg:gap-16",
          small ? "max-w-3xl" : "max-w-6xl",
          imagePosition === "left" ? "lg:flex-row-reverse" : "lg:flex-row",
        )}
      >
        <div className="w-full lg:flex-1">{content}</div>
        <div className={classes("w-full", small ? "lg:w-auto" : "lg:flex-1")}>
          {media}
        </div>
      </div>
    </section>
  );
}
