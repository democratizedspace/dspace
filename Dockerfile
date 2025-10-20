# syntax=docker/dockerfile:1.7
ARG NODE_VERSION=20.19.0

FROM node:${NODE_VERSION}-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=${PNPM_HOME}:${PATH}
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY frontend/package.json frontend/
RUN pnpm install --filter frontend... --frozen-lockfile

FROM deps AS build
COPY . .
RUN pnpm --filter frontend... run build

FROM base AS prod-deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY frontend/package.json frontend/
RUN pnpm install --filter frontend... --frozen-lockfile --prod --ignore-scripts

FROM base AS runner
LABEL org.opencontainers.image.source="https://github.com/democratizedspace/dspace" \
      org.opencontainers.image.title="DSPACE v3" \
      org.opencontainers.image.description="DSPACE v3 Astro application packaged for Kubernetes" \
      org.opencontainers.image.licenses="MIT"

RUN groupadd --system dspace && useradd --system --gid dspace --home-dir /app dspace
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=prod-deps /app/frontend/node_modules ./node_modules
COPY --from=build /app/frontend/dist ./dist
COPY apps/dspace-server/server.mjs ./server.mjs

USER dspace
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/livez').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

CMD ["node", "server.mjs"]
