# The site's production image (Next.js), for linux/amd64. Build context: the repo root.
# docker buildx build --platform linux/amd64 -f deploy/site.Dockerfile --build-arg NEXT_PUBLIC_SITE_URL=… .
# The site is built natively ($BUILDPLATFORM), which is much faster than under emulation; only the
# dependencies are installed for the target, so the native ones (sharp, SWC) match it.
FROM --platform=$BUILDPLATFORM node:24-alpine AS build
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN pnpm install --frozen-lockfile --fail-if-no-match --filter ./frontend
COPY frontend frontend
# Inlined at build time: where browsers reach the site and Strapi, and where
# the server fetches content and proxies /uploads from (STRAPI_URL).
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_STRAPI_URL
ARG STRAPI_URL=http://strapi:1337
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_STRAPI_URL=$NEXT_PUBLIC_STRAPI_URL \
    STRAPI_URL=$STRAPI_URL \
    NEXT_STANDALONE=false \
    NEXT_TELEMETRY_DISABLED=1
RUN pnpm --fail-if-no-match --filter ./frontend build

FROM node:24-alpine
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN pnpm install --frozen-lockfile --prod --fail-if-no-match --filter ./frontend
COPY frontend frontend
COPY --from=build /app/frontend/.next frontend/.next
RUN rm -rf frontend/.next/cache && mkdir -p frontend/.next/cache \
  && chown 10006:10006 frontend/.next/cache
ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000 NEXT_STANDALONE=false NEXT_TELEMETRY_DISABLED=1
WORKDIR /app/frontend
USER 10006
EXPOSE 3000
CMD ["node_modules/.bin/next", "start"]
