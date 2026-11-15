// The tests' Strapi: makes its database anew, builds Strapi (unless
// E2E_SKIP_BUILD is set), then seed.mjs fills it and starts it, in a process
// of its own: Node reads NODE_EXTRA_CA_CERTS, which lets it trust the fake
// mail server, only when a process starts.
import { execFileSync, spawn } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { DATABASE, PUBLIC_DIR, ROOT, TOKEN_FILE, strapiEnv } from "./config.ts";

const backendDir = join(ROOT, "backend");
const env = {
  ...process.env,
  ...strapiEnv(),
  PGHOST: DATABASE.host,
  PGPORT: DATABASE.port,
  PGUSER: DATABASE.user,
  PGPASSWORD: DATABASE.password,
};
const run = (command, args, options = {}) =>
  execFileSync(command, args, { stdio: "inherit", env, ...options });

run("dropdb", ["--if-exists", "--force", DATABASE.name]);
run("createdb", [DATABASE.name]);
rmSync(TOKEN_FILE, { force: true });
rmSync(PUBLIC_DIR, { recursive: true, force: true });
mkdirSync(join(PUBLIC_DIR, "uploads"), { recursive: true });

if (!process.env.E2E_SKIP_BUILD) run("pnpm", ["build"], { cwd: backendDir });

const strapi = spawn(
  process.execPath,
  [join(ROOT, "e2e", "stack", "seed.mjs")],
  { cwd: backendDir, env, stdio: "inherit" },
);
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => strapi.kill(signal));
}
strapi.on("exit", (code) => process.exit(code ?? 1)); // a signal is a failure
