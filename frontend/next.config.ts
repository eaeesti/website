import type { NextConfig } from "next";
import { DONATION_API_URL } from "./src/utils/donation";
import { EMBED_ORIGINS } from "./src/utils/embed";

// Where the Next.js server reaches Strapi (loopback in production).
const strapiUrl = process.env.STRAPI_URL ?? "http://127.0.0.1:1337";

// Where browsers reach Strapi: the contact form posts there, and the content
// manager on that origin frames the site for previews.
const strapiPublicOrigin = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_STRAPI_URL ?? "").origin;
  } catch {
    return "https://cms.efektiivnealtruism.org";
  }
})();

// Dev needs eval (React's callstack rebuilding, source maps) and a websocket
// for HMR. Both are added only here, so `next build && next start` locally
// still exercises the production policy.
// The donation form posts to Anneta Targalt's backend.
const donationApiOrigin = new URL(DONATION_API_URL).origin;

const isDev = process.env.NODE_ENV !== "production";

// Blog posts and pages are written by editors in Strapi. The blocks renderer
// never outputs raw HTML, so this policy is the second layer: it limits where
// anything injected could send data. 'unsafe-inline' stays in script-src
// because Next streams its payload through inline scripts, and nonces would
// force every page to render per request.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  // Podcast episodes play from Spotify for Creators (anchor.fm redirects to
  // CloudFront).
  "media-src 'self' https://anchor.fm https://*.cloudfront.net",
  "font-src 'self' data:",
  `connect-src 'self' ${strapiPublicOrigin} ${donationApiOrigin}${isDev ? " ws:" : ""}`,
  `frame-src ${EMBED_ORIGINS.join(" ")}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  // The content manager's preview panel frames the site.
  `frame-ancestors 'self' ${strapiPublicOrigin}`,
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
];

const nextConfig: NextConfig = {
  // A self-contained server in .next/standalone, built in CI and copied to
  // the VPS, so the server never needs the frontend's node_modules. As this
  // is a pnpm workspace, the server is at .next/standalone/frontend/server.js.
  // The production image runs `next start` instead, because it's
  // built on another CPU architecture than it runs on, and turns this off.
  output: process.env.NEXT_STANDALONE === "false" ? undefined : "standalone",

  reactCompiler: true,

  // No "X-Powered-By: Next.js": nobody needs it, and it tells scanners which
  // advisories to try.
  poweredByHeader: false,

  images: {
    // Uploads are converted to WebP in the sizes the srcsets ask for. Their
    // file names include a hash, so a converted image can be kept a month.
    formats: ["image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 31,
    // Podcast episode covers, from the podcast's RSS feed.
    remotePatterns: [
      { protocol: "https", hostname: "d3t3ozftmdmh3i.cloudfront.net" },
    ],
  },

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },

  async rewrites() {
    return [
      // Uploaded files live in Strapi. Serving them from the site's own
      // origin keeps image URLs stable and lets next/image treat them as
      // local images, fetched from Strapi over loopback.
      {
        source: "/uploads/:path*",
        destination: `${strapiUrl}/uploads/:path*`,
      },
    ];
  },

  async redirects() {
    return [
      // Estonian is the default language and has no prefix; only English
      // pages live under one (/en).
      { source: "/et", destination: "/", permanent: true },
      { source: "/et/:path*", destination: "/:path*", permanent: true },
      // URLs from the old Webflow site.
      { source: "/en/landing", destination: "/en", permanent: true },
      ...wordpressRedirects,
    ];
  },
};

/**
 * URLs from the WordPress site before Webflow (2017–2020), as the Wayback
 * Machine has them, so links to it from elsewhere still lead somewhere. The
 * first match wins, so the exceptions come before the general rules. Seven
 * posts never moved on from WordPress; theirs go to the nearest page.
 */
const wordpressRedirects = [
  // Pages, some under /index.php/ too.
  ...[
    ["/about", "/meist"],
    ["/about/the-team", "/meist"],
    ["/tegevuskava", "/meist"],
    ["/vaartused", "/meist"],
    ["/contact", "/kontakt"],
    ["/kkk", "/tutvustus"],
    ["/toeta", "/anneta"],
    ["/vota-osa", "/tule-vabatahtlikuks"],
    ["/oppematerjalid", "/materjalid"],
    ["/kalender", "/uritused"],
    ["/hackathon", "/uritused"],
    ["/en/calendar", "/en/events"],
    ["/newsletter", "/"],
    ["/karjaar/test", "/karjaar"],
  ].flatMap(([source, destination]) => [
    { source, destination, permanent: true },
    { source: `/index.php${source}`, destination, permanent: true },
  ]),
  { source: "/index.php/:path*", destination: "/:path*", permanent: true },

  // Posts whose address changed, or that live on as something else.
  ...[
    [
      "kas-oma-kire-jargimine-hea-karjaarinouanne",
      "/blogi/kas-oma-kire-jargimine-on-hea-karjaarinouanne",
    ],
    [
      "kes-efektiivsed-altruistid-ja-kuidas-nad-maailma-paremaks-muudavad",
      "/blogi/kes-on-efektiivsed-altruistid-ja-kuidas-nad-maailma-paremaks-muudavad",
    ],
    ["efektiivse-altruismi-oppematerjalid", "/materjalid"],
    ["efektiivse-altruismi-tutvustus", "/tutvustus"],
    [
      "vabatahtlikud-tegevused-efektiivne-altruism-eesti-ridades",
      "/tule-vabatahtlikuks",
    ],
    // The series' later parts weren't moved; its first post stands for them.
    ...[4, 5, 6, 7].map((part) => [
      `kuidas-teha-head-paremini-${part}-osa`,
      "/blogi/kuidas-teha-head-paremini",
    ]),
    ["erakordselt-lihtsad-meetodid-hea-tegemiseks", "/blogi"],
    ["kuidas-valida-sobiv-valdkond-heategevuseks", "/blogi"],
    ["risto-uuk-tarbimiskeskne-eluviis-mind-ei-paelu", "/blogi"],
  ].map(([slug, destination]) => ({
    source: `/:year(\\d{4})/:month(\\d{2})/:day(\\d{2})/${slug}`,
    destination,
    permanent: true,
  })),
  // Every other post kept its address after the date: /2019/03/07/slug.
  {
    source: "/:year(\\d{4})/:month(\\d{2})/:day(\\d{2})/:slug",
    destination: "/blogi/:slug",
    permanent: true,
  },
  // Monthly archives, the blog's later pages, and authors' pages.
  {
    source: "/:year(\\d{4})/:month(\\d{2})",
    destination: "/blogi",
    permanent: true,
  },
  { source: "/blogi/page/:page(\\d+)", destination: "/blogi", permanent: true },
  { source: "/author/:path*", destination: "/blogi", permanent: true },

  // Categories are topics now, mostly under the same name.
  {
    source: "/category/areng/:rest*",
    destination: "/rubriik/eneseareng",
    permanent: true,
  },
  {
    source: "/category/podcast/:rest*",
    destination: "/taskuhaaling",
    permanent: true,
  },
  {
    source: "/category/:slug/:rest*",
    destination: "/rubriik/:slug",
    permanent: true,
  },
];

export default nextConfig;
