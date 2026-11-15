# Efektiivne Altruism Eesti — Agent Guide

The organisation's website. Monorepo: Strapi 5 backend (`backend/`) and Next.js 16 frontend (`frontend/`). See [README.md](README.md) for setup and how publishing works.

Ports in development: Strapi **1338**, Next.js **3003**. The production containers use 1337 and 3000.

```bash
pnpm install          # pnpm workspace: one lockfile for both apps
pnpm dev              # both, from the repo root
pnpm generate-types   # after changing any Strapi schema
pnpm lint             # oxlint
pnpm format           # oxfmt (pnpm format:check runs in CI)
pnpm test && pnpm type-check
pnpm test:e2e         # Playwright, e2e/: builds and runs both apps; CI runs it
```

See [backend/AGENTS.md](backend/AGENTS.md) and [frontend/AGENTS.md](frontend/AGENTS.md) for each app, and [e2e/README.md](e2e/README.md) for the end-to-end tests. They take minutes and need `pnpm dev` stopped (they build into `backend/dist`), so leave them to CI unless asked: push a branch and read the `e2e` job.

Setting up a new machine: follow README.md's Setup. Content comes from a content snapshot a maintainer provides (`cd backend && pnpm snapshot:load <file>`); ask for its path rather than creating content. Don't run `snapshot:load` while Strapi is running, and never commit a snapshot.

## Constraints

- Production is a single 2 GB VPS running Strapi (one process), Next.js (one process) and Postgres. The Docker images are built elsewhere, never on the server.
- Editors are non-technical volunteers. Anything they touch in Strapi should be hard to break: fixed sections rather than free layout, clear names, sensible defaults.
- App data that isn't website content (e.g. a volunteer CRM) belongs in its own tables with a purpose-built admin, not in Strapi content types.
- Everything in Strapi is in English (display names, descriptions, field defaults); volunteers speak English. Only content in the Estonian locale is in Estonian.
- The old site's URLs (`/blogi/…`, `/rubriik/…`) are kept on purpose.

## Adding a page section

1. Add the component schema in `backend/src/components/sections/` and list it in the `sections` dynamic zone of `backend/src/api/page/content-types/page/schema.json`.
2. Run `pnpm generate-types`.
3. Add its populate shape to `SECTIONS_POPULATE` in `frontend/src/utils/strapi.ts`.
4. Create the component in `frontend/src/components/sections/` and add it to the switch in `Sections.tsx`.
5. Add its Markdown to `sectionMarkdown()` in `frontend/src/utils/page-markdown.ts` (type-checking fails until you do).
6. Put one on a page in `e2e/stack/content.ts` and check in `e2e/tests/site/pages.spec.ts` that it shows.

## TypeScript Conventions

These apply to both frontend and backend.

- Never use `any` or `as any` — use `unknown` and narrow the type, or define a proper interface.
- Never use `!` (non-null assertion) — always handle nulls explicitly with a guard or fallback.
- Don't use `== null` to check for null/undefined — use truthiness or `typeof x === "number"` etc.
- Use camelCase for variable names.
- **Let TypeScript infer types** — avoid explicit type annotations where the type is already inferrable. Arrow function parameters especially should not have explicit types when inferable from context.
- If you find yourself needing to annotate a callback parameter, that's a signal the source data structure lacks proper typing — fix the source type instead.
- Avoid `as SomeType` assertions broadly, not just `as any` — they silence the compiler the same way. Prefer type guards or narrowing.
