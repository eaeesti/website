import type { ReactNode } from "react";
import { DONATION_API_URL } from "@/utils/donation";
import type { Locale } from "@/utils/locale";

/**
 * Where the site's analytics go: the Plausible and Umami on Anneta Targalt's
 * server, at its backend's address, which the content security policy already
 * allows for donations.
 */
const ANALYTICS_ORIGIN = new URL(DONATION_API_URL).origin;

/** The <html> and <body> shared by the Estonian and English root layouts. */
export default function RootHtml({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const plausibleDomain = process.env.PLAUSIBLE_DOMAIN;
  const umamiWebsiteId = process.env.UMAMI_WEBSITE_ID;

  return (
    <html lang={locale} className="h-full">
      {(plausibleDomain || umamiWebsiteId) && (
        // A plain <head> is how the App Router adds to the document head;
        // this lint rule is meant for the Pages Router.
        // eslint-disable-next-line @next/next/no-head-element
        <head>
          {plausibleDomain && (
            // Plausible for the overview, with tagged events (buttons and
            // questions with an id in the CMS) and outbound links. A pinned
            // copy served from here, so the analytics server can't change
            // what runs on the site.
            <script
              defer
              src="/js/plausible-tagged-events-outbound-links-37.js"
              data-domain={plausibleDomain}
              data-api={`${ANALYTICS_ORIGIN}/p/api/event`}
            />
          )}
          {umamiWebsiteId && (
            <>
              {/* Umami beside it, pinned the same way. The hook before it
                  leaves query strings out of what's sent. */}
              <script defer src="/js/umami-before-send.js" />
              <script
                defer
                src="/js/umami-3.4.1.js"
                data-website-id={umamiWebsiteId}
                data-host-url={`${ANALYTICS_ORIGIN}/u`}
                data-before-send="umamiBeforeSend"
              />
            </>
          )}
        </head>
      )}
      <body className="flex min-h-full flex-col bg-white font-sans text-slate-800 antialiased">
        {children}
      </body>
    </html>
  );
}
