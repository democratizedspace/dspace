# syntax=docker/dockerfile:1.6

FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
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
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY frontend/package.json frontend/
RUN pnpm install --filter ./frontend... --frozen-lockfile

FROM deps AS build
COPY frontend frontend
RUN pnpm --filter ./frontend... run build

FROM base AS prod-deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY frontend/package.json frontend/
RUN pnpm install --filter ./frontend... --frozen-lockfile --prod

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
COPY frontend/package.json ./package.json
COPY infra/docker/entrypoint.mjs ./entrypoint.mjs
RUN chown -R node:node /app
USER node
EXPOSE 8080
HEALTHCHECK CMD curl -fsS http://127.0.0.1:${PORT:-8080}/healthz > /dev/null || exit 1
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "entrypoint.mjs"]
