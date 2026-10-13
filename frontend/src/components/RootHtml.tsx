import type { ReactNode } from "react";
import PlausibleProvider from "next-plausible";
import type { Locale } from "@/utils/locale";

/** The <html> and <body> shared by the Estonian and English root layouts. */
export default function RootHtml({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const plausibleDomain = process.env.PLAUSIBLE_DOMAIN;

  return (
    <html lang={locale} className="h-full">
      {plausibleDomain && (
        // A plain <head> is how the App Router adds to the document head;
        // this lint rule is meant for the Pages Router.
        // eslint-disable-next-line @next/next/no-head-element
        <head>
          <PlausibleProvider
            domain={plausibleDomain}
            trackOutboundLinks
            scriptProps={
              {
                src: "/js/script.js",
                "data-api": "/api/event",
              } as React.ComponentPropsWithoutRef<"script">
            }
          />
        </head>
      )}
      <body className="flex min-h-full flex-col bg-white font-sans text-slate-800 antialiased">
        {children}
      </body>
    </html>
  );
}
