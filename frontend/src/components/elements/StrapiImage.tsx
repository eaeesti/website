import NextImage, { type ImageProps } from "next/image";
import type { StrapiMedia } from "@/types/generated/strapi";
import type { BlocksImage } from "@/types/blocks";

interface StrapiImageProps {
  image: StrapiMedia | BlocksImage | null | undefined;
  className?: string;
  /** Fill the positioned parent instead of using the image's own size. */
  fill?: boolean;
  /**
   * The page's main image, usually its largest (LCP): fetched at once and
   * ahead of everything else.
   */
  priority?: boolean;
  /** Above the fold but not the main image, like the logo: fetched at once. */
  eager?: boolean;
  /** The rendered width, for picking the right size, e.g. "(min-width: 1024px) 50vw, 100vw". */
  sizes?: string;
  /** Overrides the image's own alt text, e.g. "" for a decorative image. */
  alt?: string;
}

/**
 * An image uploaded to Strapi. Its URL is a path like /uploads/x.jpg, which
 * the site proxies to Strapi, so Next.js resizes it like a local image.
 */
export default function StrapiImage({
  image,
  className,
  fill = false,
  priority = false,
  eager = false,
  sizes,
  alt,
}: StrapiImageProps) {
  if (!image?.url) return null;

  // Next.js 16 deprecates `priority`, and recommends fetchPriority over its
  // `preload` for the main image.
  const loading: Pick<ImageProps, "loading" | "fetchPriority"> =
    priority || eager
      ? { loading: "eager", fetchPriority: priority ? "high" : undefined }
      : {};

  const altText = alt ?? image.alternativeText ?? "";
  // SVGs are already resolution-independent; Next.js won't process them.
  const unoptimized =
    image.mime === "image/svg+xml" || image.url.endsWith(".svg");

  if (fill) {
    return (
      <NextImage
        src={image.url}
        alt={altText}
        fill
        sizes={sizes ?? "100vw"}
        {...loading}
        unoptimized={unoptimized}
        className={className}
      />
    );
  }

  // Without stored dimensions, let the browser size it from the file.
  if (!image.width || !image.height) {
    return (
      <NextImage
        src={image.url}
        alt={altText}
        width={0}
        height={0}
        sizes={sizes ?? "100vw"}
        {...loading}
        unoptimized={unoptimized}
        className={className}
        style={{ width: "auto", height: "auto", maxWidth: "100%" }}
      />
    );
  }

  return (
    <NextImage
      src={image.url}
      alt={altText}
      width={image.width}
      height={image.height}
      sizes={sizes}
      {...loading}
      unoptimized={unoptimized}
      className={className}
    />
  );
}
