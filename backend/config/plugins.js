module.exports = ({ env }) => ({
  // Files are stored on this server under public/uploads and served by Strapi
  // at /uploads. The frontend proxies that path, and Next.js resizes images,
  // so nothing here needs a third-party image host.
  upload: {
    config: {
      sizeLimit: 25 * 1024 * 1024,
      // Uploads are served from Strapi's own address (and the site's
      // /uploads), so an uploaded web page or script would run there, next to
      // the admin's session. Only media and documents, then. SVGs stay
      // allowed: the content security policy keeps their inline scripts from
      // running, and without uploaded scripts there's nothing else to load.
      security: {
        allowedTypes: [
          "image/*",
          "video/*",
          "audio/*",
          "application/pdf",
          "text/plain",
          "text/csv",
          "application/msword",
          "application/vnd.ms-excel",
          "application/vnd.ms-powerpoint",
          "application/vnd.openxmlformats-officedocument.*",
          "application/vnd.oasis.opendocument.*",
        ],
      },
    },
  },
  email: {
    config: {
      provider: "nodemailer",
      providerOptions: {
        host: env("SMTP_HOST", "smtp-relay.brevo.com"),
        port: env.int("SMTP_PORT", 587),
        // Port 587 starts unencrypted and upgrades with STARTTLS. Without
        // requireTLS, nodemailer sends in the clear when the server doesn't
        // offer the upgrade, which anyone in between can arrange by removing
        // the offer: the password and every message would be readable.
        secure: false,
        requireTLS: true,
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
