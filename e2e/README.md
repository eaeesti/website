# End-to-end tests

Playwright tests that use the site and Strapi's admin the way people do: every page and section type, the contact form through to the email the team gets, the donation form, the Markdown versions and llms.txt, a change published in Strapi showing on the site at once, the phone menu, and signing in to Strapi's admin.

GitHub Actions runs them on every pull request and every push to `main` (the `e2e` job in `.github/workflows/ci.yml`); a failed run keeps the report, with a trace of each failure, as the `e2e-report` artifact.

They run against a stack of their own, which the run starts and stops:

- **Postgres**: one database, `efektiivnealtruism_e2e`, made anew on every start, on the Postgres the `PG*` variables name (as for `psql`). Your own database isn't touched.
- **Strapi** on port 1349: built, run as in production, and filled by `stack/seed.mjs` with the made-up content in `stack/content.ts`. It reads none of `backend/.env` (`stack/config.ts` sets everything it needs), and its uploads go in `.state/public`, not `backend/public`.
- **The site** on 3049: built and started as in production, with the token the seed gives it.
- **Fakes** (`stack/fakes.ts`) on 4049 and, over HTTPS, 4449: a mail server that keeps every email for the tests to read, Anneta Targalt's donation API, which sends the donor straight back to the thank-you page, and the events calendar and podcast feeds. Nothing leaves your machine.

## Running them

Only with `pnpm dev` stopped: the run builds Strapi into the same `backend/dist` it uses. Once, after `pnpm install` in the repository's root:

```sh
cd e2e
pnpm exec playwright install chromium
```

Then, from the repository's root:

```sh
PGUSER=<you> pnpm test:e2e
```

Add `PGPASSWORD=<password>` if your Postgres asks for one (Postgres.app and Homebrew's don't, for your own user). A run takes a few minutes, most of it building. `pnpm --filter efektiivnealtruism-e2e report` shows the last run's report.

While you work on the tests, `pnpm --filter efektiivnealtruism-e2e e2e:ui` opens Playwright's window, which keeps the stack running while it's open: run tests one by one and watch them. After a build, `E2E_SKIP_BUILD=1` in front of either command starts the stack without building again.

Everything a run makes, logs and results included, is in `.state/`.

## Writing tests

- Find things the way people do, by role and name: `page.getByRole("button", { name: "Saada" })`. The texts that matter are in `TEXT` in `stack/content.ts`; use them rather than repeating the words.
- Tests run in parallel against one stack, and a run's data stays until the next start. Give each test its own visitor with `uniqueEmail()`, and change content only on a page of the test's own (the publishing test has `/muudetav`).
- `helpers/fakes.ts` reads the emails and donations the fakes got; `helpers/strapi-admin.ts` edits and publishes content through Strapi's admin API.
- Strapi lets one address sign in only a few times in a few minutes, so a test that signs in has an admin of its own in `ADMINS` in `stack/config.ts`.
- A new section type belongs on one of the seed's pages in `stack/content.ts`, with a test that it shows.
- Every name in the content and the tests is made up. Don't use a real person's.
