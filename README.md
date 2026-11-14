# Efektiivne Altruism Eesti

The website of MTÜ Efektiivne Altruism Eesti (Effective Altruism Estonia), at https://efektiivnealtruism.org.

- **Backend**: [Strapi 5](https://strapi.io/) (TypeScript, Postgres) in `backend/`. Editors manage pages, the blog and site settings here.
- **Frontend**: [Next.js 16](https://nextjs.org/) and [Tailwind CSS 4](https://tailwindcss.com/) in `frontend/`.

Both run on one small VPS. Pages are cached by Next.js and refreshed the moment something is published in Strapi, so the site is fast without a CDN and editors see their changes right away.

The people who edit the site are volunteers, not developers. Most of what's here exists to keep Strapi simple and hard to break for them: pages are built from fixed sections rather than free layout, and every field has a label and a hint in plain English.

### Finding your way around

- [AGENTS.md](AGENTS.md): the constraints the project works within, the commands, and how to add a page section.
- [backend/AGENTS.md](backend/AGENTS.md): the Strapi side: content types, the bootstrap code, caching, rate limits and login.
- [frontend/AGENTS.md](frontend/AGENTS.md): the Next.js side: routes, data fetching and caching, and the conventions components follow.

They're written for AI coding assistants as much as for people, so they're short and specific; read them before changing something in that part of the code.

## Setup

You need Node 22 or newer (production runs 24), [pnpm](https://pnpm.io/) and Postgres 16 or newer. The repo is a pnpm workspace pinned to pnpm 12 (`packageManager` in `package.json`); pnpm 9.7 or newer switches to that version by itself, or run `corepack enable` first. On a Mac, `brew install node pnpm postgresql@17` and `brew services start postgresql@17` cover it.

1\. Install everything:

```sh
pnpm install
```

2\. Create a database:

```sh
createdb efektiivnealtruism
```

3\. Create `backend/.env` from `backend/.env.example` and fill it in. Generate the keys with `openssl rand -base64 16` (`APP_KEYS` takes four, comma-separated) and the two shared secrets with `openssl rand -hex 32`. For a Homebrew Postgres, the database user is your macOS username, with no password. The email settings can stay empty locally; contact form messages are still saved.

4\. Start both apps:

```sh
pnpm dev
```

On its first start Strapi creates the Estonian and English locales and a read-only API token for the frontend, and writes `frontend/.env` with that token and the shared secrets.

5\. Open http://localhost:1338/admin and create your admin account. Locally you log in with an email and password; Google login is only for production (see [Logging in to the admin](#logging-in-to-the-admin)).

The site is at http://localhost:3003. Development uses ports 1338 and 3003 so it can run next to other projects on the usual 1337 and 3000.

### Content to work with

A new database is empty, so every page of the site is a 404 until there's content. Either create a page in Strapi with the slug `/` (the home page) and add sections to it, or ask a maintainer for a copy of the live site's content: a database dump without contact form messages or login sessions, and the `backend/public/uploads` folder. Load the dump with `psql -d efektiivnealtruism -f <file>.sql` into an empty database, and put the files in `backend/public/uploads`. Then create yourself an admin account or set a password as described under [Logging in to the admin](#logging-in-to-the-admin), then regenerate the "Public API Token" under Settings → API Tokens and put the new key in `frontend/.env` as `STRAPI_API_TOKEN` (the copy's token was made with another server's keys).

The scripts in `backend/scripts/` (`pnpm import:pages`, `pnpm import:webflow`) moved the content over from the old Webflow site in 2026. That site is gone, so they're kept only as a record of how the content was converted.

## How it works

### Content

| Strapi             | On the site                                                                                   |
| ------------------ | --------------------------------------------------------------------------------------------- |
| Page               | `/slug` in Estonian, `/en/slug` in English. Built from sections. The home page's slug is `/`. |
| Blog post          | `/blogi/slug`                                                                                 |
| Blog category      | `/rubriik/slug`                                                                               |
| Blog author        | Shown on posts                                                                                |
| Global             | Navbar, footer, 404 page, announcement banner and interface texts, per language               |
| Contact submission | Messages sent through the contact form                                                        |
| Email settings     | Who receives contact form messages                                                            |

The admin's field labels and help texts come from `backend/src/admin-fields.ts` and are applied on every start; change them there, not under "Configure the view".

The blog index is an ordinary page with the slug `blogi` and a "Blog posts" section. Listing pages after the first are at `/blogi/lk/2` and so on, and any page with a paginated posts section works the same way.

Pages, the navbar and the footer have English versions; the blog is Estonian only.

### Donations

The "Donation form" section (on `/anneta`) doesn't handle money itself: it sends the donation to [Anneta Targalt](https://annetatargalt.ee)'s external donation API, which records it and returns a link to the bank or payment provider. Anneta Targalt only accepts return addresses on this organisation's domains, so donations can't be completed from localhost.

### Podcast

The "Podcast episodes" section lists the episodes in the podcast's RSS feed (from Spotify for Creators), with a player for each. The feed is read again at most once an hour, so new episodes appear on their own.

### Embeds

In rich text, a paragraph containing nothing but a YouTube, Vimeo or Spotify link is shown as a player. Calendars, forms and other embeds go in an "Embed" section; only the hosts listed in `frontend/src/utils/embed.ts` are allowed.

### Publishing and preview

Every publish in Strapi (and any change to content without drafts, like the site settings) calls the frontend's `/api/revalidate`, which clears its page cache, so the next visitor gets the new version (see `backend/src/utils/revalidate.ts`). This needs `FRONTEND_REVALIDATE_URL` and `REVALIDATE_SECRET` in the backend and the same `REVALIDATE_SECRET` in the frontend. Without them, cached pages still refresh within an hour.

The "Preview" button in the content manager opens the page in Next.js draft mode, showing unpublished changes. It needs the same `PREVIEW_SECRET` on both sides.

### Logging in to the admin

In production, people log in with their EA Estonia Google account (an `@efektiivnealtruism.org` address). Google only
confirms who someone is; whether they get in is up to Strapi. To let someone in, add their address under Settings →
Users and give them a role. They don't need the invite link: their first Google login activates the account.

To take someone out, switch their user off or delete it in Strapi: removing them from the Workspace stops new logins
but not a session they already have, and an address given to someone new would bring them the old account. Delete an
invite nobody has used yet rather than switching it off, since an unused invite is already "inactive" and its first
Google login activates it.

Google login is on when `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in the backend, from an OAuth client of
type "Web application" in Google Cloud. Its authorised redirect URI is `PUBLIC_URL` followed by `/google-login/callback`,
e.g. `https://strapi.efektiivnealtruism.org/google-login/callback`, or `http://localhost:1338/google-login/callback` for
local development. `GOOGLE_WORKSPACE_DOMAIN` names the Workspace and defaults to `efektiivnealtruism.org`.

While it's on, passwords are turned off for everyone: the login page shows only the Google button, and the admin's
password routes refuse all requests, however the address is written (Strapi's router ignores case and a trailing
slash). If Google login ever breaks, remove the two settings and restart Strapi to log in with a password again. Strapi's own SSO needs its Enterprise plan, so this is the project's own code:
`backend/src/middlewares/google-login.ts`, and the login page's button in `backend/src/admin/google-login.ts`.

Locally, leave `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` out of `backend/.env`: Google login stays off and the
admin asks for an email and password as Strapi normally does. After copying production's database to your machine, the
users are production's, who log in with Google there and have no password you know; give yours one in the local
database (a bcrypt hash in `admin_users.password`, as Strapi makes them) or use "Forgot your password?" if email is set
up locally.

### Production

Both apps run as Docker images built from `deploy/strapi.Dockerfile` and `deploy/site.Dockerfile`, for linux/amd64, with the repo root as the build context. The code is compiled on the build machine's own architecture and only the dependencies are installed for the target, since compiling under emulation is very slow. Builds need more memory than the 2 GB server has (around 1.8 GB for Strapi's admin panel and 1.4 GB for Next.js), so the server only runs the images. The site's build never talks to Strapi; every page is rendered on its first visit and cached after that.

Outside Docker, `next build` makes a self-contained server instead (`output: "standalone"`): `frontend/.next/standalone/frontend/server.js`, which needs `frontend/.next/static` copied to `.next/standalone/frontend/.next/static`.

Environment variables are read at two different times:

- **At build time**, inlined into the build: `NEXT_PUBLIC_STRAPI_URL`, `NEXT_PUBLIC_SITE_URL` (the Docker build stops without either), `NEXT_PUBLIC_DONATION_API_URL` (optional, defaults to Anneta Targalt's production API), and `STRAPI_URL`, which `next.config.ts` uses for the `/uploads` proxy.
- **At runtime**, from the server's environment: `STRAPI_API_TOKEN`, `STRAPI_URL`, `REVALIDATE_SECRET`, `PREVIEW_SECRET`, `PLAUSIBLE_DOMAIN`, `UMAMI_WEBSITE_ID`.

Uploaded files are stored in `backend/public/uploads`, so back that directory up along with the database.

In production, view the frontend's API token in Strapi under Settings → API Tokens. This requires `ENCRYPTION_KEY` to be set.

Deploying is done by the maintainers. Changes reach the live site only after one of them deploys them.

## Tests, linting and formatting

```sh
pnpm test
pnpm type-check
pnpm lint          # oxlint
pnpm format:check  # oxfmt; `pnpm format` fixes
```

All four should pass before a change is merged; GitHub Actions runs them on every pull request (`.github/workflows/ci.yml`).

## Contributing

- Work on a branch and open a pull request. Say what the change is for, and include a screenshot when it changes how the site looks.
- Keep it simple for editors: when you add a field, give it a label and a hint in `backend/src/admin-fields.ts`; prefer a sensible default to another setting.
- Everything in Strapi is in English (field names, labels, defaults). Only the content of the Estonian locale is in Estonian.
- After changing a Strapi schema, run `pnpm generate-types` and commit the regenerated types.
- Never commit `.env` files, API tokens or database dumps.

Questions, bugs and ideas go in [GitHub issues](https://github.com/eaeesti/website/issues), or write to info@efektiivnealtruism.org. Please report security problems by email rather than in a public issue.

## License

© MTÜ Efektiivne Altruism Eesti. The code is licensed under the [GNU Affero General Public License v3.0 or later](LICENSE). The site's content (texts, photos, blog posts) lives in Strapi, not in this repository.
