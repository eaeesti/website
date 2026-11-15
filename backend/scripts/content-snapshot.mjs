#!/usr/bin/env node
/**
 * A copy of the site's content for working on the code locally: the Strapi
 * database with everything private taken out, and the uploaded files.
 *
 *   pnpm snapshot:make [dump.sql[.gz]]      (a maintainer)
 *   pnpm snapshot:load <snapshot.tar.gz>    (anyone)
 *
 * make copies your own Strapi database, or loads a plain-SQL dump of the
 * production one (pg_dump --no-owner --no-privileges, gzipped or not), into
 * a scratch database beside yours, removes what's private (SCRUB below),
 * checks it's gone, and writes content-snapshot-<date>.tar.gz in the
 * repository's root: database.sql and uploads/, a copy of
 * backend/public/uploads. With a production dump, copy production's uploads
 * into backend/public/uploads first, or images will be missing.
 *
 * load puts a snapshot's database into the one DATABASE_NAME names, keeping
 * one that's already there under another name, and copies its files into
 * backend/public/uploads, next to any already there. Stop Strapi first.
 *
 * Both read the connection settings from backend/.env and need Postgres's
 * command-line tools (psql, pg_dump, createdb, dropdb) and tar.
 */

import { spawn } from "node:child_process";
import {
  accessSync,
  constants,
  cpSync,
  createReadStream,
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pipeline } from "node:stream/promises";
import { Transform } from "node:stream";
import { createGunzip } from "node:zlib";

/** backend/public/uploads, where Strapi keeps uploaded files. */
const UPLOADS = resolve("public", "uploads");

/**
 * What a snapshot leaves out. Anyone who adds a content type or table that
 * holds personal data, an account or a secret adds it here too.
 */
const SCRUB = `
BEGIN;

-- Tables that may not exist in every Strapi version are emptied if they do.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    -- Messages people sent through the contact form
    'contact_submissions',
    -- Accounts and sign-ins: the editors in Strapi's admin and the
    -- users-permissions plugin's users. Whoever loads the snapshot makes
    -- their own.
    'admin_users',
    'up_users',
    'strapi_sessions',
    -- Keys. Strapi makes the site's API token again when it starts.
    'strapi_api_tokens',
    'strapi_api_token_permissions',
    'strapi_transfer_tokens',
    'strapi_transfer_token_permissions',
    -- Who changed what, and earlier versions of entries
    'strapi_audit_logs',
    'strapi_history_versions',
    -- Addresses elsewhere, which may carry secrets
    'strapi_webhooks'
  ] LOOP
    IF to_regclass(t) IS NOT NULL THEN
      EXECUTE format('DELETE FROM %I', t);
    END IF;
  END LOOP;
END $$;

-- The team's own addresses, where contact form messages are sent
UPDATE email_configs SET contact_recipients = 'team@example.org';

-- Sign-in providers' keys and secrets
UPDATE strapi_core_store_settings
SET value = (
  SELECT jsonb_object_agg(
    provider,
    (
      SELECT jsonb_object_agg(
        field,
        CASE WHEN field IN ('key', 'secret') THEN '""'::jsonb ELSE setting END
      )
      FROM jsonb_each(settings) AS s(field, setting)
    )
  )
  FROM jsonb_each(value::jsonb) AS p(provider, settings)
)::text
WHERE key = 'plugin_users-permissions_grant';

COMMIT;
`;

/** What's left of the private rows after SCRUB: all of it must be zero. */
const LEFT_OVER = `
SELECT
  (SELECT count(*) FROM contact_submissions)
  + (SELECT count(*) FROM admin_users)
  + (SELECT count(*) FROM up_users)
  + (SELECT count(*) FROM strapi_sessions)
  + (SELECT count(*) FROM strapi_api_tokens)
  + (SELECT count(*) FROM strapi_transfer_tokens)
  + (SELECT count(*) FROM email_configs
     WHERE contact_recipients IS DISTINCT FROM 'team@example.org')
`;

function setting(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} isn't set: run this from backend with pnpm, after creating backend/.env.`,
    );
  }
  return value;
}

/**
 * Postgres's tools find the server and the password in the environment, so
 * the password never appears in a command line.
 */
function postgresEnvironment() {
  return {
    ...process.env,
    PGHOST: process.env.DATABASE_HOST ?? "127.0.0.1",
    PGPORT: process.env.DATABASE_PORT ?? "5432",
    ...(process.env.DATABASE_USERNAME && {
      PGUSER: process.env.DATABASE_USERNAME,
    }),
    ...(process.env.DATABASE_PASSWORD && {
      PGPASSWORD: process.env.DATABASE_PASSWORD,
    }),
    ...(process.env.DATABASE_SSL === "true" && { PGSSLMODE: "require" }),
  };
}

/**
 * Runs a command and resolves with what it printed, or rejects when it
 * fails. `input`, a chain of streams, is streamed to it.
 */
function run(command, args, { input } = {}) {
  return new Promise((succeed, fail) => {
    const child = spawn(command, args, {
      env: postgresEnvironment(),
      stdio: [input ? "pipe" : "ignore", "pipe", "inherit"],
    });
    let printed = "";
    child.stdout.on("data", (chunk) => (printed += chunk));
    // Settles with the stream's error, if any. A command that fails stops
    // reading, which breaks its input's pipe: then the command's own failure
    // is the one to report.
    const streamed = (
      input ? pipeline(...input, child.stdin) : Promise.resolve()
    ).then(
      () => null,
      (error) => error,
    );
    child.on("error", fail);
    child.on("close", (code) => {
      streamed.then((error) => {
        if (code !== 0) {
          fail(new Error(`${command} failed (exit code ${code})`));
        } else if (error) fail(error);
        else succeed(printed.trim());
      });
    });
  });
}

function sql(database, statement) {
  return run("psql", [
    "-X",
    "-q",
    "-At",
    "-v",
    "ON_ERROR_STOP=1",
    "-d",
    database,
    "-c",
    statement,
  ]);
}

/**
 * Feeds a dump file, gzipped or not, to psql. A dump from a newer pg_dump
 * than the local Postgres has lines the older psql doesn't know, which are
 * left out: Postgres 17's \restrict and its transaction_timeout setting.
 */
async function restore(database, file) {
  const input = [
    createReadStream(file),
    ...(file.endsWith(".gz") ? [createGunzip()] : []),
    withoutLines(/^\\(un)?restrict |^SET transaction_timeout/),
  ];
  await run(
    "psql",
    ["-X", "-q", "-v", "ON_ERROR_STOP=1", "-d", database, "-o", "/dev/null"],
    { input },
  );
}

/** A stream of text without the lines `drop` matches. */
function withoutLines(drop) {
  let rest = "";
  return new Transform({
    transform(chunk, _encoding, done) {
      const lines = (rest + chunk).split("\n");
      rest = lines.pop() ?? "";
      const kept = lines.filter((line) => !drop.test(line));
      done(null, kept.map((line) => line + "\n").join(""));
    },
    flush(done) {
      done(null, drop.test(rest) ? "" : rest);
    },
  });
}

function dump(database, file) {
  return run("pg_dump", [
    "--no-owner",
    "--no-privileges",
    "-d",
    database,
    "-f",
    file,
  ]);
}

/** Stops before anything is made when a file isn't there to read. */
function readable(file) {
  try {
    accessSync(file, constants.R_OK);
  } catch {
    throw new Error(`Can't read ${file}: is the path right?`);
  }
}

async function databases() {
  const names = await sql("postgres", "SELECT datname FROM pg_database");
  return names.split("\n");
}

function quoted(identifier) {
  return `"${identifier.replaceAll('"', '""')}"`;
}

function timestamp() {
  return new Date()
    .toISOString()
    .slice(0, 19)
    .replace(/[-:]/g, "")
    .replace("T", "_");
}

async function make(dumpFile) {
  if (dumpFile) readable(dumpFile);
  const source = setting("DATABASE_NAME");
  const scratch = `${source}_snapshot_${timestamp()}`;
  // In the repository's root: Strapi's dev server watches backend/.
  const out = resolve("..", `content-snapshot-${timestamp()}.tar.gz`);
  const folder = mkdtempSync(join(tmpdir(), "content-snapshot-"));
  await run("createdb", [scratch]);
  try {
    if (dumpFile) {
      console.log(`Loading ${dumpFile} into ${scratch}…`);
      await restore(scratch, dumpFile);
    } else {
      // By way of a dump, which works while Strapi is connected to the
      // database, unlike Postgres's own copy (createdb --template).
      console.log(`Copying ${source} into ${scratch}…`);
      const copy = join(folder, "copy.sql");
      await dump(source, copy);
      await restore(scratch, copy);
      rmSync(copy);
    }
    await sql(scratch, SCRUB);
    if ((await sql(scratch, LEFT_OVER)) !== "0") {
      throw new Error("Private rows were left after scrubbing; no snapshot.");
    }
    await dump(scratch, join(folder, "database.sql"));

    const files = await sql(
      scratch,
      "SELECT count(*) FROM files WHERE url LIKE '/uploads/%'",
    );
    mkdirSync(join(folder, "uploads"));
    if (existsSync(UPLOADS)) {
      cpSync(UPLOADS, join(folder, "uploads"), {
        recursive: true,
        filter: (path) => !path.endsWith(".gitkeep"),
      });
    } else {
      console.warn(`No ${UPLOADS}: the snapshot has no uploaded files.`);
    }
    await run("tar", ["-czf", out, "-C", folder, "database.sql", "uploads"]);
    console.log(`Snapshot written to ${out} (${files} files in the media library).
Share it only with people working on the site: it has unpublished drafts.`);
  } finally {
    rmSync(folder, { recursive: true, force: true });
    await run("dropdb", [scratch]);
  }
}

async function load(snapshot) {
  if (!snapshot) {
    throw new Error("Which snapshot? pnpm snapshot:load <snapshot.tar.gz>");
  }
  readable(snapshot);
  const target = setting("DATABASE_NAME");
  const folder = mkdtempSync(join(tmpdir(), "content-snapshot-"));
  try {
    await run("tar", ["-xzf", resolve(snapshot), "-C", folder]);
    const database = join(folder, "database.sql");
    if (!existsSync(database)) {
      throw new Error(`${snapshot} isn't a content snapshot: no database.sql.`);
    }

    const existing = await databases();
    let kept = null;
    if (existing.includes(target)) {
      kept = `${target}_before_${timestamp()}`;
      try {
        await sql(
          "postgres",
          `ALTER DATABASE ${quoted(target)} RENAME TO ${quoted(kept)}`,
        );
      } catch {
        throw new Error(
          `Couldn't set ${target} aside: is Strapi still running? Stop it and try again.`,
        );
      }
    }
    await run("createdb", [target]);
    try {
      console.log(`Loading the content into ${target}…`);
      await restore(target, database);
    } catch (error) {
      await run("dropdb", [target]);
      if (kept) {
        await sql(
          "postgres",
          `ALTER DATABASE ${quoted(kept)} RENAME TO ${quoted(target)}`,
        );
      }
      throw error;
    }

    console.log(`Copying the uploaded files into ${UPLOADS}…`);
    mkdirSync(UPLOADS, { recursive: true });
    cpSync(join(folder, "uploads"), UPLOADS, { recursive: true });

    console.log(`
Done.${kept ? ` Your earlier database is kept as ${kept}; drop it once you don't need it (dropdb ${kept}).` : ""}
Start everything with pnpm dev in the repository's root, then open
http://localhost:1338/admin and register: a snapshot has no accounts, so the
first one you make is a Super Admin. Strapi makes a new API token for the
site as it starts and writes it into frontend/.env.`);
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
}

const [command, ...args] = process.argv.slice(2);
const commands = { make, load };

if (command !== "make" && command !== "load") {
  console.error("Usage: content-snapshot.mjs make [dump] | load <snapshot>");
  process.exit(1);
}
commands[command](...args).catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
