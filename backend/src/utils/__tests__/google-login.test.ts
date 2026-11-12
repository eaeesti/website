import { createHash } from "node:crypto";
import { describe, it, expect } from "vitest";
import {
  authorizationUrl,
  googleClient,
  loginPageWithError,
  pkceChallenge,
  stateCookieValue,
  verifiedEmail,
  verifierForState,
} from "../google-login";

const CLIENT_ID = "123.apps.googleusercontent.com";
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
    ).toEqual({ clientId: "id", clientSecret: "secret" });
    expect(googleClient({ GOOGLE_CLIENT_ID: "id" })).toBeNull();
    expect(
      googleClient({ GOOGLE_CLIENT_ID: "id", GOOGLE_CLIENT_SECRET: " " }),
    ).toBeNull();
  });
});

describe("authorizationUrl", () => {
  it("asks for the address only, with PKCE", () => {
    const url = new URL(
      authorizationUrl({
        clientId: CLIENT_ID,
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

describe("verifiedEmail", () => {
  it("reads the verified address", () => {
    expect(verifiedEmail(idToken({}), CLIENT_ID, NOW)).toBe(
      "mari@efektiivnealtruism.org",
    );
    expect(
      verifiedEmail(idToken({ iss: "accounts.google.com" }), CLIENT_ID, NOW),
    ).toBe("mari@efektiivnealtruism.org");
  });

  it.each([
    ["another client's token", { aud: "someone-else" }],
    ["another issuer's token", { iss: "https://evil.example" }],
    ["an expired token", { exp: NOW.getTime() / 1000 - 1 }],
    ["an unverified address", { email_verified: false }],
    ["a missing address", { email: undefined }],
  ])("refuses %s", (_, claims) => {
    expect(verifiedEmail(idToken(claims), CLIENT_ID, NOW)).toBeNull();
  });

  it("refuses what isn't a token", () => {
    expect(verifiedEmail(undefined, CLIENT_ID, NOW)).toBeNull();
    expect(verifiedEmail("nonsense", CLIENT_ID, NOW)).toBeNull();
    expect(verifiedEmail("a.!!!.c", CLIENT_ID, NOW)).toBeNull();
  });
});

describe("loginPageWithError", () => {
  it("sends people back to the admin's login page", () => {
    expect(loginPageWithError("no-account")).toBe(
      "/admin/auth/login?google-login=no-account",
    );
  });
});
