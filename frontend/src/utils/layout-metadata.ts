import type { Metadata } from "next";
import type { Locale } from "./locale";
import { getGlobal } from "./strapi";
import { siteUrl } from "./url";

/** Site-wide metadata for a root layout: title template, icons, defaults. */
export async function layoutMetadata(locale: Locale): Promise<Metadata> {
  const global = await getGlobal(locale).catch(() => null);
  const siteName = global?.siteName ?? "Efektiivne Altruism Eesti";

  return {
    metadataBase: new URL(siteUrl()),
    title: { default: siteName, template: `%s • ${siteName}` },
    description: global?.metadata?.description ?? undefined,
    icons: {
      ...(global?.favicon ? { icon: global.favicon.url } : {}),
      ...(global?.appleTouchIcon ? { apple: global.appleTouchIcon.url } : {}),
    },
  };
}
