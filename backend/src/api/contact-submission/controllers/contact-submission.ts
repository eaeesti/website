import { factories } from "@strapi/strapi";
import type { Context } from "koa";
import {
  contactEmailContent,
  isHoneypotFilled,
  parseContactMessage,
  parseRecipients,
} from "../../../utils/contact";
import {
  FixedWindowLimiter,
  isInternalAddress,
  rateLimitKey,
} from "../../../utils/rate-limiter";

// Every submission writes a row and sends mail through the organisation's
// account, from an endpoint the browser reaches with no challenge in front of
// it. Five an hour is well clear of what a person filling in a form does.
const submissionsPerIp = new FixedWindowLimiter(5, 60 * 60 * 1000);

export default factories.createCoreController(
  "api::contact-submission.contact-submission",
  ({ strapi }) => ({
    async contact(ctx: Context) {
      const body: unknown = ctx.request.body;

      // Answer bots exactly like a real submission, so they learn nothing.
      if (isHoneypotFilled(body)) {
        return ctx.send({ ok: true });
      }

      const message = parseContactMessage(body);
      if (!message) {
        return ctx.badRequest("Invalid contact form submission");
      }

      // Skipped for internal addresses, such as the proxy's while
      // SERVER_PROXY is off, which every visitor would share: this would
      // throttle the whole site at once.
      if (
        !isInternalAddress(ctx.request.ip) &&
        !submissionsPerIp.tryConsume(rateLimitKey(ctx.request.ip))
      ) {
        // Status must be passed to send(): its default overwrites ctx.status.
        return ctx.send(
          { error: "Too many messages sent. Try again later." },
          429,
        );
      }

      await strapi
        .documents("api::contact-submission.contact-submission")
        .create({ data: { ...message, responded: false } });

      // The message is saved and visible in Strapi from here on, so a mail
      // problem is logged rather than reported to the sender as a failure.
      const emailConfig = await strapi
        .documents("api::email-config.email-config")
        .findFirst();
      const recipients = parseRecipients(emailConfig?.contactRecipients);

      if (recipients.length === 0) {
        strapi.log.warn(
          "Contact form submission saved, but no recipients are set in Email settings",
        );
        return ctx.send({ ok: true });
      }

      const { text, html } = contactEmailContent(message);
      try {
        await strapi
          .plugin("email")
          .service("email")
          .send({
            to: recipients,
            replyTo: message.email,
            subject:
              emailConfig?.contactSubject ??
              "New message from the website contact form",
            text,
            html,
          });
      } catch (error: unknown) {
        strapi.log.error(
          `Contact form submission saved, but the notification email failed: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }

      return ctx.send({ ok: true });
    },
  }),
);
