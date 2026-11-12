import { createHash } from "node:crypto";
import { describe, it, expect } from "vitest";
import {
  authorizationUrl,
  googleClient,
  loginPageWithError,
  pkceChallenge,
  stateCookieValue,
  verifierForState,
  workspaceEmail,
} from "../google-login";

const CLIENT_ID = "123.apps.googleusercontent.com";
const CLIENT = { clientId: CLIENT_ID, domain: "efektiivnealtruism.org" };
const NOW = new Date("2026-11-12T12:00:00Z");

function part(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

/** An ID token as Google's token endpoint returns it (unsigned here). */
function idToken(claims: Record<string, unknown>): string {
  return `${part({ alg: "RS256" })}.${part({
    iss: "https://accounts.google.com",
    aud: CLIENT_ID,
    exp: NOW.getTime() / 1000 + 3600,
    email: "mari@efektiivnealtruism.org",
    email_verified: true,
    hd: "efektiivnealtruism.org",
    ...claims,
  })}.signature`;
}

describe("googleClient", () => {
  it("needs both the ID and the secret", () => {
    expect(
      googleClient({
        GOOGLE_CLIENT_ID: " id ",
        GOOGLE_CLIENT_SECRET: "secret",
      }),
    ).toEqual({
      clientId: "id",
      clientSecret: "secret",
      domain: "efektiivnealtruism.org",
    });
    expect(googleClient({ GOOGLE_CLIENT_ID: "id" })).toBeNull();
    expect(
      googleClient({ GOOGLE_CLIENT_ID: "id", GOOGLE_CLIENT_SECRET: " " }),
    ).toBeNull();
  });

  it("takes the Workspace's domain from GOOGLE_WORKSPACE_DOMAIN", () => {
    expect(
      googleClient({
        GOOGLE_CLIENT_ID: "id",
        GOOGLE_CLIENT_SECRET: "secret",
        GOOGLE_WORKSPACE_DOMAIN: " Example.ORG ",
      })?.domain,
    ).toBe("example.org");
  });
});

describe("authorizationUrl", () => {
  it("asks for a Workspace address only, with PKCE", () => {
    const url = new URL(
      authorizationUrl({
        clientId: CLIENT_ID,
        domain: "efektiivnealtruism.org",
        redirectUri: "https://cms.example/google-login/callback",
        state: "state",
        verifier: "verifier",
      }),
    );
    expect(url.origin + url.pathname).toBe(
      "https://accounts.google.com/o/oauth2/v2/auth",
    );
    expect(Object.fromEntries(url.searchParams)).toMatchObject({
      client_id: CLIENT_ID,
      redirect_uri: "https://cms.example/google-login/callback",
      response_type: "code",
      scope: "openid email",
      state: "state",
      code_challenge: pkceChallenge("verifier"),
      code_challenge_method: "S256",
      hd: "efektiivnealtruism.org",
    });
  });

  it("derives the challenge from the verifier with SHA-256", () => {
    expect(pkceChallenge("verifier")).toBe(
      createHash("sha256").update("verifier").digest("base64url"),
    );
  });
});

describe("verifierForState", () => {
  const cookie = stateCookieValue("abc", "secret-verifier");

  it("returns the verifier when the state matches", () => {
    expect(verifierForState(cookie, "abc")).toBe("secret-verifier");
  });

  it("refuses other states, a missing cookie and odd values", () => {
    expect(verifierForState(cookie, "abd")).toBeNull();
    expect(verifierForState(cookie, "ab")).toBeNull();
    expect(verifierForState(cookie, ["abc"])).toBeNull();
    expect(verifierForState(undefined, "abc")).toBeNull();
    expect(verifierForState("abc", "abc")).toBeNull();
  });
});

describe("workspaceEmail", () => {
  it("reads a verified address of the Workspace", () => {
    expect(workspaceEmail(idToken({}), CLIENT, NOW)).toEqual({
      email: "mari@efektiivnealtruism.org",
    });
    expect(
      workspaceEmail(
        idToken({
          iss: "accounts.google.com",
          email: "Mari@EfektiivneAltruism.org",
        }),
        CLIENT,
        NOW,
      ),
    ).toEqual({ email: "mari@efektiivnealtruism.org" });
  });

  it.each([
    ["a personal account", { email: "mari@gmail.com", hd: undefined }],
    ["a personal account with the domain's address", { hd: undefined }],
    ["another Workspace", { email: "mari@example.org", hd: "example.org" }],
    ["another of the Workspace's domains", { email: "mari@example.org" }],
  ])("tells %s to use the Workspace account", (_, claims) => {
    expect(workspaceEmail(idToken(claims), CLIENT, NOW)).toEqual({
      error: "wrong-account",
    });
  });

  it.each([
    ["another client's token", { aud: "someone-else" }],
    ["another issuer's token", { iss: "https://evil.example" }],
    ["an expired token", { exp: NOW.getTime() / 1000 - 1 }],
    ["an unverified address", { email_verified: false }],
    ["a missing address", { email: undefined }],
  ])("refuses %s", (_, claims) => {
    expect(workspaceEmail(idToken(claims), CLIENT, NOW)).toEqual({
      error: "failed",
    });
  });

  it("refuses what isn't a token", () => {
    for (const token of [undefined, "nonsense", "a.!!!.c"]) {
      expect(workspaceEmail(token, CLIENT, NOW)).toEqual({ error: "failed" });
    }
  });
});

describe("loginPageWithError", () => {
  it("sends people back to the admin's login page", () => {
    expect(loginPageWithError("no-account")).toBe(
      "/admin/auth/login?google-login=no-account",
    );
  });
});
