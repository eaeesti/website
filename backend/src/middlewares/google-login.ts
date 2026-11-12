/**
 * Admin login with Google, for everyone, and with a password for Super
 * Admins only. Off until GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set;
 * until then passwords work as before.
 *
 * GET /google-login           → Google's account chooser
 * GET /google-login/callback  → back from Google: logs the user in to the
 *                               admin, as Strapi's own login would
 * GET /google-login/enabled   → { enabled }, for the login page's button
 *
 * Only active admin users that exist already get in. An invited user who
 * never set a password is activated by their first Google login, so invite
 * links aren't needed; one an administrator switched off stays out. The admin's password routes refuse everyone but Super
 * Admins, who keep a password so the admin can't be locked out by Google.
 * Logging in with Google doesn't depend on Strapi's Enterprise SSO.
 */
import type { Core } from "@strapi/strapi";
import { randomUUID } from "node:crypto";
import {
  authorizationUrl,
  GOOGLE_CALLBACK_PATH,
  GOOGLE_LOGIN_PATH,
  GOOGLE_STATUS_PATH,
  googleClient,
  loginPageWithError,
  randomToken,
  stateCookieValue,
  TOKEN_ENDPOINT,
  verifiedEmail,
  verifierForState,
  type GoogleClient,
} from "../utils/google-login";

type Context = Parameters<Core.MiddlewareHandler>[0];

const STATE_COOKIE = "strapi_google_login";

/**
 * The cookies Strapi's own login sets, with Strapi's default names and path
 * (config/admin.js doesn't change them): the refresh token, which only the
 * server reads, and the access token, which the admin reads when it loads.
 */
const REFRESH_COOKIE = "strapi_admin_refresh";
const ACCESS_COOKIE = "jwtToken";
const ADMIN_COOKIE_PATH = "/admin";

const SUPER_ADMIN = "strapi-super-admin";

/**
 * The admin routes that log in or set a password, and the field of their
 * request body that identifies the user.
 */
const PASSWORD_ROUTES = new Map([
  ["/admin/login", "email"],
  ["/admin/forgot-password", "email"],
  ["/admin/register", "registrationToken"],
  ["/admin/reset-password", "resetPasswordToken"],
]);

const PASSWORD_REFUSED =
  "Editors log in with Google: use the “Log in with Google” button above.";

interface AdminUser {
  id: number;
  isActive: boolean;
  blocked: boolean | null;
  /** Set while an invited user hasn't registered. */
  registrationToken: string | null;
  roles: { code: string }[];
}

/** A property of a request body, which is untyped. */
function field(body: unknown, name: string): unknown {
  if (!body || typeof body !== "object") return undefined;
  return Object.entries(body).find(([key]) => key === name)?.[1];
}

/** Secure cookies as Strapi sets them: in production, over HTTPS. */
function secure(ctx: Context): boolean {
  return process.env.NODE_ENV === "production" && ctx.request.secure;
}

function isSuperAdmin(user: AdminUser): boolean {
  return user.roles.some((role) => role.code === SUPER_ADMIN);
}

function refusePassword(ctx: Context) {
  if (ctx.path === "/admin/forgot-password") {
    // Strapi's own answer, so it doesn't reveal the account; no email.
    ctx.status = 204;
    return;
  }
  ctx.status = 403;
  ctx.body = {
    data: null,
    error: {
      status: 403,
      name: "ForbiddenError",
      message: PASSWORD_REFUSED,
      details: {},
    },
  };
}

const googleLogin: Core.MiddlewareFactory = (_config, { strapi }) => {
  const findUser = async (where: Record<string, unknown>) =>
    (await strapi.db
      .query("admin::user")
      .findOne({ where, populate: ["roles"] })) as AdminUser | null;

  const redirectUri = (ctx: Context) => {
    const base = strapi.config.get<string>("server.url") || ctx.origin;
    return `${base.replace(/\/$/, "")}${GOOGLE_CALLBACK_PATH}`;
  };

  const start = (ctx: Context, client: GoogleClient) => {
    const state = randomToken();
    const verifier = randomToken();
    // Signed, so another site can't plant a state of its own (login CSRF).
    ctx.cookies.set(STATE_COOKIE, stateCookieValue(state, verifier), {
      signed: true,
      httpOnly: true,
      secure: secure(ctx),
      sameSite: "lax",
      path: GOOGLE_LOGIN_PATH,
      maxAge: 10 * 60 * 1000,
      overwrite: true,
    });
    ctx.redirect(
      authorizationUrl({
        clientId: client.clientId,
        redirectUri: redirectUri(ctx),
        state,
        verifier,
      }),
    );
  };

  /** The Google account's verified address, or why there isn't one. */
  const googleEmail = async (
    ctx: Context,
    client: GoogleClient,
  ): Promise<string | "cancelled" | "failed"> => {
    const verifier = verifierForState(
      ctx.cookies.get(STATE_COOKIE, { signed: true }),
      ctx.query.state,
    );
    ctx.cookies.set(STATE_COOKIE, null, {
      signed: true,
      path: GOOGLE_LOGIN_PATH,
    });
    if (ctx.query.error) return "cancelled";
    const code = ctx.query.code;
    if (!verifier || typeof code !== "string") return "failed";

    const response = await fetch(TOKEN_ENDPOINT, {
      method: "POST",
      body: new URLSearchParams({
        code,
        client_id: client.clientId,
        client_secret: client.clientSecret,
        redirect_uri: redirectUri(ctx),
        grant_type: "authorization_code",
        code_verifier: verifier,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      strapi.log.warn(`Google login: token request got ${response.status}`);
      return "failed";
    }
    const tokens: unknown = await response.json();
    const email = verifiedEmail(
      field(tokens, "id_token"),
      client.clientId,
      new Date(),
    );
    if (!email) strapi.log.warn("Google login: no verified address in token");
    return email ?? "failed";
  };

  const callback = async (ctx: Context, client: GoogleClient) => {
    const email = await googleEmail(ctx, client);
    if (email === "cancelled" || email === "failed") {
      ctx.redirect(loginPageWithError(email));
      return;
    }
    const user = await findUser({ email: { $eqi: email } });
    // Inactive without a registration token: an administrator switched the
    // user off, so they stay out.
    const invited = Boolean(user && !user.isActive && user.registrationToken);
    if (!user || user.blocked || (!user.isActive && !invited)) {
      strapi.log.info(`Google login: no admin access for ${email}`);
      ctx.redirect(loginPageWithError("no-account"));
      return;
    }
    if (invited) {
      // Invited and never registered: Google confirmed the address.
      await strapi.db.query("admin::user").update({
        where: { id: user.id },
        data: { isActive: true, registrationToken: null },
      });
    }

    const sessions = strapi.sessionManager("admin");
    const { token: refreshToken } = await sessions.generateRefreshToken(
      String(user.id),
      randomUUID(),
      { type: "session" },
    );
    const access = await sessions.generateAccessToken(refreshToken);
    if ("error" in access) {
      ctx.redirect(loginPageWithError("failed"));
      return;
    }
    ctx.cookies.set(REFRESH_COOKIE, refreshToken, {
      httpOnly: true,
      secure: secure(ctx),
      sameSite: "lax",
      path: ADMIN_COOKIE_PATH,
      overwrite: true,
    });
    ctx.cookies.set(ACCESS_COOKIE, access.token, {
      httpOnly: false,
      secure: secure(ctx),
      sameSite: "lax",
      path: ADMIN_COOKIE_PATH,
      overwrite: true,
    });
    strapi.log.info(`Google login: ${email}`);
    ctx.redirect("/admin");
  };

  /**
   * Whether a request to one of the admin's password routes may go on: only
   * for Super Admins, and for addresses with no account (those get Strapi's
   * usual answer, so the routes don't tell who has an account).
   */
  const passwordAllowed = async (ctx: Context, key: string) => {
    const value = field(ctx.request.body, key);
    // Strapi's own validation answers malformed requests.
    if (typeof value !== "string" || !value) return true;
    const user = await findUser(
      key === "email" ? { email: { $eqi: value } } : { [key]: value },
    );
    return !user || isSuperAdmin(user);
  };

  return async (ctx, next) => {
    const client = googleClient(process.env);
    if (ctx.method === "GET" && ctx.path === GOOGLE_STATUS_PATH) {
      ctx.body = { enabled: Boolean(client) };
      return;
    }
    if (!client) return next();

    if (ctx.method === "GET" && ctx.path === GOOGLE_LOGIN_PATH) {
      start(ctx, client);
      return;
    }
    if (ctx.method === "GET" && ctx.path === GOOGLE_CALLBACK_PATH) {
      try {
        await callback(ctx, client);
      } catch (error: unknown) {
        strapi.log.error(
          `Google login failed: ${error instanceof Error ? error.message : String(error)}`,
        );
        ctx.redirect(loginPageWithError("failed"));
      }
      return;
    }
    const passwordKey = PASSWORD_ROUTES.get(ctx.path);
    if (ctx.method === "POST" && passwordKey) {
      if (!(await passwordAllowed(ctx, passwordKey))) {
        refusePassword(ctx);
        return;
      }
    }
    return next();
  };
};

export default googleLogin;
