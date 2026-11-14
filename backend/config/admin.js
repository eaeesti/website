/** Where each previewable content type lives on the public site. */
function pagePath(slug, locale) {
  const prefix = locale === "en" ? "/en" : "";
  if (!slug || slug === "/") return prefix || "/";
  return `${prefix}/${slug}`;
}

const PREVIEW_PATHS = {
  "api::page.page": (document, locale) => pagePath(document.slug, locale),
  "api::blog-post.blog-post": (document) => `/blogi/${document.slug}`,
  "api::blog-category.blog-category": (document) => `/rubriik/${document.slug}`,
  "api::global.global": (_document, locale) => pagePath("/", locale),
};

module.exports = ({ env }) => {
  const frontendUrl = env("FRONTEND_URL", "http://localhost:3003");

  return {
    auth: {
      secret: env("ADMIN_JWT_SECRET"),
    },
    // Editing the import scripts shouldn't restart `pnpm dev`. The watcher
    // matches absolute paths, and this file runs from dist/config, so a
    // pattern relative to either wouldn't match.
    watchIgnoreFiles: [/[\\/]scripts[\\/]/],
    apiToken: {
      salt: env("API_TOKEN_SALT"),
    },
    transfer: {
      token: {
        salt: env("TRANSFER_TOKEN_SALT"),
      },
    },
    // Lets API tokens be viewed again in Settings → API Tokens after they are
    // created, which is how the production frontend gets its token.
    secrets: {
      encryptionKey: env("ENCRYPTION_KEY"),
    },
    // The "Preview" button in the content manager opens the frontend's
    // /api/preview route, which switches on Next.js draft mode and redirects
    // to the page. PREVIEW_SECRET must match the frontend's.
    preview: {
      enabled: Boolean(env("PREVIEW_SECRET")),
      config: {
        allowedOrigins: [frontendUrl],
        async handler(uid, { documentId, locale, status }) {
          const toPath = PREVIEW_PATHS[uid];
          if (!toPath) return null;

          const document = await strapi
            .documents(uid)
            .findOne({ documentId, locale, status });
          if (!document) return null;

          const params = new URLSearchParams({
            secret: env("PREVIEW_SECRET"),
            path: toPath(document, locale),
            status,
          });
          return `${frontendUrl}/api/preview?${params}`;
        },
      },
    },
  };
};
