<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Frontend — Agent Guide

Next.js 16 (App Router) + TypeScript + Tailwind CSS 4. Source in `src/`.

```bash
pnpm dev        # dev server on port 3000
pnpm build      # production build (standalone output)
pnpm type-check
pnpm test       # Vitest: src/utils/__tests__
```

## Source Layout

```
src/
├── app/
│   ├── (et)/                     # root layout <html lang="et">
│   │   ├── [[...slug]]/          # CMS pages, incl. /blogi/lk/2 style listing pages
│   │   ├── blogi/[slug]/         # blog posts
│   │   └── rubriik/[slug]/       # categories (+ lk/[page])
│   ├── (en)/en/[[...slug]]/      # English CMS pages, root layout <html lang="en">
│   ├── api/revalidate/           # called by Strapi after content changes
│   ├── api/preview/              # draft mode on (from Strapi) and off (exit/)
│   └── sitemap.ts, robots.ts
├── components/
│   ├── CmsPage.tsx               # fetches a page and renders its sections
│   ├── blog/                     # post page, category page, cards
│   ├── sections/                 # one component per Strapi section + Sections.tsx switch
│   ├── layout/                   # SiteShell (navbar, footer, banners), PageHeader
│   └── elements/                 # Anchor, Button, StrapiImage, BlocksContent, Pagination
├── types/
│   ├── generated/strapi.ts       # generated from the Strapi schemas — don't edit
│   └── blocks.ts                 # Strapi Blocks JSON
└── utils/
    ├── strapi.ts                 # all Strapi fetches (server-only)
    └── …                         # pure helpers, unit tested
```

## Data and caching

- Every Strapi fetch goes through `strapiFetch()` in `utils/strapi.ts`, tagged `strapi` with a one-hour fallback revalidation. `/api/revalidate` expires the tag immediately (`revalidateTag(tag, { expire: 0 })`).
- Routes return `[]` from `generateStaticParams`, so the build never contacts Strapi and pages are rendered and cached on first visit. Don't use `searchParams`, `cookies()` or `headers()` in pages: they make the route dynamic and turn off caching. Pagination is in the path (`/lk/2`) for this reason.
- In draft mode (`draftMode()`), fetches skip the cache and request `status=draft` for content types that have drafts (`hasDrafts: true`).
- Strapi runs on the same machine; the server reaches it at `STRAPI_URL` (loopback). Browsers only call Strapi for the contact form (`NEXT_PUBLIC_STRAPI_URL`).
- Two sections read other sites' feeds on the server, cached on their own timers: the podcast's RSS (`utils/podcast.ts`, an hour) and the public Google Calendar (`utils/calendar.ts`, 15 minutes; repeating events are expanded with ical.js, times shown in Tallinn).
- Uploaded images are served from `/uploads/…`, which `next.config.ts` rewrites to Strapi, so `next/image` treats them as local images.

## Conventions

- Server components by default; `"use client"` only for interactivity (mobile menu, dropdowns, contact form, banner).
- Rich text is always rendered with `BlocksContent`, which builds React elements from the Blocks JSON and never renders raw HTML. Links go through `Anchor`, which drops unsafe URLs.
- Components are function declarations with a default export; props are a named interface or the generated Strapi type.
- `@/` maps to `src/`.
- Iframes are only allowed for the hosts in `utils/embed.ts`, which also feeds the CSP's `frame-src` in `next.config.ts`.
- The navbar is transparent at the top of the page, over a dark first section marked `data-nav-overlay` (the hero, page headers, blog post headers). Such a section must leave room for it with `pt-[calc(var(--nav-height)+…)]`. Pages that start with anything else get a solid navbar and top padding automatically (`globals.css`).
- The site sets no cookies (Plausible and Umami are cookieless), so it needs no cookie banner. Keep it that way: third-party embeds load only after a click, since they contact their site and may set cookies as soon as they load. Players, calendars and other iframes go through `elements/ClickToLoad.tsx` (a YouTube still is fetched by the image optimizer, so the browser doesn't reach YouTube first); the newsletter form has its own button (`NewsletterForm.tsx`).
- Headings follow the page outline: a section's items are `h3` under its own `h2` title, and `h2` when the section has no title (`EventsSection`, `PodcastSection`, `PostGrid`'s `headingLevel`).
- Links to other sites get an icon with `<Anchor externalIcon>`; buttons and rich text do this already.

See root [AGENTS.md](../AGENTS.md) for shared TypeScript conventions.

## Known issues

- Next.js 16.3 sends `notFound()` responses as an empty `<html id="__next_error__">` document with the correct 404 status. The real 404 page, from the route's `not-found.tsx`, is rendered in the browser from the RSC payload. Visitors see the proper page, but clients without JavaScript get a blank one. annetatargalt.ee behaves the same way, so it isn't specific to this app's two root layouts.
