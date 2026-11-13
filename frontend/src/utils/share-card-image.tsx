import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import {
  SHARE_CARD_SIZE,
  type ShareCard,
  shorten,
  titleFontSize,
} from "./share-card";
import { getUpload } from "./strapi";

const { width, height } = SHARE_CARD_SIZE;

type Fonts = NonNullable<
  NonNullable<ConstructorParameters<typeof ImageResponse>[1]>["fonts"]
>;

/**
 * The image renderer (Satori) takes neither WOFF2 nor variable fonts, so the
 * cards use static WOFF files of the site's fonts. Each comes in two files,
 * Latin and Latin Extended (š, ž), which need different names: of two fonts
 * with one name, Satori only uses the first.
 */
function readFont(packageName: string, file: string) {
  return readFile(
    join(process.cwd(), "node_modules", packageName, "files", file),
  );
}

async function loadAssets() {
  const [raleway, ralewayExt, merriweather, merriweatherExt, logo] =
    await Promise.all([
      readFont("@fontsource/raleway", "raleway-latin-800-normal.woff"),
      readFont("@fontsource/raleway", "raleway-latin-ext-800-normal.woff"),
      readFont(
        "@fontsource/merriweather",
        "merriweather-latin-300-normal.woff",
      ),
      readFont(
        "@fontsource/merriweather",
        "merriweather-latin-ext-300-normal.woff",
      ),
      // The navbar's white logo, at twice the size it's drawn.
      readFile(join(process.cwd(), "assets/share-card/logo.png")),
    ]);
  const fonts: Fonts = [
    { name: "Raleway", data: raleway, weight: 800, style: "normal" },
    { name: "Raleway Ext", data: ralewayExt, weight: 800, style: "normal" },
    { name: "Merriweather", data: merriweather, weight: 300, style: "normal" },
    {
      name: "Merriweather Ext",
      data: merriweatherExt,
      weight: 300,
      style: "normal",
    },
  ];
  return { fonts, logo: `data:image/png;base64,${logo.toString("base64")}` };
}

let assets: ReturnType<typeof loadAssets> | undefined;

/**
 * The photo cropped to the card, a little above its middle like the hero's,
 * as a JPEG: the renderer can't read WebP, which most uploads are. Null if
 * there's no photo or it can't be read, for a plain blue card.
 */
async function photoDataUrl(url: string | null): Promise<string | null> {
  const file = url ? await getUpload(url) : null;
  if (!file) return null;
  try {
    const { data, info } = await sharp(file)
      .rotate()
      .resize({ width, height, fit: "outside" })
      .raw()
      .toBuffer({ resolveWithObject: true });
    const jpeg = await sharp(data, {
      raw: { width: info.width, height: info.height, channels: info.channels },
    })
      .extract({
        left: Math.floor((info.width - width) / 2),
        top: Math.floor((info.height - height) * 0.4),
        width,
        height,
      })
      .jpeg({ quality: 85 })
      .toBuffer();
    return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
  } catch {
    return null;
  }
}

// No textWrap: "balance": in Satori it pushes text that fits on one line
// off centre.
function cardElement(card: ShareCard, logo: string, photo: string | null) {
  const title = shorten(card.title, 110);
  const subtitle = card.subtitle ? shorten(card.subtitle, 150) : null;
  return (
    <div
      style={{
        width,
        height,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "112px 90px 40px",
        // primary-800, lighter in the middle where there's no photo. (Satori
        // fails on a style that is present but undefined.)
        backgroundColor: "#0b3f6f",
        ...(photo
          ? {}
          : {
              backgroundImage:
                "radial-gradient(circle at 50% 45%, #0158a3 0%, #0b3f6f 55%, #00213f 100%)",
            }),
      }}
    >
      {photo && (
        // eslint-disable-next-line @next/next/no-img-element -- drawn by Satori, not a page
        <img
          src={photo}
          alt=""
          width={width}
          height={height}
          style={{ position: "absolute", top: 0, left: 0 }}
        />
      )}
      {photo && (
        // The hero's primary-900 at 70%, a little deeper behind the words.
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width,
            height,
            display: "flex",
            backgroundColor: "rgba(0, 51, 102, 0.72)",
            backgroundImage:
              "radial-gradient(circle at 50% 54%, rgba(0, 33, 63, 0.45) 0%, rgba(0, 33, 63, 0) 60%)",
          }}
        />
      )}
      <div
        style={{
          position: "absolute",
          top: 46,
          left: 0,
          width,
          display: "flex",
          justifyContent: "center",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- drawn by Satori, not a page */}
        <img src={logo} alt="" width={356} height={66} />
      </div>
      <div
        style={{
          display: "flex",
          textAlign: "center",
          fontFamily: "Raleway, Raleway Ext",
          fontWeight: 800,
          fontSize: titleFontSize(title),
          lineHeight: 1.08,
          letterSpacing: "-0.025em",
          color: "#ffffff",
        }}
      >
        {title}
      </div>
      {subtitle && (
        <div
          style={{
            display: "flex",
            maxWidth: 900,
            marginTop: 26,
            textAlign: "center",
            fontFamily: "Merriweather, Merriweather Ext",
            fontWeight: 300,
            fontSize: 28,
            lineHeight: 1.5,
            color: "#f0f7ff",
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
}

/**
 * The card as a JPEG: the renderer only makes PNGs, which are several times
 * larger for a photo, and WhatsApp skips large preview images.
 */
export async function shareCardResponse(card: ShareCard): Promise<Response> {
  assets ??= loadAssets();
  const [{ fonts, logo }, photo] = await Promise.all([
    assets,
    photoDataUrl(card.photo),
  ]);
  const png = await new ImageResponse(cardElement(card, logo, photo), {
    width,
    height,
    fonts,
  }).arrayBuffer();
  const jpeg = await sharp(Buffer.from(png))
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
  return new Response(new Uint8Array(jpeg), {
    headers: { "Content-Type": "image/jpeg" },
  });
}
