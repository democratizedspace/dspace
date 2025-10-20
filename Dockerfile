# syntax=docker/dockerfile:1.6

FROM node:20-bookworm-slim AS base
ENV PNPM_HOME=/usr/local/share/pnpm
ENV PATH="${PNPM_HOME}/bin:${PATH}"
ENV NODE_ENV=production
RUN corepack enable && mkdir -p ${PNPM_HOME}

FROM base AS builder
WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        git \
        python3 \
        build-essential \
    && rm -rf /var/lib/apt/lists/*
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter ./frontend... build

FROM node:20-bookworm-slim AS runner
ENV NODE_ENV=production \
    PORT=8080 \
    HOST=0.0.0.0 \
    ASTRO_NODE_AUTOSTART=disabled
WORKDIR /app
RUN groupadd --system --gid 10001 dspace \
    && useradd --system --no-create-home --uid 10001 --gid dspace dspace
COPY --from=builder /app/frontend/dist ./dist
COPY infra/docker/entrypoint.mjs ./entrypoint.mjs
RUN chown -R dspace:dspace /app
USER dspace
EXPOSE 8080
ENTRYPOINT ["node", "entrypoint.mjs"]
