FROM mcr.microsoft.com/playwright:v1.54.2-noble@sha256:18b4bcff4f8ba0ac8c44b09f09def6a4f6cb8579e5f26381c21f38b50935d5d8

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
RUN mkdir /artifacts && chown pwuser:pwuser /artifacts
USER pwuser
ENTRYPOINT ["node", "/opt/dspace/scripts/run-remote-chat-smoke.mjs"]
