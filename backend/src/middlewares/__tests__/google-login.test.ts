import type { Core } from "@strapi/strapi";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import googleLogin from "../google-login";

const CLIENT_ID = "123.apps.googleusercontent.com";

interface FakeUser {
  id: number;
  email: string;
  isActive: boolean;
  blocked: boolean;
  registrationToken: string | null;
}

const editor: FakeUser = {
  id: 2,
  email: "mari@efektiivnealtruism.org",
  isActive: true,
  blocked: false,
  registrationToken: null,
};
const invited: FakeUser = {
  id: 3,
  email: "jaan@efektiivnealtruism.org",
  isActive: false,
  blocked: false,
  registrationToken: "invite-jaan",
};

function part(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

/** As Google issues them: only Workspace accounts carry `hd`. */
function idToken(email: string): string {
  const domain = email.split("@")[1]?.toLowerCase();
  const claims = {
    iss: "https://accounts.google.com",
    aud: CLIENT_ID,
    exp: Date.now() / 1000 + 3600,
    email,
    email_verified: true,
    ...(domain === "efektiivnealtruism.org" ? { hd: domain } : {}),
  };
  return `${part({ alg: "RS256" })}.${part(claims)}.signature`;
}

function matches(user: FakeUser, where: Record<string, unknown>): boolean {
  return Object.entries(where).every(([key, condition]) => {
    if (condition && typeof condition === "object" && "$eqi" in condition) {
      return (
        typeof condition.$eqi === "string" &&
        user.email.toLowerCase() === condition.$eqi.toLowerCase()
      );
    }
    return Object.entries(user).some(
      ([field, value]) => field === key && value === condition,
    );
  });
}

const log = () => vi.fn<(message: string) => void>();

function fakeStrapi(users: FakeUser[]) {
  const updates: unknown[] = [];
  const sessions = {
    generateRefreshToken: vi.fn<
      (...args: unknown[]) => Promise<{
        token: string;
        sessionId: string;
        absoluteExpiresAt: string;
      }>
    >(async () => ({
      token: "refresh-token",
      sessionId: "session",
      absoluteExpiresAt: "",
    })),
    generateAccessToken: vi.fn<() => Promise<{ token: string }>>(async () => ({
      token: "access-token",
    })),
  };
  const strapi = {
    db: {
      query: () => ({
        findOne: async ({ where }: { where: Record<string, unknown> }) =>
          users.find((user) => matches(user, where)) ?? null,
        update: async (args: unknown) => {
          updates.push(args);
        },
      }),
    },
    config: { get: () => "https://cms.example" },
    log: { info: log(), warn: log(), error: log() },
    sessionManager: () => sessions,
  };
  return { strapi: strapi as unknown as Core.Strapi, updates, sessions };
}

interface SetCookie {
  name: string;
  value: string | null;
  options: Record<string, unknown>;
}

/** Enough of Koa's context for the middleware. */
function fakeContext(init: {
  method?: string;
  path: string;
  query?: Record<string, string>;
  body?: unknown;
  cookies?: Map<string, string>;
}) {
  const jar = init.cookies ?? new Map<string, string>();
  const setCookies: SetCookie[] = [];
  const ctx = {
    method: init.method ?? "GET",
    path: init.path,
    query: init.query ?? {},
    origin: "https://cms.example",
    request: { body: init.body, secure: true },
    status: 404,
    body: undefined as unknown,
    redirectedTo: null as string | null,
    redirect(url: string) {
      this.redirectedTo = url;
    },
    cookies: {
      get: (name: string) => jar.get(name),
      set: (name: string, value: string | null, options = {}) => {
        setCookies.push({ name, value, options });
        if (value === null) jar.delete(name);
        else jar.set(name, value);
      },
    },
  };
  return { ctx, jar, setCookies };
}

async function run(
  strapi: Core.Strapi,
  ctx: ReturnType<typeof fakeContext>["ctx"],
) {
  const next = vi.fn<() => Promise<void>>(async () => {});
  const handler = googleLogin({}, { strapi });
  if (!handler) throw new Error("no handler");
  await handler(ctx as never, next);
  return next;
}

function cookie(setCookies: SetCookie[], name: string) {
  return setCookies.find((set) => set.name === name);
}

/** Starts a login and comes back from Google as `email`. */
async function roundTrip(users: FakeUser[], email: string) {
  const fake = fakeStrapi(users);
  const start = fakeContext({ path: "/google-login" });
  await run(fake.strapi, start.ctx);
  const google = new URL(start.ctx.redirectedTo ?? "");
  const state = google.searchParams.get("state") ?? "";

  const fetch = vi.fn<
    (url: string, init: { body: URLSearchParams }) => Promise<Response>
  >(
    async () =>
      new Response(JSON.stringify({ id_token: idToken(email) }), {
        status: 200,
      }),
  );
  vi.stubGlobal("fetch", fetch);
  const back = fakeContext({
    path: "/google-login/callback",
    query: { state, code: "auth-code" },
    cookies: start.jar,
  });
  await run(fake.strapi, back.ctx);
  return { ...fake, google, fetch, back };
}

describe("google-login middleware", () => {
  beforeEach(() => {
    vi.stubEnv("GOOGLE_CLIENT_ID", CLIENT_ID);
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "secret");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  describe("logging in with Google", () => {
    it("sends people to Google with a state and a PKCE challenge", async () => {
      const { google, fetch } = await roundTrip([editor], editor.email);
      expect(google.origin).toBe("https://accounts.google.com");
      expect(google.searchParams.get("redirect_uri")).toBe(
        "https://cms.example/google-login/callback",
      );
      expect(google.searchParams.get("code_challenge")).toBeTruthy();
      expect(google.searchParams.get("hd")).toBe("efektiivnealtruism.org");
      // The token request proves it holds the verifier behind the challenge.
      const [, request] = fetch.mock.calls[0];
      expect(request.body.get("code")).toBe("auth-code");
      expect(request.body.get("code_verifier")).toBeTruthy();
    });

    it("logs an existing user in to the admin, as Strapi's login does", async () => {
      const { back, sessions } = await roundTrip([editor], editor.email);
      expect(back.ctx.redirectedTo).toBe("/admin");
      expect(sessions.generateRefreshToken).toHaveBeenCalledWith(
        "2",
        expect.any(String),
        { type: "session" },
      );
      expect(cookie(back.setCookies, "strapi_admin_refresh")).toMatchObject({
        value: "refresh-token",
        options: { httpOnly: true, path: "/admin", sameSite: "lax" },
      });
      expect(cookie(back.setCookies, "jwtToken")).toMatchObject({
        value: "access-token",
        options: { httpOnly: false, path: "/admin" },
      });
    });

    it("matches the address whatever its case", async () => {
      const { back } = await roundTrip([editor], "Mari@EfektiivneAltruism.org");
      expect(back.ctx.redirectedTo).toBe("/admin");
    });

    it("activates invited users, without an invite link", async () => {
      const { back, updates } = await roundTrip([invited], invited.email);
      expect(back.ctx.redirectedTo).toBe("/admin");
      expect(updates).toEqual([
        {
          where: { id: 3 },
          data: { isActive: true, registrationToken: null },
        },
      ]);
    });

    it("keeps out users an administrator switched off", async () => {
      const { back, updates, sessions } = await roundTrip(
        [{ ...editor, isActive: false }],
        editor.email,
      );
      expect(back.ctx.redirectedTo).toBe(
        "/admin/auth/login?google-login=no-account",
      );
      expect(updates).toEqual([]);
      expect(sessions.generateRefreshToken).not.toHaveBeenCalled();
    });

    it("turns away accounts outside the Workspace", async () => {
      const { back, sessions } = await roundTrip([editor], "mari@gmail.com");
      expect(back.ctx.redirectedTo).toBe(
        "/admin/auth/login?google-login=wrong-account",
      );
      expect(sessions.generateRefreshToken).not.toHaveBeenCalled();
    });

    it("turns away addresses without an account, and blocked users", async () => {
      const stranger = await roundTrip(
        [editor],
        "someone@efektiivnealtruism.org",
      );
      expect(stranger.back.ctx.redirectedTo).toBe(
        "/admin/auth/login?google-login=no-account",
      );
      expect(stranger.sessions.generateRefreshToken).not.toHaveBeenCalled();

      const blocked = await roundTrip(
        [{ ...editor, blocked: true }],
        editor.email,
      );
      expect(blocked.back.ctx.redirectedTo).toBe(
        "/admin/auth/login?google-login=no-account",
      );
    });

    it("refuses a callback whose state isn't the one it gave out", async () => {
      const fake = fakeStrapi([editor]);
      const fetch = vi.fn<typeof globalThis.fetch>();
      vi.stubGlobal("fetch", fetch);
      const forged = fakeContext({
        path: "/google-login/callback",
        query: { state: "forged", code: "auth-code" },
        cookies: new Map([["strapi_google_login", "real.verifier"]]),
      });
      await run(fake.strapi, forged.ctx);
      expect(forged.ctx.redirectedTo).toBe(
        "/admin/auth/login?google-login=failed",
      );
      expect(fetch).not.toHaveBeenCalled();
    });

    it("says so when the person cancels at Google", async () => {
      const fake = fakeStrapi([editor]);
      const cancelled = fakeContext({
        path: "/google-login/callback",
        query: { error: "access_denied", state: "x" },
      });
      await run(fake.strapi, cancelled.ctx);
      expect(cancelled.ctx.redirectedTo).toBe(
        "/admin/auth/login?google-login=cancelled",
      );
    });
  });

  describe("passwords", () => {
    it.each([
      ["/admin/login", { email: editor.email, password: "x" }],
      ["/admin/login", { email: "nobody@example.com", password: "x" }],
      ["/admin/forgot-password", { email: editor.email }],
      ["/admin/reset-password", { resetPasswordToken: "t", password: "x" }],
      ["/admin/register", { registrationToken: "invite-jaan" }],
      ["/admin/register-admin", { email: "new@example.com", password: "x" }],
      // Strapi's router ignores case and a trailing slash, so these reach
      // the same handlers.
      ["/admin/login/", { email: editor.email, password: "x" }],
      ["/admin/LOGIN", { email: editor.email, password: "x" }],
      ["/Admin/Login/", { email: editor.email, password: "x" }],
      ["/admin/Forgot-Password/", { email: editor.email }],
      ["/admin/reset-password/", { resetPasswordToken: "t", password: "x" }],
      ["/admin/REGISTER/", { registrationToken: "invite-jaan" }],
    ])("refuses %s, for everyone", async (path, body) => {
      const { strapi } = fakeStrapi([editor, invited]);
      const { ctx } = fakeContext({ method: "POST", path, body });
      expect(await run(strapi, ctx)).not.toHaveBeenCalled();
      expect(ctx.status).toBe(403);
      expect(ctx.body).toMatchObject({
        error: { message: expect.stringContaining("Google") },
      });
    });

    it.each(["/admin/logout", "/admin/access-token", "/admin/login-x"])(
      "leaves %s to Strapi",
      async (path) => {
        const { strapi } = fakeStrapi([editor]);
        const { ctx } = fakeContext({ method: "POST", path });
        expect(await run(strapi, ctx)).toHaveBeenCalled();
      },
    );
  });

  describe("without a Google client", () => {
    beforeEach(() => {
      vi.stubEnv("GOOGLE_CLIENT_ID", "");
    });

    it("leaves passwords alone and hides the button", async () => {
      const { strapi } = fakeStrapi([editor]);
      const login = fakeContext({
        method: "POST",
        path: "/admin/login",
        body: { email: editor.email, password: "x" },
      });
      expect(await run(strapi, login.ctx)).toHaveBeenCalled();

      const status = fakeContext({ path: "/google-login/enabled" });
      await run(strapi, status.ctx);
      expect(status.ctx.body).toEqual({ enabled: false, domain: null });

      const start = fakeContext({ path: "/google-login" });
      expect(await run(strapi, start.ctx)).toHaveBeenCalled();
    });
  });
});
