FROM node:24.22.3-bookworm-slim@sha256:dc26ae92c9fb15cf6b1d63e20f0944b2efe0f115b20e00be48fb23fceb061c54 AS node-runtime
FROM mcr.microsoft.com/playwright:v1.54.2-noble@sha256:18b4bcff4f8ba0ac8c44b09f09def6a4f6cb8579e5f26381c21f38b50935d5d8

# The historical browser image's Node is below the repository's patched floor.
# Copy the native official runtime (not a build-platform/emulated executable).
COPY --from=node-runtime /usr/local/bin/node /usr/local/bin/node
COPY --from=node-runtime /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/npm
RUN ln -sf /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm \
    && ln -sf /usr/local/lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx \
    && node -e "if(process.versions.node !== '24.22.3') process.exit(1)"

ARG RUNNER_REVISION
LABEL org.opencontainers.image.revision=$RUNNER_REVISION
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 PLAYWRIGHT_SKIP_INSTALL_DEPS=1 HUSKY=0
WORKDIR /opt/dspace
# Install only at build time; lifecycle hooks would build unrelated app assets.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY packages ./packages
COPY frontend/package.json ./frontend/package.json
RUN echo "$RUNNER_REVISION" | grep -Eq '^[0-9a-f]{40}$' \
    && npm install --global pnpm@9.0.0 \
    && pnpm install --frozen-lockfile --ignore-scripts --reporter=append-only \
    && node -e "if(require('@playwright/test/package.json').version !== '1.54.2') process.exit(1)"
COPY scripts/run-remote-chat-smoke.mjs scripts/hotfix-302-contract.mjs scripts/remote-chat-smoke-completion.mjs ./scripts/
COPY scripts/fixtures/hotfix-302*-oci-proof.json ./scripts/fixtures/
COPY frontend/e2e ./frontend/e2e
COPY containers/remote-chat-smoke/playwright.config.ts ./frontend/playwright.config.ts
COPY containers/remote-chat-smoke/self-check.mjs ./containers/remote-chat-smoke/self-check.mjs
RUN mkdir /artifacts && chown pwuser:pwuser /artifacts
USER pwuser
ENTRYPOINT ["node", "/opt/dspace/scripts/run-remote-chat-smoke.mjs"]
