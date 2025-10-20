# syntax=docker/dockerfile:1.6

FROM node:20-slim AS base

ENV PNPM_HOME=/usr/local/pnpm
ENV PATH="${PNPM_HOME}:${PATH}"
ENV PNPM_SKIP_CONFIRMATIONS=1

RUN corepack enable

FROM base AS build
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY frontend/package.json frontend/

RUN pnpm fetch --filter ./frontend

COPY frontend ./frontend

RUN pnpm install --filter ./frontend --frozen-lockfile \
    && pnpm --dir frontend run build

FROM base AS production-deps
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY frontend/package.json frontend/

RUN pnpm fetch --filter ./frontend \
    && pnpm install --filter ./frontend --prod --frozen-lockfile

FROM node:20-slim AS runner

ENV NODE_ENV=production
ENV PORT=8080
ENV PNPM_HOME=/usr/local/pnpm
ENV PATH="${PNPM_HOME}:${PATH}"

LABEL org.opencontainers.image.source="https://github.com/democratizedspace/dspace"
LABEL org.opencontainers.image.description="DSPACE v3 Astro runtime"

WORKDIR /app

RUN apt-get update \
    && apt-get install --no-install-recommends -y curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system dspace \
    && useradd --system --create-home --home /app --gid dspace \
        --shell /usr/sbin/nologin dspace

COPY --from=production-deps /app/node_modules ./node_modules
COPY --from=production-deps /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=production-deps /app/frontend/package.json ./frontend/package.json
COPY --from=build /app/frontend/dist ./frontend/dist
COPY apps/runtime ./apps/runtime

USER dspace:dspace

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -fsS http://127.0.0.1:${PORT:-8080}/livez || exit 1

CMD ["node", "--enable-source-maps", "apps/runtime/server.mjs"]
