/**
 * Logging in to the admin with Google: the parts that don't need Strapi,
 * kept here so they can be tested. The middleware that uses them is
 * src/middlewares/google-login.ts.
 *
 * Google only confirms who someone is. Whether they get in is decided by
 * Strapi: their Google address must belong to an admin user that an
 * administrator added under Settings → Users.
 */
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export const GOOGLE_LOGIN_PATH = "/google-login";
export const GOOGLE_CALLBACK_PATH = "/google-login/callback";
/** Tells the admin's login page whether to show the Google button. */
export const GOOGLE_STATUS_PATH = "/google-login/enabled";

/** Where the admin's login page is; it shows `?google-login=<error>`. */
export const ADMIN_LOGIN_PAGE = "/admin/auth/login";

const AUTHORIZATION_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
export const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const ISSUERS = ["https://accounts.google.com", "accounts.google.com"];

/** Why a Google login didn't end in the admin, as shown on the login page. */
export type GoogleLoginError = "cancelled" | "failed" | "no-account";

export interface GoogleClient {
  clientId: string;
  clientSecret: string;
}

/**
 * The Google OAuth client, from GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.
 * Without both, Google login is off and passwords work for everyone.
 */
export function googleClient(
  env: Record<string, string | undefined>,
): GoogleClient | null {
  const clientId = env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = env.GOOGLE_CLIENT_SECRET?.trim();
  return clientId && clientSecret ? { clientId, clientSecret } : null;
}

export function randomToken(): string {
  return randomBytes(32).toString("base64url");
}

/** PKCE: Google only gives out tokens for the code to whoever has `verifier`. */
export function pkceChallenge(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

export function authorizationUrl(options: {
  clientId: string;
  redirectUri: string;
  state: string;
  verifier: string;
}): string {
  const params = new URLSearchParams({
    client_id: options.clientId,
    redirect_uri: options.redirectUri,
    response_type: "code",
    scope: "openid email",
    state: options.state,
    code_challenge: pkceChallenge(options.verifier),
    code_challenge_method: "S256",
    // People with several Google accounts pick the one with access.
    prompt: "select_account",
  });
  return `${AUTHORIZATION_ENDPOINT}?${params.toString()}`;
}

/** The state cookie holds the state and the PKCE verifier. */
export function stateCookieValue(state: string, verifier: string): string {
  return `${state}.${verifier}`;
}

/**
 * The verifier, when the state Google sent back is the one in the cookie.
 * Anything else (no cookie, an expired one, a forged callback) is null.
 */
export function verifierForState(
  cookie: string | undefined,
  returnedState: unknown,
): string | null {
  if (!cookie || typeof returnedState !== "string") return null;
  const [state, verifier] = cookie.split(".");
  if (!state || !verifier) return null;
  const expected = Buffer.from(state);
  const actual = Buffer.from(returnedState);
  return expected.length === actual.length && timingSafeEqual(expected, actual)
    ? verifier
    : null;
}

/**
 * The verified email address in an ID token, or null.
 *
 * The signature isn't checked: the token comes straight from Google's token
 * endpoint over TLS, in exchange for this client's secret, which OpenID
 * Connect allows instead (Core 1.0, section 3.1.3.7). Who it's for, who
 * issued it and when it expires still are.
 */
export function verifiedEmail(
  idToken: unknown,
  clientId: string,
  now: Date,
): string | null {
  if (typeof idToken !== "string") return null;
  const payload = idToken.split(".")[1];
  if (!payload) return null;
  let claims: unknown;
  try {
    claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  const iss = claim(claims, "iss");
  const exp = claim(claims, "exp");
  const email = claim(claims, "email");
  const valid =
    typeof iss === "string" &&
    ISSUERS.includes(iss) &&
    claim(claims, "aud") === clientId &&
    typeof exp === "number" &&
    exp * 1000 > now.getTime() &&
    claim(claims, "email_verified") === true &&
    typeof email === "string" &&
    email.includes("@");
  return valid ? email : null;
}

/** A claim of a parsed token, which is untyped JSON. */
function claim(claims: unknown, name: string): unknown {
  if (!claims || typeof claims !== "object") return undefined;
  return Object.entries(claims).find(([key]) => key === name)?.[1];
}

/** The login page, showing why the Google login didn't work. */
export function loginPageWithError(error: GoogleLoginError): string {
  return `${ADMIN_LOGIN_PAGE}?google-login=${error}`;
}
