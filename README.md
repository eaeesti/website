# Efektiivne Altruism Eesti

The website of MTÜ Efektiivne Altruism Eesti, replacing the old Webflow site at https://www.efektiivnealtruism.org/.

- **Backend**: [Strapi 5](https://strapi.io/) (TypeScript, Postgres) in `backend/`. Editors manage pages, the blog and site settings here.
- **Frontend**: [Next.js 16](https://nextjs.org/) and [Tailwind CSS 4](https://tailwindcss.com/) in `frontend/`.

Both run on one small VPS. Pages are cached by Next.js and refreshed the moment something is published in Strapi, so the site is fast without a CDN and editors see their changes right away.

## Setup

You need Node 20 or newer, [pnpm](https://pnpm.io/) and Postgres. The repo is a pnpm workspace pinned to pnpm 12 (`packageManager` in `package.json`); an older pnpm switches to that version by itself.

1\. Install everything:

```sh
pnpm install
```

2\. Create a database:

```sh
createdb efektiivnealtruism
```

3\. Create `backend/.env` from `backend/.env.example` and fill it in. Generate the keys with `openssl rand -base64 16` (`APP_KEYS` takes four, comma-separated) and the two shared secrets with `openssl rand -hex 32`. The email settings can stay empty locally; contact form messages are still saved.

4\. Start both apps:

```sh
pnpm dev
```

On its first start Strapi creates the Estonian and English locales and a read-only API token for the frontend, and writes `frontend/.env` with that token and the shared secrets.

5\. Open http://localhost:1337/admin and create your admin account.

6\. Optionally, import the old site's content. Both scripts need a full-access API token: in Strapi, go to Settings → API Tokens → Create new API Token, type "Full access".

```sh
cd backend
STRAPI_TOKEN=... pnpm import:pages    # every page in both languages, the navbar and footer
STRAPI_TOKEN=... pnpm import:webflow  # every blog post, with images, categories and authors
```

They read the public site, keep a copy of each page in `backend/scripts/.webflow-cache`, and skip anything that already exists, so they are safe to run again. `REPLACE=1` makes `import:pages` overwrite pages instead, and `ONLY=/meist,/en/about` limits it to some of them. Pass `STRAPI_URL=...` to point either at another Strapi, such as production.

The site is at http://localhost:3000.

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

Every change in Strapi calls the frontend's `/api/revalidate`, which clears its page cache, so the next visitor gets the new version (see `backend/src/utils/revalidate.ts`). This needs `FRONTEND_REVALIDATE_URL` and `REVALIDATE_SECRET` in the backend and the same `REVALIDATE_SECRET` in the frontend. Without them, cached pages still refresh within an hour.

The "Preview" button in the content manager opens the page in Next.js draft mode, showing unpublished changes. It needs the same `PREVIEW_SECRET` on both sides.

### Logging in to the admin

People log in with their EA Estonia Google account (an `@efektiivnealtruism.org` address), like in the CRM. Google only
confirms who someone is; whether they get in is up to Strapi. To let someone in, add their address under Settings →
Users and give them a role. They don't need the invite link: their first Google login activates the account.

To take someone out, switch their user off or delete it in Strapi: removing them from the Workspace stops new logins
but not a session they already have, and an address given to someone new would bring them the old account. Delete an
invite nobody has used yet rather than switching it off, since an unused invite is already "inactive" and its first
Google login activates it.

Google login is on when `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in the backend, from an OAuth client of
type "Web application" in Google Cloud. Its authorised redirect URI is `PUBLIC_URL` followed by `/google-login/callback`,
e.g. `https://strapi.efektiivnealtruism.org/google-login/callback`, or `http://localhost:1337/google-login/callback` for
local development. `GOOGLE_WORKSPACE_DOMAIN` names the Workspace and defaults to `efektiivnealtruism.org`.

While it's on, passwords are turned off for everyone: the login page shows only the Google button, and the admin's
password routes refuse all requests, however the address is written (Strapi's router ignores case and a trailing
slash). If Google login ever breaks, remove the two settings and restart Strapi to log in with a password again. Strapi's own SSO needs its Enterprise plan, so this is the project's own code:
`backend/src/middlewares/google-login.ts`, and the login page's button in `backend/src/admin/google-login.ts`.

### Production

Both apps run as Docker images built from `deploy/strapi.Dockerfile` and `deploy/site.Dockerfile`, for linux/amd64, with the repo root as the build context. The code is compiled on the build machine's own architecture and only the dependencies are installed for the target, since compiling under emulation is very slow. Builds need more memory than the 2 GB server has (around 1.8 GB for Strapi's admin panel and 1.4 GB for Next.js), so the server only runs the images. The site's build never talks to Strapi; every page is rendered on its first visit and cached after that.

Outside Docker, `next build` makes a self-contained server instead (`output: "standalone"`): `frontend/.next/standalone/frontend/server.js`, which needs `frontend/.next/static` copied to `.next/standalone/frontend/.next/static`.

Environment variables are read at two different times:

- **At build time**, inlined into the build: `NEXT_PUBLIC_STRAPI_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_DONATION_API_URL` (optional, defaults to Anneta Targalt's production API), and `STRAPI_URL`, which `next.config.ts` uses for the `/uploads` proxy.
- **At runtime**, from the server's environment: `STRAPI_API_TOKEN`, `STRAPI_URL`, `REVALIDATE_SECRET`, `PREVIEW_SECRET`, `PLAUSIBLE_DOMAIN`, `UMAMI_WEBSITE_ID`.

Uploaded files are stored in `backend/public/uploads`, so back that directory up along with the database.

In production, view the frontend's API token in Strapi under Settings → API Tokens. This requires `ENCRYPTION_KEY` to be set.

## Tests, linting and formatting

```sh
pnpm test
pnpm type-check
pnpm lint          # oxlint
pnpm format:check  # oxfmt; `pnpm format` fixes
```
