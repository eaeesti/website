module.exports = ({ env }) => ({
  // Files are stored on this server under public/uploads and served by Strapi
  // at /uploads. The frontend proxies that path, and Next.js resizes images,
  // so nothing here needs a third-party image host.
  upload: {
    config: {
      sizeLimit: 25 * 1024 * 1024,
    },
  },
  email: {
    config: {
      provider: "nodemailer",
      providerOptions: {
        host: env("SMTP_HOST", "smtp-relay.brevo.com"),
        port: env.int("SMTP_PORT", 587),
        secure: false,
        // Without a username, no login: a relay that knows the server by its
        // address (like Google Workspace's) still offers one, and nodemailer
        // would try it with empty credentials and fail.
        ...(env("SMTP_USERNAME") && {
          auth: {
            user: env("SMTP_USERNAME"),
            pass: env("SMTP_PASSWORD"),
          },
        }),
      },
      settings: {
        defaultFrom: env("EMAIL_DEFAULT_FROM"),
        defaultReplyTo: env("EMAIL_DEFAULT_REPLY_TO"),
      },
    },
  },
  "users-permissions": {
    config: {
      jwt: { expiresIn: "8h" },
    },
  },
});
