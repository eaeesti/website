# Strapi for a preview of the site.
# Built on the Mac for linux/amd64 by deploy/preview/deploy.sh; build context: the repo root.
# The admin panel and server code are compiled natively ($BUILDPLATFORM): under emulation that takes
# ages. Only the dependencies are installed for the target, so native ones (sharp) match it.
FROM --platform=$BUILDPLATFORM node:24-alpine AS build
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN pnpm install --frozen-lockfile --fail-if-no-match --filter ./backend
COPY backend backend
ENV NODE_ENV=production
RUN pnpm --fail-if-no-match --filter ./backend exec strapi build

FROM node:24-alpine
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN pnpm install --frozen-lockfile --fail-if-no-match --filter ./backend
COPY backend backend
COPY --from=build /app/backend/dist backend/dist
RUN mkdir -p backend/public/uploads backend/.tmp \
  && chown -R 10006:10006 backend/public/uploads backend/.tmp
ENV NODE_ENV=production
WORKDIR /app/backend
USER 10006
EXPOSE 1337
CMD ["node_modules/.bin/strapi", "start"]
