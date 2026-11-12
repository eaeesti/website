import { draftMode } from "next/headers";
import type { ReactNode } from "react";
import type { StrapiGlobal } from "@/types/generated/strapi";
import type { Locale } from "@/utils/locale";
import { otherLocale, pagePath } from "@/utils/locale";
import { hasBlocksContent } from "@/utils/blocks";
import BlocksContent from "../elements/BlocksContent";
import { UiTextProvider } from "../elements/UiText";
import Banner from "./Banner";
import Footer from "./Footer";
import Navbar from "./Navbar";
import PreviewBanner from "./PreviewBanner";

interface SiteShellProps {
  global: StrapiGlobal | null;
  locale: Locale;
  /** This page's path, for leaving preview mode on the same page. */
  path: string;
  /** The same page in the other language; defaults to that language's home page. */
  alternatePath?: string | null;
  children: ReactNode;
}

/** A short, stable fingerprint of a string (djb2). */
function hashString(value: string): string {
  let hash = 5381;
  for (let i = 0; i < value.length; i++) {
    hash = ((hash << 5) + hash + value.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(36);
}

/** Navbar, footer and banners around every page. */
export default async function SiteShell({
  global,
  locale,
  path,
  alternatePath,
  children,
}: SiteShellProps) {
  const { isEnabled: preview } = await draftMode();
  const bannerText = global?.topBannerText;

  return (
    <UiTextProvider
      value={{
        close: global?.closeText ?? "Close",
        error: global?.errorText ?? "Something went wrong",
        emailCopied: global?.emailCopiedText ?? "Email address copied!",
        ...(locale === "et"
          ? {
              playVideo: "Vaata videot",
              listen: "Kuula",
              showEmbed: "Näita",
              embedNotice:
                "Laaditakse teenusest {service}, mis võib kasutada küpsiseid.",
            }
          : {
              playVideo: "Play video",
              listen: "Listen",
              showEmbed: "Show",
              embedNotice: "Loads from {service}, which may use cookies.",
            }),
      }}
    >
      {/* For keyboard users: the first Tab, past the whole menu. */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-md focus:bg-white focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-primary-800 focus:shadow-lg"
      >
        {locale === "et" ? "Liigu sisu juurde" : "Skip to content"}
      </a>
      {preview && (
        <PreviewBanner
          path={path}
          text={global?.previewText ?? "Preview"}
          exitText={global?.exitPreviewText ?? "Exit preview"}
        />
      )}
      {hasBlocksContent(bannerText) && (
        <Banner
          id={hashString(JSON.stringify(bannerText))}
          closeText={global?.closeText ?? "Close"}
        >
          <BlocksContent content={bannerText} />
        </Banner>
      )}
      <Navbar
        global={global}
        locale={locale}
        languageSwitchHref={alternatePath ?? pagePath("/", otherLocale(locale))}
      />
      <main id="main" className="flex flex-1 flex-col">
        {children}
      </main>
      <Footer global={global} />
    </UiTextProvider>
  );
}
