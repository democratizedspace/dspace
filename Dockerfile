# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV PYTHON="/usr/bin/python3"
RUN apk add --no-cache \
        curl \
        python3 \
        build-base \
        pkgconfig \
        cairo-dev \
        pango-dev \
        libjpeg-turbo-dev \
        giflib-dev \
        freetype-dev \
    && ln -sf python3 /usr/bin/python \
    && corepack enable
WORKDIR /workspace

FROM base AS deps
ENV CI=true
ENV HUSKY=0
COPY pnpm-workspace.yaml pnpm-lock.yaml pnpmfile.cjs package.json ./
COPY frontend/package.json frontend/
COPY packages/cache-version/package.json packages/cache-version/
# Scripts are required for frontend postinstall hooks but we avoid copying build artifacts.
COPY frontend/scripts frontend/scripts
RUN --mount=type=cache,target=/root/.pnpm-store pnpm install --filter ./frontend... --frozen-lockfile

FROM deps AS build
# Copy source separately to avoid overlaying host node_modules (pnpm symlinks make this fail when
# node_modules exists on the host). We exclude common build outputs to keep the context lean.
COPY --link \
    --exclude=node_modules \
    --exclude=.turbo \
    --exclude=.astro \
    --exclude=.svelte-kit \
    --exclude=dist \
    --exclude=build \
    frontend/ frontend/
COPY --link packages/cache-version/ packages/cache-version/
RUN pnpm --filter ./frontend... run build

FROM base AS prod-deps
ENV CI=true
ENV HUSKY=0
COPY pnpm-workspace.yaml pnpm-lock.yaml pnpmfile.cjs package.json ./
COPY frontend/package.json frontend/
COPY packages/cache-version/package.json packages/cache-version/
COPY frontend/scripts frontend/scripts
RUN --mount=type=cache,target=/root/.pnpm-store pnpm install --filter ./frontend... --frozen-lockfile --prod

FROM node:20-alpine AS runtime
RUN apk add --no-cache \
        dumb-init \
        curl \
        cairo \
        pango \
        libjpeg-turbo \
        giflib \
        freetype \
    && mkdir -p /app \
    && chown node:node /app
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0
COPY --from=prod-deps /workspace/frontend/node_modules ./node_modules
COPY --from=build /workspace/frontend/dist ./dist
COPY --from=build /workspace/frontend/package.json ./package.json
COPY infra/docker/entrypoint.mjs ./entrypoint.mjs
COPY infra/metrics.mjs /metrics.mjs
RUN chown -R node:node /app
USER node
EXPOSE 8080
HEALTHCHECK CMD curl -fsS http://127.0.0.1:${PORT:-8080}/healthz > /dev/null || exit 1
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "entrypoint.mjs"]
