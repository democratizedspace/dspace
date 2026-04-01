# syntax=docker/dockerfile:1.7

ARG DSPACE_VERSION=dev
ARG GIT_SHA=unknown
ARG VITE_GIT_SHA=${GIT_SHA}

FROM node:20-bookworm-slim AS base
ARG DSPACE_VERSION
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV PYTHON="/usr/bin/python3"
ENV DSPACE_VERSION="${DSPACE_VERSION}"
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        ca-certificates \
        curl \
        libjpeg62-turbo-dev \
        libcairo2-dev \
        libfreetype6-dev \
        libgif-dev \
        libpango1.0-dev \
        pkg-config \
        python3 \
    && rm -rf /var/lib/apt/lists/* \
    && ln -sf python3 /usr/bin/python \
    && for attempt in 1 2 3 4 5; do \
        npm install -g pnpm@9.0.0 && break; \
        if [ "$attempt" -eq 5 ]; then \
            echo "Failed to install pnpm after ${attempt} attempts." >&2; \
            exit 1; \
        fi; \
        echo "npm install failed (attempt ${attempt}); retrying..." >&2; \
        sleep $((attempt * 2)); \
    done
WORKDIR /workspace

FROM base AS deps
ARG DSPACE_VERSION
ENV CI=true
ENV HUSKY=0
COPY pnpm-workspace.yaml pnpm-lock.yaml pnpmfile.cjs package.json ./
COPY frontend/package.json frontend/
COPY packages/cache-version/package.json packages/cache-version/
COPY packages/feature-flags/package.json packages/feature-flags/
# Scripts are required for frontend postinstall hooks but we avoid copying build artifacts.
COPY frontend/scripts frontend/scripts
RUN --mount=type=cache,target=/root/.pnpm-store pnpm install --frozen-lockfile

FROM deps AS build
ARG DSPACE_VERSION
ARG GIT_SHA=unknown
ARG VITE_GIT_SHA=${GIT_SHA}
ARG ENFORCE_VITE_GIT_SHA=0
# GIT_SHA should be provided via build args; git is not available in the image to compute it.
RUN if [ "$ENFORCE_VITE_GIT_SHA" = "1" ]; then \
        if [ -z "$VITE_GIT_SHA" ] || [ "$VITE_GIT_SHA" = "unknown" ] || [ "$VITE_GIT_SHA" = "dev-local" ]; then \
            echo "Missing VITE_GIT_SHA build arg; refusing to build frontend assets." >&2; \
            exit 1; \
        fi; \
    fi
ENV VITE_GIT_SHA="${VITE_GIT_SHA}"
# Copy source separately to avoid overlaying host node_modules (pnpm symlinks make this fail when
# node_modules exists on the host). Build artifacts are excluded via .dockerignore for compatibility
# with builders that do not support COPY --exclude flags.
COPY --link frontend/ frontend/
COPY --link packages/cache-version/ packages/cache-version/
COPY --link packages/feature-flags/ packages/feature-flags/
COPY --link scripts/ scripts/
COPY --link docs/ROUTES.md docs/ROUTES.md
RUN node scripts/write-build-meta.mjs
RUN node scripts/build-docs-rag-index.mjs
RUN pnpm --filter ./frontend... run build

FROM base AS prod-deps
ARG DSPACE_VERSION
ENV CI=true
ENV HUSKY=0
COPY pnpm-workspace.yaml pnpm-lock.yaml pnpmfile.cjs package.json ./
COPY frontend/package.json frontend/
COPY packages/cache-version/package.json packages/cache-version/
COPY packages/feature-flags/package.json packages/feature-flags/
COPY frontend/scripts frontend/scripts
RUN --mount=type=cache,target=/root/.pnpm-store pnpm install --filter ./frontend... --frozen-lockfile --prod

FROM base AS runtime
ARG DSPACE_VERSION=dev
ENV DSPACE_VERSION="${DSPACE_VERSION}"
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        dumb-init \
        libexpat1 \
        libpixman-1-0 \
        libpng16-16 \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /app \
    && chown node:node /app
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0
# Copy frontend node_modules symlinks and the root-level .pnpm directory they point to.
# The symlinks in frontend/node_modules point to ../../node_modules/.pnpm/, so we need to
# preserve that structure in the runtime image.
COPY --from=prod-deps /workspace/frontend/node_modules ./node_modules
COPY --from=prod-deps /workspace/node_modules/.pnpm ../node_modules/.pnpm
RUN if [ ! -e /app/node_modules/canvas ]; then \
        CANVAS_DIR="$(find /node_modules/.pnpm -maxdepth 3 -type d -path '*/canvas@*/node_modules/canvas' | head -n 1)"; \
        if [ -z "$CANVAS_DIR" ]; then \
            echo "canvas package was not installed in prod deps" >&2; \
            exit 1; \
        fi; \
        ln -s "$CANVAS_DIR" /app/node_modules/canvas; \
    fi
COPY --from=build /workspace/frontend/dist ./dist
COPY --from=build /workspace/frontend/package.json ./package.json
COPY --from=build /workspace/frontend/src/generated/build_meta.json ./build_meta.json
COPY infra/docker/entrypoint.mjs ./entrypoint.mjs
COPY infra/metrics.mjs ./metrics.mjs
RUN chown -R node:node /app /node_modules
USER node
EXPOSE 8080
HEALTHCHECK CMD curl -fsS http://127.0.0.1:${PORT:-8080}/healthz > /dev/null || exit 1
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "entrypoint.mjs"]
