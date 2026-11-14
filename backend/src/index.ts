import type { Core } from "@strapi/strapi";
import fs from "fs";
import path from "path";
import { syncAdminFields } from "./admin-fields";
import { syncEditorRole } from "./editor-role";
import { configuredNetworks, parseNetworks } from "./utils/rate-limiter";
import {
  affectsPublicSite,
  scheduleFrontendRevalidation,
} from "./utils/revalidate";

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------

/**
 * How long destroy() lets requests already in progress finish. It has to stay
 * below the time whatever runs Strapi waits before killing it (Docker's stop
 * timeout is 10 s by default).
 */
const SHUTDOWN_DRAIN_MS = 4000;

/** Requests received and not yet answered; counted from bootstrap(). */
let inFlightRequests = 0;

// ---------------------------------------------------------------------------
// Bootstrap helpers
// ---------------------------------------------------------------------------

/**
 * Runs one bootstrap step without letting it take the whole app down. A
 * failing setup step should be logged and skipped, never stop the CMS from
 * starting.
 */
async function safely(
  strapi: Core.Strapi,
  name: string,
  fn: () => Promise<void>,
): Promise<void> {
  try {
    await fn();
  } catch (error: unknown) {
    strapi.log.error(
      `❌ Bootstrap step '${name}' failed — continuing startup anyway: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

const LOCALES = [
  { code: "et", name: "Estonian (et)" },
  { code: "en", name: "English (en)" },
];

/**
 * Estonian is the site's main language and English the secondary one. A fresh
 * Strapi starts with English as its only locale, so create both and make
 * Estonian the default. Idempotent, and never deletes a locale.
 */
async function ensureLocales(strapi: Core.Strapi): Promise<void> {
  type Locale = { code: string };
  type LocalesService = {
    find(): Promise<Locale[]>;
    create(locale: { code: string; name: string }): Promise<unknown>;
    getDefaultLocale(): Promise<string | null>;
    setDefaultLocale(params: { code: string }): Promise<unknown>;
  };
  const locales = strapi.plugin("i18n").service("locales") as LocalesService;

  const existing = new Set((await locales.find()).map((locale) => locale.code));
  for (const locale of LOCALES) {
    if (!existing.has(locale.code)) {
      await locales.create(locale);
      strapi.log.info(`✅ Created locale '${locale.code}'`);
    }
  }

  if ((await locales.getDefaultLocale()) !== "et") {
    await locales.setDefaultLocale({ code: "et" });
    strapi.log.info("✅ Set Estonian as the default locale");
  }
}

/**
 * Creates the read-only "Public API Token" the frontend uses, and keeps its
 * permissions in sync with the list below on every boot, so anything granted
 * by hand in the admin gets pruned again.
 *
 * In development the new token is also written to frontend/.env. In
 * production, view it in Settings → API Tokens (that needs ENCRYPTION_KEY to
 * be set) and put it in the frontend's environment.
 */
async function bootstrapApiToken(strapi: Core.Strapi): Promise<void> {
  const TOKEN_NAME = "Public API Token";

  const permissions = [
    "api::blog-author.blog-author.find",
    "api::blog-author.blog-author.findOne",
    "api::blog-category.blog-category.find",
    "api::blog-category.blog-category.findOne",
    "api::blog-post.blog-post.find",
    "api::blog-post.blog-post.findOne",
    "api::global.global.find",
    "api::page.page.find",
    "api::page.page.findOne",
  ];

  type ApiTokenRow = { id: number };
  type ApiTokenService = {
    create(data: Record<string, unknown>): Promise<{ accessKey: string }>;
    update(id: number, data: Record<string, unknown>): Promise<unknown>;
  };
  const tokenService = strapi.service("admin::api-token") as ApiTokenService;

  const existing = (await strapi.db.query("admin::api-token").findOne({
    where: { name: TOKEN_NAME },
  })) as ApiTokenRow | null;

  if (existing) {
    // update() diffs against the token's current permissions: adds anything
    // missing from the list, removes anything not in it.
    await tokenService.update(existing.id, { permissions });
    strapi.log.info("✅ Public API Token permissions synced");
    return;
  }

  const result = await tokenService.create({
    name: TOKEN_NAME,
    type: "custom",
    lifespan: null,
    description: "Frontend read-only access",
    permissions,
  });
  strapi.log.info("✅ Created Public API Token");

  if (process.env.NODE_ENV === "production") return;

  // Never NEXT_PUBLIC_: that prefix would inline the token into the browser
  // bundle of any client component that reaches the fetch helper.
  const envPath = path.resolve(process.cwd(), "..", "frontend", ".env");
  const key = "STRAPI_API_TOKEN";
  const newLine = `${key}=${result.accessKey}`;

  if (fs.existsSync(envPath)) {
    const contents = fs.readFileSync(envPath, "utf8");
    const updated = contents.match(new RegExp(`^${key}=`, "m"))
      ? contents.replace(new RegExp(`^${key}=.*`, "m"), newLine)
      : `${contents.trimEnd()}\n${newLine}\n`;
    fs.writeFileSync(envPath, updated, "utf8");
  } else {
    const lines = [
      newLine,
      "STRAPI_URL=http://127.0.0.1:1338",
      "NEXT_PUBLIC_STRAPI_URL=http://localhost:1338",
      "NEXT_PUBLIC_SITE_URL=http://localhost:3003",
      `REVALIDATE_SECRET=${process.env.REVALIDATE_SECRET ?? ""}`,
      `PREVIEW_SECRET=${process.env.PREVIEW_SECRET ?? ""}`,
      "PLAUSIBLE_DOMAIN=",
    ];
    fs.writeFileSync(envPath, `${lines.join("\n")}\n`, "utf8");
  }
  strapi.log.info("✅ Wrote the Public API Token to frontend/.env");
}

/**
 * Nobody signs up or logs in through the users-permissions plugin: editors
 * use Strapi admin accounts. Close its public auth endpoints and
 * self-registration so they can't be used to create accounts.
 */
async function hardenPublicAuth(strapi: Core.Strapi): Promise<void> {
  type Role = { id: number };
  type Permission = { id: number };

  const blockedAuthActions = [
    "plugin::users-permissions.auth.callback",
    "plugin::users-permissions.auth.register",
    "plugin::users-permissions.auth.forgotPassword",
    "plugin::users-permissions.auth.resetPassword",
    "plugin::users-permissions.auth.connect",
    "plugin::users-permissions.auth.emailConfirmation",
    "plugin::users-permissions.auth.sendEmailConfirmation",
    "plugin::users-permissions.auth.refresh",
    "plugin::users-permissions.auth.logout",
  ];

  const publicRole = (await strapi.db
    .query("plugin::users-permissions.role")
    .findOne({ where: { type: "public" } })) as Role | null;

  if (publicRole) {
    const stalePerms = (await strapi.db
      .query("plugin::users-permissions.permission")
      .findMany({
        where: { role: publicRole.id, action: { $in: blockedAuthActions } },
      })) as Permission[];

    if (stalePerms.length > 0) {
      await Promise.all(
        stalePerms.map((p) =>
          strapi.db
            .query("plugin::users-permissions.permission")
            .delete({ where: { id: p.id } }),
        ),
      );
      strapi.log.info(
        `✅ Revoked ${stalePerms.length} users-permissions auth action(s) from 'public' role`,
      );
    }
  }

  const pluginStore = strapi.store({
    type: "plugin",
    name: "users-permissions",
  });
  const advancedRaw = await pluginStore.get({ key: "advanced" });
  const advanced =
    advancedRaw && typeof advancedRaw === "object"
      ? (advancedRaw as Record<string, unknown>)
      : null;

  if (advanced && advanced.allow_register !== false) {
    await pluginStore.set({
      key: "advanced",
      value: { ...advanced, allow_register: false },
    });
    strapi.log.info("✅ Disabled users-permissions public self-registration");
  }
}

/**
 * In production Strapi runs behind nginx, and without SERVER_PROXY it can't
 * tell that requests came over HTTPS or from whom. The admin's session
 * cookies would lose Secure, the Google login's state cookie its __Host-
 * name, and the per-address limits (the contact form's and the global one)
 * would see nginx's address for everyone. None of that shows, so refuse to
 * start instead. Turn SERVER_PROXY on only where the proxy overwrites
 * X-Forwarded-For (config/server.js).
 */
function requireTrustedProxy(strapi: Core.Strapi): void {
  if (strapi.config.get("server.proxy.koa")) return;
  if (process.env.NODE_ENV !== "production") return;
  throw new Error(
    "SERVER_PROXY is off in production. Behind nginx, Strapi would set the " +
      "admin's cookies without Secure and rate-limit every visitor as one. " +
      "Set SERVER_PROXY=true, with nginx overwriting X-Forwarded-For with " +
      "the client's address.",
  );
}

/** A typo in INTERNAL_NETWORKS would silently leave the site rate-limited. */
function warnIfInternalNetworksInvalid(strapi: Core.Strapi): void {
  const { invalid } = parseNetworks(
    configuredNetworks(process.env.INTERNAL_NETWORKS),
  );
  if (invalid.length === 0) return;
  strapi.log.warn(
    `⚠️  INTERNAL_NETWORKS: ignoring ${invalid.join(", ")}; ` +
      'give networks as "address/prefix", e.g. 172.32.0.0/24.',
  );
}

function warnIfRevalidationUnset(strapi: Core.Strapi): void {
  if (process.env.FRONTEND_REVALIDATE_URL && process.env.REVALIDATE_SECRET) {
    return;
  }
  strapi.log.warn(
    "⚠️  FRONTEND_REVALIDATE_URL or REVALIDATE_SECRET is not set: published " +
      "changes reach the site only when the frontend's cache expires.",
  );
}

export default {
  register({ strapi }: { strapi: Core.Strapi }) {
    // Tell the frontend to refresh after any change to what it shows.
    strapi.documents.use(async (context, next) => {
      const result = await next();
      if (
        affectsPublicSite({
          uid: context.uid,
          action: context.action,
          hasDrafts: Boolean(context.contentType.options?.draftAndPublish),
          status:
            context.params && "status" in context.params
              ? context.params.status
              : null,
        })
      ) {
        scheduleFrontendRevalidation(strapi);
      }
      return result;
    });
  },

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    requireTrustedProxy(strapi);
    await safely(strapi, "ensureLocales", () => ensureLocales(strapi));
    await safely(strapi, "bootstrapApiToken", () => bootstrapApiToken(strapi));
    await safely(strapi, "hardenPublicAuth", () => hardenPublicAuth(strapi));
    await safely(strapi, "syncAdminFields", () => syncAdminFields(strapi));
    await safely(strapi, "syncEditorRole", () => syncEditorRole(strapi));
    warnIfInternalNetworksInvalid(strapi);
    warnIfRevalidationUnset(strapi);

    // Changing an image's alt text or replacing the file in the media library
    // doesn't go through the Document Service, but pages show the result.
    strapi.db.lifecycles.subscribe({
      models: ["plugin::upload.file"],
      afterUpdate: () => scheduleFrontendRevalidation(strapi),
      afterDelete: () => scheduleFrontendRevalidation(strapi),
    });

    // Under a process manager that waits to be told (PM2's `wait_ready`),
    // say this process accepts connections. Only then is process.send there.
    // It has to be the server's own `listening` event: Strapi calls listen()
    // after bootstrap returns.
    if (process.send) {
      const { httpServer } = strapi.server;
      const signalReady = () => {
        process.send?.("ready");
        strapi.log.info("✅ Ready signal sent - accepting connections");
      };
      if (httpServer.listening) signalReady();
      else httpServer.once("listening", signalReady);
    }

    strapi.server.httpServer.on("request", (_req, res) => {
      inFlightRequests += 1;
      res.once("close", () => {
        inFlightRequests -= 1;
      });
    });
  },

  /**
   * Let requests in progress finish before Strapi shuts down. Strapi's own
   * shutdown destroys open connections mid-request; closing the server first
   * refuses new ones and gives the rest SHUTDOWN_DRAIN_MS to complete.
   */
  async destroy({ strapi }: { strapi: Core.Strapi }) {
    const { httpServer } = strapi.server;
    if (httpServer.listening) httpServer.close();

    const deadline = Date.now() + SHUTDOWN_DRAIN_MS;
    // The request listeners decrement inFlightRequests while this awaits.
    // oxlint-disable-next-line no-unmodified-loop-condition
    while (inFlightRequests > 0 && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    if (inFlightRequests > 0) {
      strapi.log.warn(
        `⚠️ Shutting down with ${inFlightRequests} request(s) still unanswered after ${SHUTDOWN_DRAIN_MS / 1000}s`,
      );
    }
  },
};
