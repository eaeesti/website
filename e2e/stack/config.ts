import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Where the tests' own stack runs. Its ports are next to the ones `pnpm dev`
 * uses (1338 and 3003), not on them, so a run never talks to your
 * development Strapi or its database.
 */
export const PORTS = {
  strapi: 1349,
  site: 3049,
  /** The fakes the browser calls (the donation API) and the tests read. */
  fakes: 4049,
  /** The same fakes over HTTPS, for the site's calendar feed. */
  fakesHttps: 4449,
  smtp: 2549,
};

export const URLS = {
  strapi: `http://127.0.0.1:${PORTS.strapi}`,
  site: `http://localhost:${PORTS.site}`,
  fakes: `http://127.0.0.1:${PORTS.fakes}`,
  fakesHttps: `https://127.0.0.1:${PORTS.fakesHttps}`,
};

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
/** Files a run makes: logs, the certificate, the site's token, uploads. */
export const STATE = join(ROOT, "e2e", ".state");
mkdirSync(STATE, { recursive: true });

/** The site's API token: Strapi's start writes it here, the site reads it. */
export const TOKEN_FILE = join(STATE, "site-token");
/** The fakes' certificate, which Strapi and the site are told to trust. */
export const CERT_FILE = join(STATE, "fakes-cert.pem");
export const KEY_FILE = join(STATE, "fakes-key.pem");
/** Strapi's public folder for the run, so uploads stay out of backend/. */
export const PUBLIC_DIR = join(STATE, "public");

/**
 * The Strapi admins the seed makes. Strapi lets one address sign in only a
 * few times in a few minutes, so each test that signs in has its own.
 */
const admin = (name: string, firstname: string) => ({
  email: `${name}@e2e.test`,
  password: `E2e-${name}-password-1`,
  firstname,
  lastname: "Admin",
});
export const ADMINS = {
  ui: admin("ui", "Uku"),
  publisher: admin("publisher", "Pille"),
};

/** Where the contact form's messages go. */
export const TEAM_EMAIL = "team@e2e.test";

/**
 * The Postgres the stack uses, from the PG* variables like psql. Its
 * database is made anew on each start.
 */
export const DATABASE = {
  host: process.env.PGHOST ?? "127.0.0.1",
  port: process.env.PGPORT ?? "5432",
  user: process.env.PGUSER ?? process.env.USER ?? "postgres",
  password: process.env.PGPASSWORD ?? "",
  name: "efektiivnealtruism_e2e",
};

const REVALIDATE_SECRET = "e2e-revalidate-secret";
const PREVIEW_SECRET = "e2e-preview-secret";

/**
 * Everything Strapi reads, set, so that nothing comes from backend/.env:
 * Strapi reads that file too, but never over a variable that's already set,
 * even to "". It runs as in production, which also keeps it from writing the
 * site's token into frontend/.env. Google login stays off, so passwords work,
 * and email goes to the fake mail server.
 */
export function strapiEnv(): Record<string, string> {
  return {
    // Strapi reads the file this names instead of backend/.env, and there is
    // none.
    ENV_PATH: join(STATE, "no.env"),
    NODE_ENV: "production",
    HOST: "127.0.0.1",
    PORT: String(PORTS.strapi),
    PUBLIC_URL: URLS.strapi,
    PUBLIC_DIR,
    FRONTEND_URL: URLS.site,
    CORS_ORIGINS: "",
    // Required in production. Nothing sits in front, so nobody sets
    // X-Forwarded-For.
    SERVER_PROXY: "true",
    INTERNAL_NETWORKS: "",
    APP_KEYS: "e2eKeyOne,e2eKeyTwo,e2eKeyThree,e2eKeyFour",
    API_TOKEN_SALT: "e2e-api-token-salt",
    ADMIN_JWT_SECRET: "e2e-admin-jwt-secret",
    TRANSFER_TOKEN_SALT: "e2e-transfer-token-salt",
    JWT_SECRET: "e2e-jwt-secret",
    ENCRYPTION_KEY: "e2e-encryption-key",
    FRONTEND_REVALIDATE_URL: `http://127.0.0.1:${PORTS.site}/api/revalidate`,
    REVALIDATE_SECRET,
    PREVIEW_SECRET,
    GOOGLE_CLIENT_ID: "",
    GOOGLE_CLIENT_SECRET: "",
    GOOGLE_WORKSPACE_DOMAIN: "",
    DATABASE_URL: "",
    DATABASE_HOST: DATABASE.host,
    DATABASE_PORT: DATABASE.port,
    DATABASE_NAME: DATABASE.name,
    DATABASE_USERNAME: DATABASE.user,
    DATABASE_PASSWORD: DATABASE.password,
    DATABASE_SSL: "false",
    SMTP_HOST: "127.0.0.1",
    SMTP_PORT: String(PORTS.smtp),
    SMTP_USERNAME: "e2e",
    SMTP_PASSWORD: "e2e",
    EMAIL_DEFAULT_FROM: "website@e2e.test",
    EMAIL_DEFAULT_REPLY_TO: "info@e2e.test",
    // The fake mail server's certificate. Node reads this only when a
    // process starts.
    NODE_EXTRA_CA_CERTS: CERT_FILE,
    STRAPI_TELEMETRY_DISABLED: "true",
    BROWSER: "none",
  };
}

/** Everything the site reads, for its build and its server. */
export function siteEnv(token: string): Record<string, string> {
  return {
    PORT: String(PORTS.site),
    STRAPI_API_TOKEN: token,
    STRAPI_URL: URLS.strapi,
    NEXT_PUBLIC_STRAPI_URL: URLS.strapi,
    NEXT_PUBLIC_SITE_URL: URLS.site,
    NEXT_PUBLIC_DONATION_API_URL: `${URLS.fakes}/api/donateExternal`,
    REVALIDATE_SECRET,
    PREVIEW_SECRET,
    PLAUSIBLE_DOMAIN: "",
    UMAMI_WEBSITE_ID: "",
    // `next start`, as the production image runs it.
    NEXT_STANDALONE: "false",
    // The calendar feed is fetched over HTTPS from the fakes.
    NODE_EXTRA_CA_CERTS: CERT_FILE,
    NEXT_TELEMETRY_DISABLED: "1",
  };
}
