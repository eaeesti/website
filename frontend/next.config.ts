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
      // Plausible, proxied so the browser only ever talks to this origin.
      {
        source: "/js/script.js",
        destination: "https://plausible.io/js/script.tagged-events.js",
      },
      {
        source: "/api/event",
        destination: "https://plausible.io/api/event",
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
    ];
  },
};

export default nextConfig;
