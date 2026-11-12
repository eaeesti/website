/**
 * Origins allowed to embed or call this Strapi: the public site, plus any
 * extra ones from CORS_ORIGINS (comma-separated). Parsed by hand rather than
 * with env.array(): that falls back to the default only when the key is
 * absent, so a bare `CORS_ORIGINS=` would resolve to [""] and match nothing.
 */
function frontendOrigins(env) {
  const extra = env("CORS_ORIGINS", "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  return [
    "https://efektiivnealtruism.org",
    "https://www.efektiivnealtruism.org",
    env("FRONTEND_URL", "http://localhost:3000"),
    "http://localhost:3000",
    ...extra,
  ];
}

module.exports = ({ env }) => [
  "strapi::logger",
  "strapi::errors",
  // Brotli or gzip, for the admin's 5 MB script above all: uncompressed it
  // took seconds to load. Browsers then keep it until the next deploy.
  "strapi::compression",
  {
    name: "strapi::security",
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          "connect-src": ["'self'", "https:"],
          "img-src": ["'self'", "data:", "blob:", "market-assets.strapi.io"],
          "media-src": ["'self'", "data:", "blob:"],
          // The content manager's preview panel frames the frontend.
          "frame-src": ["'self'", ...frontendOrigins(env)],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  {
    name: "strapi::cors",
    config: {
      // Strapi's default reflects any Origin back with credentials. The only
      // browser caller is the contact form, which sends no cookies.
      origin: frontendOrigins(env),
      credentials: false,
    },
  },
  "global::rate-limit",
  "strapi::query",
  "strapi::body",
  // Admin login with Google instead of passwords, once it's configured.
  "global::google-login",
  "strapi::session",
  "strapi::favicon",
  "strapi::public",
];
