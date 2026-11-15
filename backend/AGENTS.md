# Backend — Agent Guide

Strapi 5 + TypeScript + Postgres. Source in `src/`, compiled to `dist/`. Always edit `src/`.

```bash
pnpm dev         # compile + start dev server (regenerates frontend types first)
pnpm type-check  # must pass (strict mode)
pnpm test        # Vitest: src/**/__tests__
pnpm snapshot:load <file>  # a content snapshot into the local database (see the root README)
pnpm snapshot:make         # make one from the local database or a production dump
```

## Source Layout

```
config/
├── admin.js          # preview handler (Strapi "Preview" button → frontend draft mode)
├── middlewares.js    # CSP, CORS (the frontend's origins), rate limit
└── plugins.js        # local uploads, SMTP email
src/
├── index.ts          # bootstrap: locales, frontend API token, auth hardening,
│                     # admin labels, revalidation middleware, graceful shutdown
├── admin-fields.ts   # labels and help texts editors see in the admin
├── editor-role.ts    # the Editor role's permissions, rebuilt on every start
├── admin/app.tsx     # admin branding: logos, EA blue, login texts (favicon: backend/favicon.png)
├── admin/google-login.ts # the login page's "Log in with Google" button
├── api/              # content types (schema.json) + controllers/routes/services
├── components/       # section, element and meta components
├── middlewares/
│   ├── google-login.ts # admin login with Google; passwords off while it's on
│   └── rate-limit.ts
└── utils/
    ├── contact.ts      # contact form validation and the notification email
    ├── rate-limiter.ts # in-memory fixed-window limiter (from Anneta Targalt)
    ├── revalidate.ts   # tells the frontend to clear its cache after content changes
    └── view-configuration.ts # applies admin-fields.ts to the content manager
scripts/
└── content-snapshot.mjs  # content snapshots: make (maintainers) and load
```

## Things to know

- **Revalidation**: a Document Service middleware in `src/index.ts` calls `scheduleFrontendRevalidation()` when what the site shows changes: for types with drafts, on publish, unpublish and delete (and create or update with `status: "published"`, as the REST API does), not on draft saves; for other public types, on every write. Writes to `contact-submission` and `email-config` are excluded in `src/utils/revalidate.ts`; add any new private content type there.
- **The frontend's token**: `bootstrapApiToken()` keeps the "Public API Token" permissions in sync with the list in `src/index.ts` on every boot. A new public content type must be added to that list, or the frontend gets 403s.
- **Private content types** (`contact-submission`, `email-config`) have no REST routes on purpose; editors use the admin. The only public write endpoint is `POST /api/contact`.
- **Rate limits** skip loopback and private addresses, plus any networks in `INTERNAL_NETWORKS`, because the frontend's page renders and its `/uploads` proxy all reach Strapi from one address; a shared bucket would let anyone get the site's own requests refused. Per-address limits only work when `SERVER_PROXY=true` and nginx overwrites `X-Forwarded-For`; in production Strapi refuses to start without it, since it also decides whether the admin's cookies are Secure. An IPv6 address counts as its /64 (`rateLimitKey`), as one connection usually has a whole /64 to pick addresses from.
- **i18n**: `page` and `global` are localized (`et` default, `en`). The blog types are not.
- **Rich text** fields use the Blocks editor (`"type": "blocks"`), never Markdown.
- **Admin labels**: `src/admin-fields.ts` sets every field's label and help text in the content manager on each boot, overwriting edits made under "Configure the view". Add a hint there when you add a field whose purpose isn't obvious from its name.
- **Editor role**: `src/editor-role.ts` rebuilds the Editor role's permissions on each boot: all content in every language and field, media without deleting, contact messages; no Email settings or admin settings. Edits to the role in the admin are overwritten.
- **Admin login**: with `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` set, `src/middlewares/google-login.ts` logs admin users in with their Google Workspace account (`/google-login`, domain from `GOOGLE_WORKSPACE_DOMAIN`), creating the same session Strapi's own login does, and refuses the admin's password routes (`/admin/login`, `register`, `register-admin`, `reset-password`, `forgot-password`) for everyone. They're matched as Strapi's router matches them, ignoring case and a trailing slash; an exact comparison once let `/admin/login/` through. It relies on Strapi's session manager and its default admin cookie names; check it after Strapi upgrades. The login page's button, in place of the password form, is added to the DOM by `src/admin/google-login.ts`, since Strapi has no slot for it.
- **Content snapshots**: `scripts/content-snapshot.mjs` makes a copy of the database for people working on the code, without anything private, plus the uploaded files, and loads it. What it removes is the `SCRUB` list at its top: contact form messages, every account and session, API and transfer tokens, audit logs, content history, webhooks, and the contact form's recipients. **A new content type or table that holds personal data, an account or a secret must be added to that list**, or the next snapshot hands it out. `scripts/` is excluded from the TypeScript build (`tsconfig.json`), so nothing in it reaches `dist/`.
- **Everything in Strapi is in English**: display names, descriptions, field defaults, messages. Only content in the `et` locale is Estonian. Frontend type names come from the UID, so renaming a display name is safe; renaming a file or attribute is not.

## Strapi Conventions

- Use `strapi.documents("api::x.x")` (Document Service) for content types, not `strapi.db.query()` — the latter bypasses draft/publish and i18n logic.
- In controllers, use `ctx.badRequest()`, `ctx.notFound()`, etc. for error responses — throwing errors produces 500s. Pass the status to `ctx.send(body, status)`; its default overwrites `ctx.status`.
- The REST API publishes on create/update unless `?status=draft` is passed.

See root [AGENTS.md](../AGENTS.md) for shared TypeScript conventions.
