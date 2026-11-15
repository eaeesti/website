// The tests' site: built, unless E2E_SKIP_BUILD is set, and started as the
// production image starts it.
import { execFileSync, spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, TOKEN_FILE, siteEnv } from "./config.ts";

const dir = join(ROOT, "frontend");
// Written by seed.mjs before Strapi listens, so it's there by now.
const token = readFileSync(TOKEN_FILE, "utf8").trim();
const env = { ...process.env, ...siteEnv(token) };

if (!process.env.E2E_SKIP_BUILD) {
  execFileSync("pnpm", ["build"], { cwd: dir, env, stdio: "inherit" });
}
// next itself rather than through pnpm, which doesn't pass a stop signal on.
const next = join(dir, "node_modules", "next", "dist", "bin", "next");
const server = spawn(process.execPath, [next, "start", "--port", env.PORT], {
  cwd: dir,
  env,
  stdio: "inherit",
});
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.kill(signal));
}
server.on("exit", (code) => process.exit(code ?? 1)); // a signal is a failure
