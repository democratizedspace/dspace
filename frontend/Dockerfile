# DEPRECATED: Use the root Dockerfile for production builds.
# This file is provided for backward compatibility and local Docker Compose use only.
# It mirrors the root Dockerfile configuration (port 8080, production server, /healthz probe).
FROM node:20-alpine

# Install required system packages
RUN apk add --no-cache curl dumb-init \
    && mkdir -p /app \
    && chown node:node /app

WORKDIR /app

# Set environment variables for production
ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0

# Note: For local development, use `npm run dev` or `pnpm run dev` directly.
# This Dockerfile builds and runs the production server.

# Copy built artifacts and dependencies (assume pre-built)
# For full builds, use the root Dockerfile which includes multi-stage build.
COPY --chown=node:node dist ./dist
COPY --chown=node:node node_modules ./node_modules
COPY --chown=node:node package.json ./

USER node
EXPOSE 8080

HEALTHCHECK CMD curl -fsS http://127.0.0.1:${PORT:-8080}/healthz > /dev/null || exit 1

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "dist/server/entry.mjs"]
